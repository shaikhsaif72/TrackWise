import uuid
import enum
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    ForeignKey,
    String,
    Numeric,
    Boolean,
    Integer,
    Date,
    DateTime,
    UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.core.models import BaseModel


class TransactionType(str, enum.Enum):
    INCOME = "INCOME"
    EXPENSE = "EXPENSE"


class Wallet(BaseModel):
    __tablename__ = "wallets"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    balance: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False, default=Decimal("0.00"))
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")


class Category(BaseModel):
    __tablename__ = "categories"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)


class Transaction(BaseModel):
    __tablename__ = "transactions"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), nullable=False, index=True)
    wallet_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("wallets.id"), nullable=False)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    type: Mapped[TransactionType] = mapped_column(nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    transaction_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Relationships explicitly omitting delete-orphan cascade to preserve financial audit trails
    wallet: Mapped[Wallet] = relationship(cascade="save-update")
    category: Mapped[Optional[Category]] = relationship(cascade="save-update")


class Budget(BaseModel):
    __tablename__ = "budgets"

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), nullable=False, index=True)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    category: Mapped[Optional[Category]] = relationship(cascade="save-update")


class BudgetAlert(BaseModel):
    __tablename__ = "budget_alerts"
    __table_args__ = (
        UniqueConstraint("budget_id", "threshold_type", name="uq_budget_alert_threshold"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), nullable=False, index=True)
    budget_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("budgets.id"), nullable=False)
    threshold_type: Mapped[int] = mapped_column(Integer, nullable=False)
    budget_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    spent_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    percentage_used: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    budget: Mapped[Budget] = relationship(cascade="save-update")