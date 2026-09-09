import pytest
import uuid
from decimal import Decimal
from datetime import datetime, timezone
from app.core.exceptions import APIException
from app.modules.finance.services.wallet_service import WalletService
from app.modules.finance.services.category_service import CategoryService
from app.modules.finance.services.transaction_service import TransactionService
from app.modules.finance.models import TransactionType

@pytest.fixture
def setup_services():
    return TransactionService(), WalletService(), CategoryService()

def test_transaction_service_flow(db_session, setup_services):
    txn_svc, wallet_svc, cat_svc = setup_services
    user_id = uuid.uuid4()
    
    wallet = wallet_svc.create_wallet(user_id, "Test", Decimal("500.00"))
    cat = cat_svc.create_category(user_id, "Test Cat")
    
    # Create Expense -> Wallet decreases
    txn = txn_svc.create_transaction(
        user_id=user_id, wallet_id=wallet.id, category_id=cat.id,
        type=TransactionType.EXPENSE, amount=Decimal("100.00"), transaction_date=datetime.now(timezone.utc)
    )
    assert wallet_svc.get_wallet(wallet.id, user_id).balance == Decimal("400.00")
    
    # Update Transaction -> Switch to Income 200 -> Reverses -100 (+100), Applies +200
    txn_svc.update_transaction(
        txn.id, user_id, type=TransactionType.INCOME, amount=Decimal("200.00")
    )
    assert wallet_svc.get_wallet(wallet.id, user_id).balance == Decimal("700.00")
    
    # Update Transaction -> Remove category explicitly
    txn_svc.update_transaction(txn.id, user_id, category_id=None)
    assert txn_svc.get_transaction(txn.id, user_id).category_id is None
    
    # Soft Delete -> Reverses +200 (-200) -> 500
    txn_svc.delete_transaction(txn.id, user_id)
    assert wallet_svc.get_wallet(wallet.id, user_id).balance == Decimal("500.00")

def test_transaction_atomic_update_failure(db_session, setup_services):
    txn_svc, wallet_svc, cat_svc = setup_services
    user_id = uuid.uuid4()
    
    wallet = wallet_svc.create_wallet(user_id, "Test", Decimal("100.00"))
    txn = txn_svc.create_transaction(
        user_id=user_id, wallet_id=wallet.id,
        type=TransactionType.EXPENSE, amount=Decimal("40.00"), transaction_date=datetime.now(timezone.utc)
    )
    assert wallet_svc.get_wallet(wallet.id, user_id).balance == Decimal("60.00")
    
    # Force an update failure via negative amount
    with pytest.raises(APIException):
        txn_svc.update_transaction(txn.id, user_id, amount=Decimal("-10.00"))
        
    db_session.rollback()
    
    # Confirm wallet balance was not partially mutated by the failed update
    assert wallet_svc.get_wallet(wallet.id, user_id).balance == Decimal("60.00")