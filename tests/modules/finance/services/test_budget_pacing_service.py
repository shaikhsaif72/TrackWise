import pytest
import uuid
from decimal import Decimal
from datetime import date
from app.modules.finance.services.budget_service import BudgetService
from app.modules.finance.services.budget_pacing_service import BudgetPacingService

def test_deterministic_pacing(db_session):
    user_id = uuid.uuid4()
    b_svc = BudgetService()
    p_svc = BudgetPacingService()

    budget = b_svc.create_budget(user_id, Decimal("100.00"), date(2026, 1, 1), date(2026, 1, 10))
    
    # 5 days elapsed (as_of_date is deterministic)
    pacing = p_svc.calculate_pacing(budget.id, user_id, "UTC", date(2026, 1, 5))
    assert pacing["total_days"] == 10
    assert pacing["elapsed_days"] == 5
    assert pacing["current_daily_rate"] == Decimal("0.00")