import pytest
import uuid
from decimal import Decimal
from datetime import date
from app.modules.finance.services.budget_rollover_service import BudgetRolloverService

def test_bulk_rollover_partial_success(db_session):
    user_id = uuid.uuid4()
    r_svc = BudgetRolloverService()

    instructions = [
        # Valid Request
        {
            "category_id": None,
            "new_start_date": date(2026, 2, 1),
            "new_end_date": date(2026, 2, 28),
            "new_amount": Decimal("100.00")
        },
        # Invalid (Amount <= 0)
        {
            "category_id": uuid.uuid4(),
            "new_start_date": date(2026, 2, 1),
            "new_end_date": date(2026, 2, 28),
            "new_amount": Decimal("0.00")
        }
    ]
    
    created_budgets = r_svc.execute_bulk_rollover(user_id, instructions)
    
    # Partial success is natively handled; the valid request succeeds
    assert len(created_budgets) == 1
    assert created_budgets[0].amount == Decimal("100.00")