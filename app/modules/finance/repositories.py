import uuid
from typing import Sequence, Optional, Tuple
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import select, func

from app.extensions import db
from app.core.repositories import BaseRepository
from app.modules.finance.models import Wallet, Category, Transaction, TransactionType, Budget, BudgetAlert


class WalletRepository(BaseRepository[Wallet]):
    """Data access layer for Wallets. Strictly isolated by user_id and soft-deletes."""
    
    def __init__(self):
        super().__init__(Wallet)

    def get_active_by_id(self, entity_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Wallet]:
        """Fetches a specific active wallet strictly belonging to the tenant."""
        stmt = select(Wallet).where(
            Wallet.id == entity_id,
            Wallet.user_id == user_id,
            Wallet.deleted_at.is_(None)
        )
        return db.session.execute(stmt).scalar_one_or_none()

    def get_all_active_by_user(self, user_id: uuid.UUID) -> Sequence[Wallet]:
        """Fetches all active wallets belonging to the tenant."""
        stmt = select(Wallet).where(
            Wallet.user_id == user_id,
            Wallet.deleted_at.is_(None)
        )
        return db.session.execute(stmt).scalars().all()


class CategoryRepository(BaseRepository[Category]):
    """Data access layer for Categories. Strictly isolated by user_id and soft-deletes."""
    
    def __init__(self):
        super().__init__(Category)

    def get_active_by_id(self, entity_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Category]:
        """Fetches a specific active category strictly belonging to the tenant."""
        stmt = select(Category).where(
            Category.id == entity_id,
            Category.user_id == user_id,
            Category.deleted_at.is_(None)
        )
        return db.session.execute(stmt).scalar_one_or_none()

    def get_all_active_by_user(self, user_id: uuid.UUID) -> Sequence[Category]:
        """Fetches all active categories belonging to the tenant."""
        stmt = select(Category).where(
            Category.user_id == user_id,
            Category.deleted_at.is_(None)
        )
        return db.session.execute(stmt).scalars().all()

    def get_active_categories_by_ids(self, user_id: uuid.UUID, category_ids: list[uuid.UUID]) -> Sequence[Category]:
        """
        Phase 8 additive method: Fetches multiple categories by ID.
        Ensures all returned categories actively belong to the user.
        """
        if not category_ids:
            return []
            
        stmt = select(Category).where(
            Category.user_id == user_id,
            Category.id.in_(category_ids),
            Category.deleted_at.is_(None)
        )
        return db.session.execute(stmt).scalars().all()


class TransactionRepository(BaseRepository[Transaction]):
    """Data access layer for Transactions. Strictly isolated by user_id and soft-deletes."""
    
    def __init__(self):
        super().__init__(Transaction)

    def get_active_by_id(self, entity_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Transaction]:
        stmt = select(Transaction).where(
            Transaction.id == entity_id,
            Transaction.user_id == user_id,
            Transaction.deleted_at.is_(None)
        )
        return db.session.execute(stmt).scalar_one_or_none()

    def get_all_active_by_user(self, user_id: uuid.UUID) -> Sequence[Transaction]:
        stmt = select(Transaction).where(
            Transaction.user_id == user_id,
            Transaction.deleted_at.is_(None)
        )
        return db.session.execute(stmt).scalars().all()

    def get_active_by_user_and_date_range(
        self, user_id: uuid.UUID, start_datetime: datetime, end_datetime: datetime
    ) -> Sequence[Transaction]:
        stmt = select(Transaction).where(
            Transaction.user_id == user_id,
            Transaction.transaction_date >= start_datetime,
            Transaction.transaction_date <= end_datetime,
            Transaction.deleted_at.is_(None)
        )
        return db.session.execute(stmt).scalars().all()

    def get_expense_total_by_user_and_date_range(
        self, user_id: uuid.UUID, start_datetime: datetime, end_datetime: datetime
    ) -> Decimal:
        stmt = select(func.sum(Transaction.amount)).where(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.EXPENSE,
            Transaction.transaction_date >= start_datetime,
            Transaction.transaction_date <= end_datetime,
            Transaction.deleted_at.is_(None)
        )
        result = db.session.execute(stmt).scalar()
        return result if result is not None else Decimal("0.00")

    def get_income_total_by_user_and_date_range(
        self, user_id: uuid.UUID, start_datetime: datetime, end_datetime: datetime
    ) -> Decimal:
        stmt = select(func.sum(Transaction.amount)).where(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.INCOME,
            Transaction.transaction_date >= start_datetime,
            Transaction.transaction_date <= end_datetime,
            Transaction.deleted_at.is_(None)
        )
        result = db.session.execute(stmt).scalar()
        return result if result is not None else Decimal("0.00")

    def get_expense_total_by_category_and_date_range(
        self, user_id: uuid.UUID, category_id: uuid.UUID, start_datetime: datetime, end_datetime: datetime
    ) -> Decimal:
        stmt = select(func.sum(Transaction.amount)).where(
            Transaction.user_id == user_id,
            Transaction.category_id == category_id,
            Transaction.type == TransactionType.EXPENSE,
            Transaction.transaction_date >= start_datetime,
            Transaction.transaction_date <= end_datetime,
            Transaction.deleted_at.is_(None)
        )
        result = db.session.execute(stmt).scalar()
        return result if result is not None else Decimal("0.00")

    def get_expense_totals_grouped_by_category(
        self, user_id: uuid.UUID, start_datetime: datetime, end_datetime: datetime
    ) -> Sequence[Tuple[Optional[uuid.UUID], Decimal]]:
        """
        Phase 8 Analytics: Returns a list of (category_id, total_amount) tuples.
        Null category_ids represent uncategorized expenses.
        """
        stmt = select(Transaction.category_id, func.sum(Transaction.amount)).where(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.EXPENSE,
            Transaction.transaction_date >= start_datetime,
            Transaction.transaction_date <= end_datetime,
            Transaction.deleted_at.is_(None)
        ).group_by(Transaction.category_id)
        return db.session.execute(stmt).all()


