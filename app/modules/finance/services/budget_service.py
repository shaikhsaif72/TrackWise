import uuid
from decimal import Decimal
from datetime import date
from typing import Sequence
from app.extensions import db
from app.core.exceptions import APIException
from app.core.constants import MISSING
from app.core.utils.datetime import utc_now
from app.modules.finance.models import Budget
from app.modules.finance.repositories import BudgetRepository
from app.modules.finance.services.category_service import CategoryService


class BudgetService:
    def __init__(self, budget_repo=None, category_service=None):
        self.budget_repo = budget_repo or BudgetRepository()
        self.category_service = category_service or CategoryService()

    def _validate_dates(self, start_date: date, end_date: date):
        if start_date > end_date:
            raise APIException("Start date cannot be after end date.", status_code=400)

    def _ensure_no_overlap(self, user_id: uuid.UUID, category_id: uuid.UUID, start_date: date, end_date: date, exclude_budget_id: uuid.UUID = None):
        """
        Validates that a budget does not overlap with another budget of the EXACT same configuration.
        UNRESOLVED CONTRACT NOTE: Cross-configuration overlap semantics (e.g. Overall vs Category) 
        are not explicitly frozen. This strictly prevents identical structural overlaps.
        """
        overlaps = self.budget_repo.get_active_budgets_overlapping_date_range(user_id, start_date, end_date)
        for b in overlaps:
            if exclude_budget_id and b.id == exclude_budget_id:
                continue
            if b.category_id == category_id:
                raise APIException("An overlapping budget for this category/overall configuration already exists.", status_code=400)

    def create_budget(
        self, user_id: uuid.UUID, amount: Decimal, start_date: date, end_date: date, category_id: uuid.UUID = None
    ) -> Budget:
        amount_dec = Decimal(amount)
        if amount_dec <= Decimal("0.00"):
            raise APIException("Budget amount must be strictly positive.", status_code=400)
            
        self._validate_dates(start_date, end_date)

        if category_id:
            self.category_service.get_category(category_id, user_id)

        self._ensure_no_overlap(user_id, category_id, start_date, end_date)

        budget = Budget(
            user_id=user_id,
            category_id=category_id,
            amount=amount_dec,
            start_date=start_date,
            end_date=end_date,
            is_active=True
        )
        self.budget_repo.add(budget)

        try:
            db.session.commit()
            return budget
        except Exception:
            db.session.rollback()
            raise APIException("Failed to create budget.", status_code=500)

    def get_budget(self, budget_id: uuid.UUID, user_id: uuid.UUID) -> Budget:
        budget = self.budget_repo.get_active_by_id(budget_id, user_id)
        if not budget:
            raise APIException("Budget not found.", status_code=404)
        return budget

    def get_all_budgets(self, user_id: uuid.UUID) -> Sequence[Budget]:
        return self.budget_repo.get_all_active_by_user(user_id)

    def update_budget(
        self, budget_id: uuid.UUID, user_id: uuid.UUID, 
        amount=MISSING, start_date=MISSING, end_date=MISSING, is_active=MISSING
    ) -> Budget:
        budget = self.get_budget(budget_id, user_id)

        new_amount = Decimal(amount) if amount is not MISSING else budget.amount
        if new_amount <= Decimal("0.00"):
            raise APIException("Budget amount must be strictly positive.", status_code=400)

        new_start = start_date if start_date is not MISSING else budget.start_date
        new_end = end_date if end_date is not MISSING else budget.end_date
        self._validate_dates(new_start, new_end)
        
        # Check overlaps if dates changed
        if start_date is not MISSING or end_date is not MISSING:
            self._ensure_no_overlap(user_id, budget.category_id, new_start, new_end, exclude_budget_id=budget.id)

        budget.amount = new_amount
        budget.start_date = new_start
        budget.end_date = new_end
        
        if is_active is not MISSING:
            budget.is_active = bool(is_active)

        try:
            db.session.commit()
            return budget
        except Exception:
            db.session.rollback()
            raise APIException("Failed to update budget.", status_code=500)

    def delete_budget(self, budget_id: uuid.UUID, user_id: uuid.UUID) -> None:
        budget = self.get_budget(budget_id, user_id)
        budget.deleted_at = utc_now()
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise APIException("Failed to delete budget.", status_code=500)