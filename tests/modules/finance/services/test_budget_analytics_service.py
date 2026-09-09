import pytest
import uuid
from decimal import Decimal
from datetime import date, datetime, timezone
from app.modules.finance.services.budget_service import BudgetService
from app.modules.finance.services.transaction_service import TransactionService
from app.modules.finance.services.wallet_service import WalletService
from app.modules.finance.services.budget_analytics_service import BudgetAnalyticsService
from app.modules.finance.models import TransactionType

def test_budget_analytics_spending(db_session):
    user_id = uuid.uuid4()
    w_svc = WalletService()
    t_svc = TransactionService()
    b_svc = BudgetService()
    a_svc = BudgetAnalyticsService()

    wallet = w_svc.create_wallet(user_id, "Test", Decimal("1000.00"))
    budget = b_svc.create_budget(user_id, Decimal("100.00"), date(2026, 1, 1), date(2026, 1, 31))

    # Add transaction in UTC boundary for Mumbai (+5:30)
    t_svc.create_transaction(
        user_id, wallet.id, TransactionType.EXPENSE, Decimal("120.00"), 
        datetime(2026, 1, 15, 12, 0, tzinfo=timezone.utc)
    )

    summary = a_svc.get_budget_spending_summary(budget.id, user_id, "Asia/Kolkata")
    
    assert summary["budget_amount"] == Decimal("100.00")
    assert summary["spent_amount"] == Decimal("120.00")
    # Remaining should naturally reflect overspending
    assert summary["remaining_amount"] == Decimal("-20.00") 
    assert summary["percentage_used"] == Decimal("120.00")
    assert summary["health"] == "OVER_BUDGET"