class BudgetRepository(BaseRepository[Budget]):
    """Data access layer for Budgets. Strictly isolated by user_id and soft-deletes."""
    
    def __init__(self):
        super().__init__(Budget)

    def get_active_by_id(self, entity_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Budget]:
        stmt = select(Budget).where(
            Budget.id == entity_id,
            Budget.user_id == user_id,
            Budget.deleted_at.is_(None)
        )
        return db.session.execute(stmt).scalar_one_or_none()

    def get_all_active_by_user(self, user_id: uuid.UUID) -> Sequence[Budget]:
        stmt = select(Budget).where(
            Budget.user_id == user_id,
            Budget.deleted_at.is_(None)
        )
        return db.session.execute(stmt).scalars().all()

    def get_active_budgets_by_category(
        self, user_id: uuid.UUID, category_id: uuid.UUID
    ) -> Sequence[Budget]:
        stmt = select(Budget).where(
            Budget.user_id == user_id,
            Budget.category_id == category_id,
            Budget.deleted_at.is_(None)
        )
        return db.session.execute(stmt).scalars().all()

    def get_active_budgets_overlapping_date_range(
        self, user_id: uuid.UUID, start_date: date, end_date: date
    ) -> Sequence[Budget]:
        """
        Retrieves budgets that overlap with the requested interval.
        Formula: budget.start <= request.end AND budget.end >= request.start
        """
        stmt = select(Budget).where(
            Budget.user_id == user_id,
            Budget.start_date <= end_date,
            Budget.end_date >= start_date,
            Budget.deleted_at.is_(None)
        )
        return db.session.execute(stmt).scalars().all()


class BudgetAlertRepository(BaseRepository[BudgetAlert]):
    """Data access layer for BudgetAlerts. Strictly isolated by user_id and soft-deletes."""
    
    def __init__(self):
        super().__init__(BudgetAlert)

    def get_active_by_id(self, entity_id: uuid.UUID, user_id: uuid.UUID) -> Optional[BudgetAlert]:
        stmt = select(BudgetAlert).where(
            BudgetAlert.id == entity_id,
            BudgetAlert.user_id == user_id,
            BudgetAlert.deleted_at.is_(None)
        )
        return db.session.execute(stmt).scalar_one_or_none()

    def get_active_alerts_by_budget(
        self, budget_id: uuid.UUID, user_id: uuid.UUID
    ) -> Sequence[BudgetAlert]:
        stmt = select(BudgetAlert).where(
            BudgetAlert.budget_id == budget_id,
            BudgetAlert.user_id == user_id,
            BudgetAlert.deleted_at.is_(None)
        )
        return db.session.execute(stmt).scalars().all()

    def get_active_by_budget_and_threshold(
        self, budget_id: uuid.UUID, threshold_type: int, user_id: uuid.UUID
    ) -> Optional[BudgetAlert]:
        """
        Looks up a specific active alert for idempotency checks.
        """
        stmt = select(BudgetAlert).where(
            BudgetAlert.budget_id == budget_id,
            BudgetAlert.threshold_type == threshold_type,
            BudgetAlert.user_id == user_id,
            BudgetAlert.deleted_at.is_(None)
        )
        return db.session.execute(stmt).scalar_one_or_none()