import pytest
import uuid
from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError

from app.modules.finance.models import Wallet, Category, Transaction, TransactionType
from app.core.utils.datetime import utc_now

@pytest.fixture
def test_wallet(db_session):
    wallet = Wallet(user_id=uuid.uuid4(), name="Test Wallet")
    db_session.add(wallet)
    db_session.commit()
    return wallet

@pytest.fixture
def test_category(db_session, test_wallet):
    category = Category(user_id=test_wallet.user_id, name="Test Category")
    db_session.add(category)
    db_session.commit()
    return category

def test_transaction_with_category(db_session, test_wallet, test_category):
    """Verifies a fully populated Transaction with valid foreign keys."""
    txn = Transaction(
        user_id=test_wallet.user_id,
        wallet_id=test_wallet.id,
        category_id=test_category.id,
        type=TransactionType.EXPENSE,
        amount=Decimal("50.00"),
        transaction_date=utc_now(),
        description="Lunch"
    )
    db_session.add(txn)
    db_session.commit()

    assert isinstance(txn.id, uuid.UUID)
    assert txn.wallet_id == test_wallet.id
    assert txn.category_id == test_category.id
    assert txn.amount == Decimal("50.00")
    assert txn.transaction_date.tzinfo is not None

def test_transaction_without_category(db_session, test_wallet):
    """Verifies nullable category_id for uncategorized transactions."""
    txn = Transaction(
        user_id=test_wallet.user_id,
        wallet_id=test_wallet.id,
        category_id=None,
        type=TransactionType.INCOME,
        amount=Decimal("1000.00"),
        transaction_date=utc_now()
    )
    db_session.add(txn)
    db_session.commit()

    assert txn.id is not None
    assert txn.category_id is None
    assert txn.amount == Decimal("1000.00")

def test_transaction_invalid_wallet_fk(db_session, test_wallet):
    """Verifies PostgreSQL physically enforces the wallet_id foreign key."""
    fake_wallet_id = uuid.uuid4()
    txn = Transaction(
        user_id=test_wallet.user_id,
        wallet_id=fake_wallet_id,
        type=TransactionType.EXPENSE,
        amount=Decimal("10.00"),
        transaction_date=utc_now()
    )
    db_session.add(txn)
    
    with pytest.raises(IntegrityError):
        db_session.commit()
        
    # Clear the aborted transaction state
    db_session.rollback()