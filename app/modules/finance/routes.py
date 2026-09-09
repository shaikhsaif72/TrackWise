from flask import Blueprint, request, jsonify, g
from datetime import datetime
from app.core.auth import require_auth
from app.core.exceptions import APIException
from app.modules.finance.schemas import (
    WalletCreateSchema, WalletUpdateSchema, WalletResponseSchema,
    CategoryCreateSchema, CategoryUpdateSchema, CategoryResponseSchema,
    TransactionCreateSchema, TransactionUpdateSchema, TransactionResponseSchema,
    BudgetCreateSchema, BudgetUpdateSchema, BudgetResponseSchema,
    BudgetAnalyticsResponseSchema, AlertEvaluateSchema, BudgetAlertResponseSchema,
    BudgetPacingResponseSchema, BulkRolloverRequestSchema
)
from app.modules.finance.services.wallet_service import WalletService
from app.modules.finance.services.category_service import CategoryService
from app.modules.finance.services.transaction_service import TransactionService
from app.modules.finance.services.budget_service import BudgetService
from app.modules.finance.services.budget_analytics_service import BudgetAnalyticsService
from app.modules.finance.services.budget_alert_service import BudgetAlertService
from app.modules.finance.services.budget_pacing_service import BudgetPacingService
from app.modules.finance.services.budget_rollover_service import BudgetRolloverService

finance_bp = Blueprint('finance', __name__)

# --- WALLETS ---

@finance_bp.route('/wallets', methods=['POST'])
@require_auth
def create_wallet():
    data = WalletCreateSchema().load(request.get_json() or {})
    service = WalletService()
    wallet = service.create_wallet(user_id=g.user_id, **data)
    return jsonify({"data": WalletResponseSchema().dump(wallet)}), 201

@finance_bp.route('/wallets', methods=['GET'])
@require_auth
def list_wallets():
    service = WalletService()
    wallets = service.get_all_wallets(user_id=g.user_id)
    return jsonify({"data": WalletResponseSchema(many=True).dump(wallets)}), 200

@finance_bp.route('/wallets/<uuid:wallet_id>', methods=['GET'])
@require_auth
def get_wallet(wallet_id):
    service = WalletService()
    wallet = service.get_wallet(wallet_id=wallet_id, user_id=g.user_id)
    return jsonify({"data": WalletResponseSchema().dump(wallet)}), 200

@finance_bp.route('/wallets/<uuid:wallet_id>', methods=['PATCH'])
@require_auth
def update_wallet(wallet_id):
    # kwargs dynamically resolves MISSING fallbacks because schema drops omitted fields
    data = WalletUpdateSchema().load(request.get_json() or {})
    service = WalletService()
    wallet = service.update_wallet(wallet_id=wallet_id, user_id=g.user_id, **data)
    return jsonify({"data": WalletResponseSchema().dump(wallet)}), 200

@finance_bp.route('/wallets/<uuid:wallet_id>', methods=['DELETE'])
@require_auth
def delete_wallet(wallet_id):
    service = WalletService()
    service.delete_wallet(wallet_id=wallet_id, user_id=g.user_id)
    return jsonify({"data": {"status": "deleted"}}), 200

# --- CATEGORIES ---

@finance_bp.route('/categories', methods=['POST'])
@require_auth
def create_category():
    data = CategoryCreateSchema().load(request.get_json() or {})
    service = CategoryService()
    category = service.create_category(user_id=g.user_id, **data)
    return jsonify({"data": CategoryResponseSchema().dump(category)}), 201

@finance_bp.route('/categories', methods=['GET'])
@require_auth
def list_categories():
    service = CategoryService()
    categories = service.get_all_categories(user_id=g.user_id)
    return jsonify({"data": CategoryResponseSchema(many=True).dump(categories)}), 200

@finance_bp.route('/categories/<uuid:category_id>', methods=['GET'])
@require_auth
def get_category(category_id):
    service = CategoryService()
    category = service.get_category(category_id=category_id, user_id=g.user_id)
    return jsonify({"data": CategoryResponseSchema().dump(category)}), 200

@finance_bp.route('/categories/<uuid:category_id>', methods=['PATCH'])
@require_auth
def update_category(category_id):
    data = CategoryUpdateSchema().load(request.get_json() or {})
    service = CategoryService()
    category = service.update_category(category_id=category_id, user_id=g.user_id, **data)
    return jsonify({"data": CategoryResponseSchema().dump(category)}), 200

@finance_bp.route('/categories/<uuid:category_id>', methods=['DELETE'])
@require_auth
def delete_category(category_id):
    service = CategoryService()
    service.delete_category(category_id=category_id, user_id=g.user_id)
    return jsonify({"data": {"status": "deleted"}}), 200

# --- TRANSACTIONS ---

@finance_bp.route('/transactions', methods=['POST'])
@require_auth
def create_transaction():
    data = TransactionCreateSchema().load(request.get_json() or {})
    service = TransactionService()
    txn = service.create_transaction(user_id=g.user_id, **data)
    return jsonify({"data": TransactionResponseSchema().dump(txn)}), 201

@finance_bp.route('/transactions', methods=['GET'])
@require_auth
def list_transactions():
    service = TransactionService()
    txns = service.get_all_transactions(user_id=g.user_id)
    return jsonify({"data": TransactionResponseSchema(many=True).dump(txns)}), 200

