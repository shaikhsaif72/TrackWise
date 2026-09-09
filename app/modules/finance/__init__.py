"""
Finance Module Initialization.
Imports models to ensure SQLAlchemy metadata registration for Alembic migrations.
"""

from app.modules.finance.models import (
    Wallet,
    Category,
    Transaction,
    Budget,
    BudgetAlert
)