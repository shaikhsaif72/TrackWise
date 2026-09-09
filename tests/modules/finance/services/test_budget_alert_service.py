import uuid
from decimal import Decimal
from datetime import date, datetime, timezone

from app.modules.finance.services.budget_service import BudgetService
from app.modules.finance.services.wallet_service import WalletService
from app.modules.finance.services.transaction_service import TransactionService
from app.modules.finance.services.budget_alert_service import BudgetAlertService
from app.modules.finance.models import TransactionType


def test_alert_idempotency_and_snapshot(db_session):
    user_id = uuid.uuid4()

    alert_svc = BudgetAlertService()
    b_svc = BudgetService()
    w_svc = WalletService()
    t_svc = TransactionService()

    wallet = w_svc.create_wallet(user_id, "Test")

    budget = b_svc.create_budget(
        user_id,
        Decimal("100.00"),
        date(2026, 1, 1),
        date(2026, 1, 31)
    )

    # 85% expense
    t_svc.create_transaction(
        user_id,
        wallet.id,
        TransactionType.EXPENSE,
        Decimal("85.00"),
        datetime(
            2026, 1, 15, 12, 0,
            tzinfo=timezone.utc
        )
    )

    # 80% alert should be created
    alert1 = alert_svc.evaluate_and_trigger_alert(
        budget.id,
        user_id,
        "UTC"
    )

    assert alert1 is not None
    assert alert1.threshold_type == 80

    # Snapshot verification
    assert alert1.budget_amount == Decimal("100.00")
    assert alert1.spent_amount == Decimal("85.00")
    assert alert1.percentage_used == Decimal("85.00")

    # Idempotency: same alert should be returned
    alert2 = alert_svc.evaluate_and_trigger_alert(
        budget.id,
        user_id,
        "UTC"
    )

    assert alert2 is not None
    assert alert2.id == alert1.id

    # Add income of 85
    t_svc.create_transaction(
        user_id,
        wallet.id,
        TransactionType.INCOME,
        Decimal("85.00"),
        datetime(
            2026, 1, 15, 12, 0,
            tzinfo=timezone.utc
        )
    )

    # Net spending is now 0, so no new alert
    alert3 = alert_svc.evaluate_and_trigger_alert(
        budget.id,
        user_id,
        "UTC"
    )

    assert alert3 is None