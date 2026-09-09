import pytest
import uuid
from decimal import Decimal
from datetime import date, timedelta
from sqlalchemy.exc import IntegrityError

from app.core.utils.datetime import utc_now
from app.modules.finance.models import Category, Budget, BudgetAlert
from app.modules.finance.repositories import BudgetRepository, BudgetAlertRepository


@pytest.fixture
def setup_data(db_session):
    user_a = uuid.uuid4()
    user_b = uuid.uuid4()
    cat_a = Category(user_id=user_a, name="Groceries")
    
    db_session.add(cat_a)
    db_session.commit()
    
    return user_a, user_b, cat_a


# --- BudgetRepository Tests ---

def test_budget_tenant_isolation(db_session, setup_data):
    user_a, user_b, cat_a = setup_data
    repo = BudgetRepository()
    
    budget = Budget(
        user_id=user_a, category_id=cat_a.id, amount=Decimal("500.00"),
        start_date=date(2026, 1, 1), end_date=date(2026, 1, 31)
    )
    repo.add(budget)
    db_session.commit()

    # User A can retrieve
    assert repo.get_active_by_id(budget.id, user_a) is not None
    # User B cannot retrieve
    assert repo.get_active_by_id(budget.id, user_b) is None


def test_budget_soft_delete_masking(db_session, setup_data):
    user_a, _, cat_a = setup_data
    repo = BudgetRepository()
    
    budget = Budget(
        user_id=user_a, category_id=cat_a.id, amount=Decimal("100.00"),
        start_date=date(2026, 1, 1), end_date=date(2026, 1, 31)
    )
    repo.add(budget)
    db_session.commit()

    assert repo.get_active_by_id(budget.id, user_a) is not None

    budget.deleted_at = utc_now()
    db_session.commit()

    # Masked after deletion
    assert repo.get_active_by_id(budget.id, user_a) is None


def test_get_all_active_by_user_budgets(db_session, setup_data):
    user_a, user_b, cat_a = setup_data
    repo = BudgetRepository()

    b1 = Budget(user_id=user_a, category_id=cat_a.id, amount=Decimal("100.00"), start_date=date(2026, 1, 1), end_date=date(2026, 1, 31))
    b2 = Budget(user_id=user_a, category_id=cat_a.id, amount=Decimal("200.00"), start_date=date(2026, 2, 1), end_date=date(2026, 2, 28))
    b_del = Budget(user_id=user_a, category_id=cat_a.id, amount=Decimal("300.00"), start_date=date(2026, 3, 1), end_date=date(2026, 3, 31), deleted_at=utc_now())
    b_other = Budget(user_id=user_b, category_id=None, amount=Decimal("400.00"), start_date=date(2026, 1, 1), end_date=date(2026, 1, 31))

    for b in [b1, b2, b_del, b_other]:
        repo.add(b)
    db_session.commit()

    active_a = repo.get_all_active_by_user(user_a)
    assert len(active_a) == 2
    ids = {b.id for b in active_a}
    assert b1.id in ids
    assert b2.id in ids
    assert b_del.id not in ids
    assert b_other.id not in ids


def test_get_active_budgets_by_category(db_session, setup_data):
    user_a, _, cat_a = setup_data
    repo = BudgetRepository()

    b1 = Budget(user_id=user_a, category_id=cat_a.id, amount=Decimal("100.00"), start_date=date(2026, 1, 1), end_date=date(2026, 1, 31))
    b2_overall = Budget(user_id=user_a, category_id=None, amount=Decimal("200.00"), start_date=date(2026, 1, 1), end_date=date(2026, 1, 31))
    
    db_session.add_all([b1, b2_overall])
    db_session.commit()

    results = repo.get_active_budgets_by_category(user_a, cat_a.id)
    assert len(results) == 1
    assert results[0].id == b1.id


def test_budget_date_overlap_logic(db_session, setup_data):
    user_a, user_b, cat_a = setup_data
    repo = BudgetRepository()

    # Core budget: Jan 10 to Jan 20
    b_main = Budget(user_id=user_a, category_id=cat_a.id, amount=Decimal("100.00"), start_date=date(2026, 1, 10), end_date=date(2026, 1, 20))
    # Deleted budget overlapping
    b_del = Budget(user_id=user_a, category_id=cat_a.id, amount=Decimal("100.00"), start_date=date(2026, 1, 15), end_date=date(2026, 1, 25), deleted_at=utc_now())
    # User B budget overlapping
    b_other = Budget(user_id=user_b, category_id=None, amount=Decimal("100.00"), start_date=date(2026, 1, 15), end_date=date(2026, 1, 25))

    db_session.add_all([b_main, b_del, b_other])
    db_session.commit()

    # Query 1: Overlaps completely (Jan 1 to Jan 31)
    res1 = repo.get_active_budgets_overlapping_date_range(user_a, date(2026, 1, 1), date(2026, 1, 31))
    assert len(res1) == 1
    assert res1[0].id == b_main.id

    # Query 2: Overlaps front edge (Jan 1 to Jan 15)
    res2 = repo.get_active_budgets_overlapping_date_range(user_a, date(2026, 1, 1), date(2026, 1, 15))
    assert len(res2) == 1

    # Query 3: Overlaps back edge (Jan 15 to Jan 31)
    res3 = repo.get_active_budgets_overlapping_date_range(user_a, date(2026, 1, 15), date(2026, 1, 31))
    assert len(res3) == 1

    # Query 4: Does NOT overlap - purely before (Jan 1 to Jan 9)
    res4 = repo.get_active_budgets_overlapping_date_range(user_a, date(2026, 1, 1), date(2026, 1, 9))
    assert len(res4) == 0

    # Query 5: Does NOT overlap - purely after (Jan 21 to Jan 31)
    res5 = repo.get_active_budgets_overlapping_date_range(user_a, date(2026, 1, 21), date(2026, 1, 31))
    assert len(res5) == 0


