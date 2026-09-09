import uuid
from decimal import Decimal
from datetime import datetime, time
from typing import Dict, Any
from zoneinfo import ZoneInfo

from app.core.exceptions import APIException
from app.modules.finance.repositories import TransactionRepository
from app.modules.finance.services.budget_service import BudgetService


class BudgetAnalyticsService:
    def __init__(self, txn_repo=None, budget_service=None):
        self.txn_repo = txn_repo or TransactionRepository()
        self.budget_service = budget_service or BudgetService()

    def _get_utc_boundaries(
        self,
        start_date,
        end_date,
        timezone_str: str
    ) -> tuple[datetime, datetime]:

        try:
            tz = ZoneInfo(timezone_str)
        except Exception:
            raise APIException("Invalid timezone string.", status_code=400)

        start_dt = datetime.combine(
            start_date,
            time.min,
            tzinfo=tz
        )

        end_dt = datetime.combine(
            end_date,
            time.max,
            tzinfo=tz
        )

        utc_start = start_dt.astimezone(ZoneInfo("UTC"))
        utc_end = end_dt.astimezone(ZoneInfo("UTC"))

        return utc_start, utc_end

    def calculate_health(self, percentage_used: Decimal) -> str:
        if percentage_used < Decimal("80.00"):
            return "UNDER_BUDGET"
        elif percentage_used < Decimal("100.00"):
            return "NEAR_LIMIT"
        return "OVER_BUDGET"

    def get_budget_spending_summary(
        self,
        budget_id: uuid.UUID,
        user_id: uuid.UUID,
        timezone_str: str
    ) -> Dict[str, Any]:

        budget = self.budget_service.get_budget(
            budget_id,
            user_id
        )

        utc_start, utc_end = self._get_utc_boundaries(
            budget.start_date,
            budget.end_date,
            timezone_str
        )

        # Calculate total expenses
        if budget.category_id is not None:
            expense = self.txn_repo.get_expense_total_by_category_and_date_range(
                user_id,
                budget.category_id,
                utc_start,
                utc_end
            )
        else:
            expense = self.txn_repo.get_expense_total_by_user_and_date_range(
                user_id,
                utc_start,
                utc_end
            )

        # Calculate total income
        income = self.txn_repo.get_income_total_by_user_and_date_range(
            user_id,
            utc_start,
            utc_end
        )

        # Net spending = expenses - income
        spent = expense - income

        # Spending cannot be negative
        if spent < Decimal("0.00"):
            spent = Decimal("0.00")

        # Calculate remaining budget
        remaining = budget.amount - spent

        # Calculate percentage used
        percentage_used = (
            spent / budget.amount
        ) * Decimal("100.00")

        percentage_used = percentage_used.quantize(
            Decimal("0.01")
        )

        return {
            "budget_id": budget.id,
            "category_id": budget.category_id,
            "budget_amount": budget.amount,
            "spent_amount": spent,
            "remaining_amount": remaining,
            "percentage_used": percentage_used,
            "health": self.calculate_health(percentage_used)
        }