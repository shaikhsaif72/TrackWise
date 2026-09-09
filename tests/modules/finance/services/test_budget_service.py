import pytest
import uuid
from decimal import Decimal
from datetime import date
from app.core.exceptions import APIException
from app.modules.finance.services.budget_service import BudgetService

def test_budget_service_overlap_and_crud(db_session):
    svc = BudgetService()
    user_id = uuid.uuid4()

    b1 = svc.create_budget(user_id, Decimal("100"), date(2026, 1, 1), date(2026, 1, 31))
    assert b1.id is not None
    
    # Exact overlap rejection
    with pytest.raises(APIException) as exc:
        svc.create_budget(user_id, Decimal("50"), date(2026, 1, 15), date(2026, 2, 15))
    assert exc.value.status_code == 400
    
    db_session.rollback()

    # Update succeeds if avoiding overlaps
    svc.update_budget(b1.id, user_id, start_date=date(2026, 2, 1), end_date=date(2026, 2, 28))
    updated = svc.get_budget(b1.id, user_id)
    assert updated.start_date == date(2026, 2, 1)
    
    # Soft Delete
    svc.delete_budget(b1.id, user_id)
    with pytest.raises(APIException):
        svc.get_budget(b1.id, user_id)

def test_budget_invalid_dates_and_amounts(db_session):
    svc = BudgetService()
    user_id = uuid.uuid4()
    with pytest.raises(APIException):
        svc.create_budget(user_id, Decimal("10"), date(2026, 1, 31), date(2026, 1, 1))
    with pytest.raises(APIException):
        svc.create_budget(user_id, Decimal("0.00"), date(2026, 1, 1), date(2026, 1, 31))