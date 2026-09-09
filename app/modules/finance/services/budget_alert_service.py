import uuid
from decimal import Decimal
from typing import Optional

from app.extensions import db
from app.core.exceptions import APIException
from app.modules.finance.models import BudgetAlert
from app.modules.finance.repositories import BudgetAlertRepository
from app.modules.finance.services.budget_analytics_service import BudgetAnalyticsService


class BudgetAlertService:
    def __init__(self, alert_repo=None, analytics_service=None):
        self.alert_repo = alert_repo or BudgetAlertRepository()
        self.analytics_service = analytics_service or BudgetAnalyticsService()

    def evaluate_and_trigger_alert(
        self,
        budget_id: uuid.UUID,
        user_id: uuid.UUID,
        timezone_str: str
    ) -> Optional[BudgetAlert]:

        # Get current budget spending
        summary = self.analytics_service.get_budget_spending_summary(
            budget_id,
            user_id,
            timezone_str
        )

        percentage = summary["percentage_used"]

        # Determine highest crossed threshold
        threshold = None

        if percentage >= Decimal("100.00"):
            threshold = 100
        elif percentage >= Decimal("80.00"):
            threshold = 80

        # No threshold crossed
        if threshold is None:
            return None

        # Check if alert already exists
        existing = self.alert_repo.get_active_by_budget_and_threshold(
            budget_id,
            threshold,
            user_id
        )

        # Idempotency: return existing alert
        if existing:
            return existing

        # Create new alert with snapshot
        alert = BudgetAlert(
            user_id=user_id,
            budget_id=budget_id,
            threshold_type=threshold,
            budget_amount=summary["budget_amount"],
            spent_amount=summary["spent_amount"],
            percentage_used=summary["percentage_used"],
            is_read=False
        )

        self.alert_repo.add(alert)

        # Commit atomically
        try:
            db.session.commit()
            return alert

        except Exception:
            db.session.rollback()
            raise APIException(
                "Failed to generate budget alert.",
                status_code=500
            )