# --- BudgetAlertRepository Tests ---

@pytest.fixture
def setup_alert_data(db_session, setup_data):
    user_a, user_b, cat_a = setup_data
    budget = Budget(
        user_id=user_a, category_id=cat_a.id, amount=Decimal("1000.00"),
        start_date=date(2026, 1, 1), end_date=date(2026, 1, 31)
    )
    db_session.add(budget)
    db_session.commit()
    return user_a, user_b, budget


def test_budget_alert_tenant_isolation(db_session, setup_alert_data):
    user_a, user_b, budget = setup_alert_data
    repo = BudgetAlertRepository()

    alert = BudgetAlert(
        user_id=user_a, budget_id=budget.id, threshold_type=80,
        budget_amount=Decimal("1000.00"), spent_amount=Decimal("800.00"), percentage_used=Decimal("80.00")
    )
    repo.add(alert)
    db_session.commit()

    assert repo.get_active_by_id(alert.id, user_a) is not None
    assert repo.get_active_by_id(alert.id, user_b) is None


def test_budget_alert_soft_delete_masking(db_session, setup_alert_data):
    user_a, _, budget = setup_alert_data
    repo = BudgetAlertRepository()

    alert = BudgetAlert(
        user_id=user_a, budget_id=budget.id, threshold_type=90,
        budget_amount=Decimal("1000.00"), spent_amount=Decimal("900.00"), percentage_used=Decimal("90.00")
    )
    repo.add(alert)
    db_session.commit()

    alert.deleted_at = utc_now()
    db_session.commit()

    assert repo.get_active_by_id(alert.id, user_a) is None


def test_get_active_alerts_by_budget(db_session, setup_alert_data):
    user_a, _, budget = setup_alert_data
    repo = BudgetAlertRepository()

    alert1 = BudgetAlert(
        user_id=user_a, budget_id=budget.id, threshold_type=50,
        budget_amount=Decimal("1000.00"), spent_amount=Decimal("500.00"), percentage_used=Decimal("50.00")
    )
    alert2 = BudgetAlert(
        user_id=user_a, budget_id=budget.id, threshold_type=80,
        budget_amount=Decimal("1000.00"), spent_amount=Decimal("800.00"), percentage_used=Decimal("80.00")
    )
    db_session.add_all([alert1, alert2])
    db_session.commit()

    alerts = repo.get_active_alerts_by_budget(budget.id, user_a)
    assert len(alerts) == 2


def test_get_active_by_budget_and_threshold(db_session, setup_alert_data):
    user_a, user_b, budget = setup_alert_data
    repo = BudgetAlertRepository()

    alert = BudgetAlert(
        user_id=user_a, budget_id=budget.id, threshold_type=100,
        budget_amount=Decimal("1000.00"), spent_amount=Decimal("1000.00"), percentage_used=Decimal("100.00")
    )
    repo.add(alert)
    db_session.commit()

    # Exact match works
    assert repo.get_active_by_budget_and_threshold(budget.id, 100, user_a) is not None
    # Wrong threshold fails
    assert repo.get_active_by_budget_and_threshold(budget.id, 80, user_a) is None
    # Wrong user fails
    assert repo.get_active_by_budget_and_threshold(budget.id, 100, user_b) is None


def test_budget_alert_unique_constraint_rejects_duplicate(db_session, setup_alert_data):
    """
    CRITICAL: Validates the physical DB unique constraint (budget_id, threshold_type)
    rejects duplicate alerts, ensuring Phase 8 idempotency safety.
    """
    user_a, _, budget = setup_alert_data
    repo = BudgetAlertRepository()

    alert1 = BudgetAlert(
        user_id=user_a, budget_id=budget.id, threshold_type=80,
        budget_amount=Decimal("1000.00"), spent_amount=Decimal("800.00"), percentage_used=Decimal("80.00")
    )
    repo.add(alert1)
    db_session.commit()

    alert2_duplicate = BudgetAlert(
        user_id=user_a, budget_id=budget.id, threshold_type=80,
        budget_amount=Decimal("1000.00"), spent_amount=Decimal("850.00"), percentage_used=Decimal("85.00")
    )
    repo.add(alert2_duplicate)
    
    with pytest.raises(IntegrityError):
        db_session.commit()
        
    db_session.rollback()


def test_empty_result_collections(db_session, setup_data):
    user_a, _, _ = setup_data
    b_repo = BudgetRepository()
    ba_repo = BudgetAlertRepository()
    
    # Assert collection queries return empty list, not None
    assert b_repo.get_all_active_by_user(user_a) == []
    assert b_repo.get_active_budgets_by_category(user_a, uuid.uuid4()) == []
    assert b_repo.get_active_budgets_overlapping_date_range(user_a, date(2026, 1, 1), date(2026, 1, 31)) == []
    assert ba_repo.get_active_alerts_by_budget(uuid.uuid4(), user_a) == []