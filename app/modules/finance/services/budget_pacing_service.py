import uuid
from datetime import date
from decimal import Decimal
from typing import Dict, Any
from app.modules.finance.services.budget_service import BudgetService
from app.modules.finance.services.budget_analytics_service import BudgetAnalyticsService


class BudgetPacingService:
    def __init__(self, budget_service=None, analytics_service=None):
        self.budget_service = budget_service or BudgetService()
        self.analytics_service = analytics_service or BudgetAnalyticsService()

    def calculate_pacing(self, budget_id: uuid.UUID, user_id: uuid.UUID, timezone_str: str, as_of_date: date) -> Dict[str, Any]:
        """Calculates deterministic pacing based strictly on the injected as_of_date."""
        budget = self.budget_service.get_budget(budget_id, user_id)
        summary = self.analytics_service.get_budget_spending_summary(budget_id, user_id, timezone_str)
        
        total_days = (budget.end_date - budget.start_date).days + 1
        
        if as_of_date < budget.start_date:
            elapsed_days = 0
        elif as_of_date > budget.end_date:
            elapsed_days = total_days
        else:
            elapsed_days = (as_of_date - budget.start_date).days + 1

        spent = summary["spent_amount"]
        
        daily_rate = Decimal("0.00")
        if elapsed_days > 0:
            daily_rate = spent / Decimal(elapsed_days)
            
        projected_spend = daily_rate * Decimal(total_days)
        projected_overage = projected_spend - budget.amount if projected_spend > budget.amount else Decimal("0.00")

        return {
            "budget_id": budget.id,
            "total_days": total_days,
            "elapsed_days": elapsed_days,
            "current_daily_rate": daily_rate.quantize(Decimal("0.01")),
            "projected_spend": projected_spend.quantize(Decimal("0.01")),
            "projected_overage": projected_overage.quantize(Decimal("0.01"))
        }