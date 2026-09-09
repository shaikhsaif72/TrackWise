import pytest
import uuid
from decimal import Decimal
from datetime import datetime
from sqlalchemy.exc import IntegrityError, DataError

from app.modules.finance.models import Wallet, Category

def test_wallet_creation_and_defaults(db_session):
    """Verifies successful Wallet creation, UUID PK generation, and DB defaults."""
    wallet = Wallet(
        user_id=uuid.uuid4(),
        name="Main Checking"
        # balance and currency omitted to test defaults
    )
    db_session.add(wallet)
    db_session.commit()

    # Verify UUID identity
    assert isinstance(wallet.id, uuid.UUID)
    
    # Verify defaults applied by DB/ORM
    assert wallet.balance == Decimal("0.00")
    assert wallet.currency == "USD"
    
    # Verify TZ-aware timestamps from BaseModel
    assert isinstance(wallet.created_at, datetime)
    assert wallet.created_at.tzinfo is not None
    assert wallet.deleted_at is None

def test_wallet_numeric_precision(db_session):
    """Verifies PostgreSQL Numeric(15,2) perfectly preserves decimal scale without float coercion."""
    wallet = Wallet(
        user_id=uuid.uuid4(),
        name="Savings",
        balance=Decimal("12345.67")
    )
    db_session.add(wallet)
    db_session.commit()

    # Refresh to ensure we get the DB-persisted value
    db_session.refresh(wallet)
    assert wallet.balance == Decimal("12345.67")
    assert isinstance(wallet.balance, Decimal)

def test_wallet_missing_user_id(db_session):
    """Verifies tenant isolation constraint (user_id NOT NULL)."""
    wallet = Wallet(name="Orphaned Wallet")
    db_session.add(wallet)
    
    with pytest.raises(IntegrityError):
        db_session.commit()
    
    # Clear the aborted transaction state
    db_session.rollback()

def test_category_creation(db_session):
    """Verifies successful Category creation."""
    category = Category(
        user_id=uuid.uuid4(),
        name="Groceries"
    )
    db_session.add(category)
    db_session.commit()

    assert isinstance(category.id, uuid.UUID)
    assert category.name == "Groceries"
    assert category.deleted_at is None