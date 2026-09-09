import pytest
import uuid
from decimal import Decimal
from datetime import datetime

from app.core.utils.datetime import utc_now
from app.modules.finance.models import Wallet, Category
from app.modules.finance.repositories import WalletRepository, CategoryRepository


def test_wallet_tenant_isolation(db_session):
    """Proves User A cannot access User B's wallet through the repository."""
    repo = WalletRepository()
    user_a = uuid.uuid4()
    user_b = uuid.uuid4()

    # The test (acting as Service) controls the transaction
    wallet_a = Wallet(user_id=user_a, name="User A Wallet", balance=Decimal("100.00"))
    repo.add(wallet_a)
    db_session.commit()

    # User A fetching their own wallet works
    fetched_a = repo.get_active_by_id(wallet_a.id, user_a)
    assert fetched_a is not None
    assert fetched_a.id == wallet_a.id

    # User B attempting to fetch User A's wallet returns None (Isolated)
    fetched_b = repo.get_active_by_id(wallet_a.id, user_b)
    assert fetched_b is None


def test_wallet_soft_delete_masking(db_session):
    """Proves soft-deleted wallets are completely masked from active reads."""
    repo = WalletRepository()
    user_id = uuid.uuid4()

    wallet = Wallet(user_id=user_id, name="Temp Wallet")
    repo.add(wallet)
    db_session.commit()

    # Read successful while active
    assert repo.get_active_by_id(wallet.id, user_id) is not None

    # Apply soft-delete
    wallet.deleted_at = utc_now()
    db_session.commit()

    # Read masked after soft-delete
    assert repo.get_active_by_id(wallet.id, user_id) is None


def test_category_tenant_isolation(db_session):
    """Proves User A cannot access User B's category."""
    repo = CategoryRepository()
    user_a = uuid.uuid4()
    user_b = uuid.uuid4()

    category_a = Category(user_id=user_a, name="Groceries")
    repo.add(category_a)
    db_session.commit()

    assert repo.get_active_by_id(category_a.id, user_a) is not None
    assert repo.get_active_by_id(category_a.id, user_b) is None


def test_category_get_active_by_ids(db_session):
    """
    Proves bulk retrieval honors both tenant isolation AND soft-deletes simultaneously.
    (Phase 8 Bulk Validation Requirement)
    """
    repo = CategoryRepository()
    user_a = uuid.uuid4()
    user_b = uuid.uuid4()

    # Setup: User A has 2 active, 1 deleted. User B has 1 active.
    cat_a1 = Category(user_id=user_a, name="Food")
    cat_a2 = Category(user_id=user_a, name="Transport")
    cat_a_deleted = Category(user_id=user_a, name="Old", deleted_at=utc_now())
    cat_b1 = Category(user_id=user_b, name="Entertainment")
    
    for c in [cat_a1, cat_a2, cat_a_deleted, cat_b1]:
        repo.add(c)
    db_session.commit()

    # Requesting all IDs, but acting as User A
    requested_ids = [cat_a1.id, cat_a2.id, cat_a_deleted.id, cat_b1.id]
    
    results = repo.get_active_categories_by_ids(user_a, requested_ids)
    
    # Assert exactly 2 are returned: cat_a1 and cat_a2
    assert len(results) == 2
    returned_ids = {cat.id for cat in results}
    assert cat_a1.id in returned_ids
    assert cat_a2.id in returned_ids
    assert cat_a_deleted.id not in returned_ids # Blocked by soft-delete
    assert cat_b1.id not in returned_ids # Blocked by tenant isolation