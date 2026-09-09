import pytest
import uuid
from decimal import Decimal
from app.core.exceptions import APIException
from app.modules.finance.services.wallet_service import WalletService

def test_wallet_service_crud(db_session):
    service = WalletService()
    user_id = uuid.uuid4()

    # Create
    wallet = service.create_wallet(user_id, "Checking", Decimal("100.00"))
    assert wallet.id is not None
    assert wallet.balance == Decimal("100.00")
    
    # Retrieve
    fetched = service.get_wallet(wallet.id, user_id)
    assert fetched.id == wallet.id
    
    # Tenant Isolation
    with pytest.raises(APIException) as exc:
        service.get_wallet(wallet.id, uuid.uuid4())
    assert exc.value.status_code == 404
    
    # Update
    updated = service.update_wallet(wallet.id, user_id, name="Main Checking")
    assert updated.name == "Main Checking"
    
    # Delete (Soft)
    service.delete_wallet(wallet.id, user_id)
    with pytest.raises(APIException):
        service.get_wallet(wallet.id, user_id)