@finance_bp.route('/transactions/<uuid:transaction_id>', methods=['GET'])
@require_auth
def get_transaction(transaction_id):
    service = TransactionService()
    txn = service.get_transaction(txn_id=transaction_id, user_id=g.user_id)
    return jsonify({"data": TransactionResponseSchema().dump(txn)}), 200

@finance_bp.route('/transactions/<uuid:transaction_id>', methods=['PATCH'])
@require_auth
def update_transaction(transaction_id):
    data = TransactionUpdateSchema().load(request.get_json() or {})
    service = TransactionService()
    txn = service.update_transaction(txn_id=transaction_id, user_id=g.user_id, **data)
    return jsonify({"data": TransactionResponseSchema().dump(txn)}), 200

@finance_bp.route('/transactions/<uuid:transaction_id>', methods=['DELETE'])
@require_auth
def delete_transaction(transaction_id):
    service = TransactionService()
    service.delete_transaction(txn_id=transaction_id, user_id=g.user_id)
    return jsonify({"data": {"status": "deleted"}}), 200

# --- BUDGETS ---

@finance_bp.route('/budgets', methods=['POST'])
@require_auth
def create_budget():
    data = BudgetCreateSchema().load(request.get_json() or {})
    service = BudgetService()
    budget = service.create_budget(user_id=g.user_id, **data)
    return jsonify({"data": BudgetResponseSchema().dump(budget)}), 201

@finance_bp.route('/budgets', methods=['GET'])
@require_auth
def list_budgets():
    service = BudgetService()
    budgets = service.get_all_budgets(user_id=g.user_id)
    return jsonify({"data": BudgetResponseSchema(many=True).dump(budgets)}), 200

@finance_bp.route('/budgets/<uuid:budget_id>', methods=['GET'])
@require_auth
def get_budget(budget_id):
    service = BudgetService()
    budget = service.get_budget(budget_id=budget_id, user_id=g.user_id)
    return jsonify({"data": BudgetResponseSchema().dump(budget)}), 200

@finance_bp.route('/budgets/<uuid:budget_id>', methods=['PATCH'])
@require_auth
def update_budget(budget_id):
    data = BudgetUpdateSchema().load(request.get_json() or {})
    service = BudgetService()
    budget = service.update_budget(budget_id=budget_id, user_id=g.user_id, **data)
    return jsonify({"data": BudgetResponseSchema().dump(budget)}), 200

@finance_bp.route('/budgets/<uuid:budget_id>', methods=['DELETE'])
@require_auth
def delete_budget(budget_id):
    service = BudgetService()
    service.delete_budget(budget_id=budget_id, user_id=g.user_id)
    return jsonify({"data": {"status": "deleted"}}), 200

# --- ANALYTICS, ALERTS, PACING, ROLLOVER ---

@finance_bp.route('/budgets/<uuid:budget_id>/analytics', methods=['GET'])
@require_auth
def get_budget_analytics(budget_id):
    timezone_str = request.args.get('timezone')
    if not timezone_str:
        raise APIException("Query parameter 'timezone' is required.", status_code=400)
    
    service = BudgetAnalyticsService()
    summary = service.get_budget_spending_summary(budget_id=budget_id, user_id=g.user_id, timezone_str=timezone_str)
    return jsonify({"data": BudgetAnalyticsResponseSchema().dump(summary)}), 200

@finance_bp.route('/budgets/<uuid:budget_id>/pacing', methods=['GET'])
@require_auth
def get_budget_pacing(budget_id):
    timezone_str = request.args.get('timezone')
    as_of_date_str = request.args.get('as_of_date')
    
    if not timezone_str or not as_of_date_str:
        raise APIException("Query parameters 'timezone' and 'as_of_date' are required.", status_code=400)
        
    try:
        as_of_date = datetime.strptime(as_of_date_str, "%Y-%m-%d").date()
    except ValueError:
        raise APIException("as_of_date must be in YYYY-MM-DD format.", status_code=400)
        
    service = BudgetPacingService()
    pacing = service.calculate_pacing(budget_id=budget_id, user_id=g.user_id, timezone_str=timezone_str, as_of_date=as_of_date)
    return jsonify({"data": BudgetPacingResponseSchema().dump(pacing)}), 200

@finance_bp.route('/budgets/<uuid:budget_id>/alerts/evaluate', methods=['POST'])
@require_auth
def evaluate_budget_alert(budget_id):
    data = AlertEvaluateSchema().load(request.get_json() or {})
    service = BudgetAlertService()
    alert = service.evaluate_and_trigger_alert(budget_id=budget_id, user_id=g.user_id, timezone_str=data['timezone'])
    
    if not alert:
        return jsonify({"data": None}), 200
    return jsonify({"data": BudgetAlertResponseSchema().dump(alert)}), 200

@finance_bp.route('/budgets/rollover/bulk', methods=['POST'])
@require_auth
def bulk_rollover():
    data = BulkRolloverRequestSchema().load(request.get_json() or {})
    service = BudgetRolloverService()
    instructions = data.get("instructions", [])
    new_budgets = service.execute_bulk_rollover(user_id=g.user_id, rollover_instructions=instructions)
    return jsonify({"data": BudgetResponseSchema(many=True).dump(new_budgets)}), 200