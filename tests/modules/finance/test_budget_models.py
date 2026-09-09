import pytest
import uuid
from decimal import Decimal
from datetime import date
from sqlalchemy.exc import IntegrityError

from app.modules.finance.models import Category, Budget, BudgetAlert

@pytest.fixture
def test_category(db_session):
    category = Category(user_id=uuid.uuid4(), name="Food")
    db_session.add(category)
    db_session.commit()
    return category

@pytest.fixture
def test_budget(db_session, test_category):
    budget = Budget(
        user_id=test_category.user_id,
        category_id=test_category.id,
        amount=Decimal("500.00"),
        start_date=date(2026, 9, 1),
        end_date=date(2026, 9, 30)
    )
    db_session.add(budget)
    db_session.commit()
    return budget

def test_overall_budget_creation(db_session, test_category):
    """Verifies an Overall Budget where category_id is NULL."""
    budget = Budget(
        user_id=test_category.user_id,
        category_id=None,
        amount=Decimal("2000.00"),
        start_date=date(2026, 9, 1),
        end_date=date(2026, 9, 30)
    )
    db_session.add(budget)
    db_session.commit()

    assert budget.id is not None
    assert budget.category_id is None
    assert budget.is_active is True

def test_budget_alert_creation(db_session, test_budget):
    """Verifies successful creation of an immutable BudgetAlert snapshot."""
    alert = BudgetAlert(
        user_id=test_budget.user_id,
        budget_id=test_budget.id,
        threshold_type=80,
        budget_amount=Decimal("500.00"),
        spent_amount=Decimal("400.00"),
        percentage_used=Decimal("80.00")
    )
    db_session.add(alert)
    db_session.commit()

    assert alert.id is not None
    assert alert.is_read is False

def test_budget_alert_unique_constraint(db_session, test_budget):
    """
    CRITICAL: Verifies PostgreSQL enforces the UNIQUE(budget_id, threshold_type) constraint.
    This is the core idempotency guarantee from Phase 8 Step 6.
    """
    # 1. Insert first 80% alert
    alert1 = BudgetAlert(
        user_id=test_budget.user_id,
        budget_id=test_budget.id,
        threshold_type=80,
        budget_amount=Decimal("500.00"),
        spent_amount=Decimal("400.00"),
        percentage_used=Decimal("80.00")
    )
    db_session.add(alert1)
    db_session.commit()

    # 2. Attempt to insert a duplicate 80% alert for the SAME budget
    alert2 = BudgetAlert(
        user_id=test_budget.user_id,
        budget_id=test_budget.id,
        threshold_type=80,
        budget_amount=Decimal("500.00"),
        spent_amount=Decimal("410.00"),
        percentage_used=Decimal("82.00")
    )
    db_session.add(alert2)
    
    with pytest.raises(IntegrityError) as exc_info:
        db_session.commit()
        
    # Clear the aborted transaction state
    db_session.rollback()
    
    # Assert the specific constraint violation
    assert "uq_budget_alert_threshold" in str(exc_info.value)