import pytest
import uuid
from decimal import Decimal
from datetime import timedelta

from app.core.utils.datetime import utc_now
from app.modules.finance.models import Wallet, Category, Transaction, TransactionType
from app.modules.finance.repositories import TransactionRepository


@pytest.fixture
def setup_users(db_session):
    user_a = uuid.uuid4()
    user_b = uuid.uuid4()
    
    wallet_a = Wallet(user_id=user_a, name="Wallet A")
    cat_a = Category(user_id=user_a, name="Category A")
    wallet_b = Wallet(user_id=user_b, name="Wallet B")
    
    db_session.add_all([wallet_a, cat_a, wallet_b])
    db_session.commit()
    
    return user_a, user_b, wallet_a, cat_a, wallet_b


def test_transaction_tenant_isolation_and_date_ranges(db_session, setup_users):
    user_a, user_b, wallet_a, cat_a, wallet_b = setup_users
    repo = TransactionRepository()
    now = utc_now()
    
    txn_a = Transaction(
        user_id=user_a, wallet_id=wallet_a.id, category_id=cat_a.id,
        type=TransactionType.EXPENSE, amount=Decimal("10.00"), transaction_date=now
    )
    txn_b = Transaction(
        user_id=user_b, wallet_id=wallet_b.id, category_id=None,
        type=TransactionType.INCOME, amount=Decimal("50.00"), transaction_date=now
    )
    db_session.add_all([txn_a, txn_b])
    db_session.commit()

    # 1. Tenant Isolation
    assert repo.get_active_by_id(txn_a.id, user_a) is not None
    assert repo.get_active_by_id(txn_a.id, user_b) is None
    
    all_a = repo.get_all_active_by_user(user_a)
    assert len(all_a) == 1
    assert all_a[0].id == txn_a.id

    # 2. Date Range Filtering
    start = now - timedelta(days=1)
    end = now + timedelta(days=1)
    out_of_bounds = now + timedelta(days=5)

    assert len(repo.get_active_by_user_and_date_range(user_a, start, end)) == 1
    assert len(repo.get_active_by_user_and_date_range(user_a, out_of_bounds, out_of_bounds + timedelta(days=1))) == 0


def test_transaction_soft_delete_masking(db_session, setup_users):
    user_a, _, wallet_a, cat_a, _ = setup_users
    repo = TransactionRepository()
    now = utc_now()

    txn = Transaction(
        user_id=user_a, wallet_id=wallet_a.id, category_id=cat_a.id,
        type=TransactionType.EXPENSE, amount=Decimal("20.00"), transaction_date=now
    )
    repo.add(txn)
    db_session.commit()

    assert repo.get_active_by_id(txn.id, user_a) is not None

    # Soft delete
    txn.deleted_at = now
    db_session.commit()

    assert repo.get_active_by_id(txn.id, user_a) is None


def test_transaction_aggregations(db_session, setup_users):
    """
    Proves expense aggregation, income aggregation, category filtering,
    soft-delete exclusion, cross-tenant exclusion, and grouped aggregation.
    """
    user_a, user_b, wallet_a, cat_a1, wallet_b = setup_users
    
    # Second category for grouping logic
    cat_a2 = Category(user_id=user_a, name="Category A2")
    db_session.add(cat_a2)
    db_session.commit()

    repo = TransactionRepository()
    now = utc_now()
    start = now - timedelta(days=10)
    end = now + timedelta(days=10)
    out_of_range_date = now - timedelta(days=20)

    txns = [
        # User A Expenses (Valid)
        Transaction(user_id=user_a, wallet_id=wallet_a.id, category_id=cat_a1.id, type=TransactionType.EXPENSE, amount=Decimal("100.00"), transaction_date=now),
        Transaction(user_id=user_a, wallet_id=wallet_a.id, category_id=cat_a1.id, type=TransactionType.EXPENSE, amount=Decimal("50.50"), transaction_date=now),
        Transaction(user_id=user_a, wallet_id=wallet_a.id, category_id=cat_a2.id, type=TransactionType.EXPENSE, amount=Decimal("30.00"), transaction_date=now),
        # User A Income (Excluded from expense totals)
        Transaction(user_id=user_a, wallet_id=wallet_a.id, category_id=cat_a1.id, type=TransactionType.INCOME, amount=Decimal("2000.00"), transaction_date=now),
        # User A Out of Range (Excluded)
        Transaction(user_id=user_a, wallet_id=wallet_a.id, category_id=cat_a1.id, type=TransactionType.EXPENSE, amount=Decimal("999.00"), transaction_date=out_of_range_date),
        # User A Deleted (Excluded)
        Transaction(user_id=user_a, wallet_id=wallet_a.id, category_id=cat_a1.id, type=TransactionType.EXPENSE, amount=Decimal("123.00"), transaction_date=now, deleted_at=now),
        # User B Expense (Tenant Isolated)
        Transaction(user_id=user_b, wallet_id=wallet_b.id, category_id=None, type=TransactionType.EXPENSE, amount=Decimal("500.00"), transaction_date=now)
    ]
    db_session.add_all(txns)
    db_session.commit()

    # 1. Total Expense Aggregation (Expected: 100.00 + 50.50 + 30.00 = 180.50)
    total_expense = repo.get_expense_total_by_user_and_date_range(user_a, start, end)
    assert total_expense == Decimal("180.50")

    # 2. Total Income Aggregation (Expected: 2000.00)
    total_income = repo.get_income_total_by_user_and_date_range(user_a, start, end)
    assert total_income == Decimal("2000.00")

    # 3. Category Expense Aggregation (cat_a1 expected: 100.00 + 50.50 = 150.50)
    cat_expense = repo.get_expense_total_by_category_and_date_range(user_a, cat_a1.id, start, end)
    assert cat_expense == Decimal("150.50")

    # 4. Empty Aggregation Returns exact Decimal("0.00")
    empty_total = repo.get_expense_total_by_category_and_date_range(user_a, uuid.uuid4(), start, end)
    assert empty_total == Decimal("0.00")
    
    # 5. Grouped Category Aggregation
    grouped = repo.get_expense_totals_grouped_by_category(user_a, start, end)
    assert len(grouped) == 2
    # Convert Row outputs to a dict for easy testing validation
    grouped_dict = {row[0]: row[1] for row in grouped}
    assert grouped_dict[cat_a1.id] == Decimal("150.50")
    assert grouped_dict[cat_a2.id] == Decimal("30.00")