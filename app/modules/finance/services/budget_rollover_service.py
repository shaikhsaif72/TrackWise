import uuid
from decimal import Decimal
from typing import List, Dict, Any

from app.extensions import db
from app.core.exceptions import APIException
from app.modules.finance.models import Budget
from app.modules.finance.repositories import BudgetRepository
from app.modules.finance.services.budget_analytics_service import BudgetAnalyticsService


class BudgetRolloverService:

    def __init__(self, budget_repo=None, analytics_service=None):
        self.budget_repo = budget_repo or BudgetRepository()
        self.analytics_service = analytics_service or BudgetAnalyticsService()

    def execute_bulk_rollover(
        self,
        user_id: uuid.UUID,
        rollover_instructions: List[Dict[str, Any]]
    ) -> List[Budget]:

        if not rollover_instructions:
            return []

        # Get all active budgets so we can find the previous budget
        existing_budgets = list(
            self.budget_repo.get_all_active_by_user(user_id)
        )

        valid_budgets = []

        for req in rollover_instructions:

            category_id = req.get("category_id")
            new_start = req["new_start_date"]
            new_end = req["new_end_date"]
            new_amount = Decimal(req["new_amount"])

            # Validate
            if new_start > new_end:
                continue

            if new_amount <= Decimal("0.00"):
                continue

            # Find the latest previous budget
            previous_budget = None

            for budget in existing_budgets:

                if budget.category_id != category_id:
                    continue

                if budget.end_date < new_start:

                    if (
                        previous_budget is None
                        or budget.end_date > previous_budget.end_date
                    ):
                        previous_budget = budget

            # Calculate unspent amount
            rollover_amount = Decimal("0.00")

            if previous_budget is not None:

                summary = self.analytics_service.get_budget_spending_summary(
                    previous_budget.id,
                    user_id,
                    "UTC"
                )

                rollover_amount = summary["remaining_amount"]

                if rollover_amount < Decimal("0.00"):
                    rollover_amount = Decimal("0.00")

            # Old unspent + new amount
            final_amount = rollover_amount + new_amount

            # Check overlap with existing budgets
            conflict = False

            for budget in existing_budgets:

                if budget.category_id != category_id:
                    continue

                if (
                    budget.start_date <= new_end
                    and budget.end_date >= new_start
                ):
                    conflict = True
                    break

            # Check overlap with budgets created in this batch
            if not conflict:

                for budget in valid_budgets:

                    if budget.category_id != category_id:
                        continue

                    if (
                        budget.start_date <= new_end
                        and budget.end_date >= new_start
                    ):
                        conflict = True
                        break

            if conflict:
                continue

            # Create new budget
            new_budget = Budget(
                user_id=user_id,
                category_id=category_id,
                amount=final_amount,
                start_date=new_start,
                end_date=new_end,
                is_active=True
            )

            valid_budgets.append(new_budget)

        if not valid_budgets:
            return []

        try:

            for budget in valid_budgets:
                self.budget_repo.add(budget)

            db.session.commit()

            return valid_budgets

        except Exception:

            db.session.rollback()

            raise APIException(
                "Failed to execute bulk rollover.",
                status_code=500
            )