from flask import Blueprint, request, jsonify, g
from collections import defaultdict
from decimal import Decimal

from app.core.auth import require_auth
from app.core.constants import MISSING

from app.modules.finance.schemas import (
    WalletCreateSchema,
    WalletUpdateSchema,
    WalletResponseSchema,
    CategoryCreateSchema,
    CategoryUpdateSchema,
    CategoryResponseSchema,
    TransactionCreateSchema,
    TransactionUpdateSchema,
    TransactionResponseSchema,
    BudgetCreateSchema,
    BudgetUpdateSchema,
    BudgetResponseSchema,
)

from app.modules.finance.services.wallet_service import WalletService
from app.modules.finance.services.category_service import CategoryService
from app.modules.finance.services.transaction_service import TransactionService
from app.modules.finance.services.budget_service import BudgetService


finance_bp = Blueprint(
    "finance",
    __name__,
    url_prefix="/api/v1/finance"
)


# ==================================================
# WALLET ROUTES
# ==================================================

# --------------------------------------------------
# GET ALL WALLETS
# --------------------------------------------------

@finance_bp.route("/wallets", methods=["GET"])
@require_auth
def get_wallets():
    try:
        service = WalletService()

        wallets = service.get_all_wallets(
            user_id=g.user_id
        )

        return jsonify({
            "data": WalletResponseSchema(
                many=True
            ).dump(wallets)
        }), 200

    except Exception as e:
        print("GET WALLETS ERROR:", repr(e))

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


# --------------------------------------------------
# CREATE WALLET
# --------------------------------------------------

@finance_bp.route("/wallets", methods=["POST"])
@require_auth
def create_wallet():
    try:
        data = request.get_json() or {}

        # TrackWise supports INR only
        data["currency"] = "INR"

        validated_data = WalletCreateSchema().load(data)

        service = WalletService()

        wallet = service.create_wallet(
            user_id=g.user_id,
            **validated_data
        )

        return jsonify({
            "data": WalletResponseSchema().dump(wallet)
        }), 201

    except Exception as e:
        print("CREATE WALLET ERROR:", repr(e))

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


# --------------------------------------------------
# UPDATE WALLET
# --------------------------------------------------

@finance_bp.route("/wallets/<uuid:wallet_id>", methods=["PATCH"])
@require_auth
def update_wallet(wallet_id):
    try:
        data = request.get_json() or {}

        validated_data = WalletUpdateSchema().load(data)

        service = WalletService()

        wallet = service.update_wallet(
            wallet_id=wallet_id,
            user_id=g.user_id,
            name=validated_data.get("name", MISSING)
        )

        return jsonify({
            "data": WalletResponseSchema().dump(wallet)
        }), 200

    except Exception as e:
        print("UPDATE WALLET ERROR:", repr(e))

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


# --------------------------------------------------
# DELETE WALLET
# --------------------------------------------------

@finance_bp.route("/wallets/<uuid:wallet_id>", methods=["DELETE"])
@require_auth
def delete_wallet(wallet_id):
    try:
        service = WalletService()

        service.delete_wallet(
            wallet_id=wallet_id,
            user_id=g.user_id
        )

        return jsonify({
            "data": {
                "status": "deleted"
            }
        }), 200

    except Exception as e:
        print("DELETE WALLET ERROR:", repr(e))

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


# ==================================================
# CATEGORY ROUTES
# ==================================================

# --------------------------------------------------
# GET ALL CATEGORIES
# --------------------------------------------------

@finance_bp.route("/categories", methods=["GET"])
@require_auth
def get_categories():
    try:
        service = CategoryService()

        categories = service.get_all_categories(
            user_id=g.user_id
        )

        return jsonify({
            "data": CategoryResponseSchema(
                many=True
            ).dump(categories)
        }), 200

    except Exception as e:
        print("GET CATEGORIES ERROR:", repr(e))

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


# --------------------------------------------------
# CREATE CATEGORY
# --------------------------------------------------

@finance_bp.route("/categories", methods=["POST"])
@require_auth
def create_category():
    try:
        data = request.get_json() or {}

        validated_data = CategoryCreateSchema().load(data)

        service = CategoryService()

        category = service.create_category(
            user_id=g.user_id,
            **validated_data
        )

        return jsonify({
            "data": CategoryResponseSchema().dump(category)
        }), 201

    except Exception as e:
        print("CREATE CATEGORY ERROR:", repr(e))

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


# --------------------------------------------------
# GET SINGLE CATEGORY
# --------------------------------------------------

@finance_bp.route("/categories/<uuid:category_id>", methods=["GET"])
@require_auth
def get_category(category_id):
    try:
        service = CategoryService()

        category = service.get_category(
            category_id=category_id,
            user_id=g.user_id
        )

        return jsonify({
            "data": CategoryResponseSchema().dump(category)
        }), 200

    except Exception as e:
        print("GET CATEGORY ERROR:", repr(e))

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


# --------------------------------------------------
# UPDATE CATEGORY
# --------------------------------------------------

@finance_bp.route("/categories/<uuid:category_id>", methods=["PATCH"])
@require_auth
def update_category(category_id):
    try:
        data = request.get_json() or {}

        validated_data = CategoryUpdateSchema().load(data)

        service = CategoryService()

        category = service.update_category(
            category_id=category_id,
            user_id=g.user_id,
            name=validated_data.get("name", MISSING)
        )

        return jsonify({
            "data": CategoryResponseSchema().dump(category)
        }), 200

    except Exception as e:
        print("UPDATE CATEGORY ERROR:", repr(e))

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


# --------------------------------------------------
# DELETE CATEGORY
# --------------------------------------------------

@finance_bp.route("/categories/<uuid:category_id>", methods=["DELETE"])
@require_auth
def delete_category(category_id):
    try:
        service = CategoryService()

        service.delete_category(
            category_id=category_id,
            user_id=g.user_id
        )

        return jsonify({
            "data": {
                "status": "deleted"
            }
        }), 200

    except Exception as e:
        print("DELETE CATEGORY ERROR:", repr(e))

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


# ==================================================
# DASHBOARD ROUTES
# ==================================================

# --------------------------------------------------
# GET DASHBOARD SUMMARY
# --------------------------------------------------

@finance_bp.route("/summary", methods=["GET"])
@require_auth
def get_dashboard_summary():
    try:
        service = TransactionService()

        summary = service.get_dashboard_summary(
            user_id=g.user_id
        )

        return jsonify({
            "data": {
                "totalBalance": float(
                    summary["totalBalance"]
                ),
                "income": float(
                    summary["income"]
                ),
                "expenses": float(
                    summary["expenses"]
                ),
                "savings": float(
                    summary["savings"]
                ),
                "currency": "INR",
                "isDemo": False
            }
        }), 200

    except Exception as e:
        print("GET DASHBOARD SUMMARY ERROR:", repr(e))

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


# ==================================================
# GENERAL FINANCIAL ANALYTICS
# ==================================================

# --------------------------------------------------
# GET FINANCIAL ANALYTICS
# --------------------------------------------------

@finance_bp.route("/analytics", methods=["GET"])
@require_auth
def get_financial_analytics():
    """
    Returns:

    - Total income
    - Total expenses
    - Net balance
    - Savings rate
    - Monthly income vs expenses
    - Spending by category
    """

    try:
        transaction_service = TransactionService()
        category_service = CategoryService()

        # Get current user's transactions
        transactions = transaction_service.get_all_transactions(
            user_id=g.user_id
        )

        # Get current user's categories
        categories = category_service.get_all_categories(
            user_id=g.user_id
        )

        # --------------------------------------------------
        # CATEGORY NAME MAPPING
        # --------------------------------------------------

        category_map = {
            str(category.id): category.name
            for category in categories
        }

        # --------------------------------------------------
        # INITIAL VALUES
        # --------------------------------------------------

        total_income = Decimal("0.00")
        total_expenses = Decimal("0.00")

        monthly_data = defaultdict(
            lambda: {
                "income": Decimal("0.00"),
                "expense": Decimal("0.00")
            }
        )

        category_expenses = defaultdict(
            lambda: Decimal("0.00")
        )

        # --------------------------------------------------
        # PROCESS TRANSACTIONS
        # --------------------------------------------------

        for transaction in transactions:
            if not transaction.amount:
                continue

            amount = Decimal(
                str(transaction.amount)
            )

            transaction_type = transaction.type

            # Convert Enum to its value
            if hasattr(transaction_type, "value"):
                transaction_type = transaction_type.value

            transaction_type = str(
                transaction_type
            ).upper()

            transaction_date = transaction.transaction_date

            if not transaction_date:
                continue

            # Month key for sorting
            month_key = transaction_date.strftime(
                "%Y-%m"
            )

            # Income transaction
            if transaction_type == "INCOME":
                total_income += amount

                monthly_data[
                    month_key
                ]["income"] += amount

            # Expense transaction
            elif transaction_type == "EXPENSE":
                total_expenses += amount

                monthly_data[
                    month_key
                ]["expense"] += amount

                category_id = getattr(
                    transaction,
                    "category_id",
                    None
                )

                category_name = category_map.get(
                    str(category_id),
                    "Other"
                )

                category_expenses[
                    category_name
                ] += amount

        # --------------------------------------------------
        # NET BALANCE
        # --------------------------------------------------

        net_balance = (
            total_income - total_expenses
        )

        # --------------------------------------------------
        # SAVINGS RATE
        # --------------------------------------------------

        if total_income > Decimal("0.00"):
            savings_rate = (
                net_balance / total_income
            ) * Decimal("100")
        else:
            savings_rate = Decimal("0.00")

        # --------------------------------------------------
        # MONTHLY DATA RESPONSE
        # --------------------------------------------------

        monthly = []

        for month_key in sorted(
            monthly_data.keys()
        ):
            monthly.append({
                "name": month_key,
                "income": float(
                    monthly_data[month_key]["income"]
                ),
                "expense": float(
                    monthly_data[month_key]["expense"]
                )
            })

        # --------------------------------------------------
        # CATEGORY DATA RESPONSE
        # --------------------------------------------------

        categories_response = [
            {
                "name": category_name,
                "value": float(amount)
            }
            for category_name, amount in sorted(
                category_expenses.items(),
                key=lambda item: item[1],
                reverse=True
            )
        ]

        # --------------------------------------------------
        # FINAL RESPONSE
        # --------------------------------------------------

        return jsonify({
            "data": {
                "totalIncome": float(
                    total_income
                ),
                "totalExpenses": float(
                    total_expenses
                ),
                "netBalance": float(
                    net_balance
                ),
                "savingsRate": round(
                    float(savings_rate),
                    2
                ),
                "monthly": monthly,
                "categories": categories_response
            }
        }), 200

    except Exception as e:
        print(
            "GET FINANCIAL ANALYTICS ERROR:",
            repr(e)
        )

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


# ==================================================
# TRANSACTION ROUTES
# ==================================================

# --------------------------------------------------
# GET ALL TRANSACTIONS
# --------------------------------------------------

@finance_bp.route("/transactions", methods=["GET"])
@require_auth
def get_transactions():
    try:
        service = TransactionService()

        transactions = service.get_all_transactions(
            user_id=g.user_id
        )

        # Latest transactions first
        transactions = sorted(
            transactions,
            key=lambda txn: txn.transaction_date,
            reverse=True
        )

        transaction_data = []

        for txn in transactions:
            transaction_type = txn.type

            # Convert Enum to string
            if hasattr(transaction_type, "value"):
                transaction_type = transaction_type.value

            transaction_data.append({
                "id": str(txn.id),
                "wallet_id": (
                    str(txn.wallet_id)
                    if txn.wallet_id
                    else None
                ),
                "category_id": (
                    str(txn.category_id)
                    if txn.category_id
                    else None
                ),
                "type": str(
                    transaction_type
                ).upper(),
                "amount": float(
                    txn.amount or 0
                ),
                "transaction_date": (
                    txn.transaction_date.isoformat()
                    if txn.transaction_date
                    else None
                ),
                "description": txn.description,
                "currency": "INR"
            })

        return jsonify({
            "data": transaction_data
        }), 200

    except Exception as e:
        print(
            "GET TRANSACTIONS ERROR:",
            repr(e)
        )

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


# --------------------------------------------------
# CREATE TRANSACTION
# --------------------------------------------------

@finance_bp.route("/transactions", methods=["POST"])
@require_auth
def create_transaction():
    try:
        data = request.get_json() or {}

        validated_data = TransactionCreateSchema().load(
            data
        )

        service = TransactionService()

        transaction = service.create_transaction(
            user_id=g.user_id,
            **validated_data
        )

        return jsonify({
            "data": TransactionResponseSchema().dump(
                transaction
            )
        }), 201

    except Exception as e:
        print(
            "CREATE TRANSACTION ERROR:",
            repr(e)
        )

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


# --------------------------------------------------
# UPDATE TRANSACTION
# --------------------------------------------------

@finance_bp.route(
    "/transactions/<uuid:txn_id>",
    methods=["PATCH"]
)
@require_auth
def update_transaction(txn_id):
    try:
        data = request.get_json() or {}

        validated_data = TransactionUpdateSchema().load(
            data
        )

        service = TransactionService()

        transaction = service.update_transaction(
            txn_id=txn_id,
            user_id=g.user_id,
            **validated_data
        )

        return jsonify({
            "data": TransactionResponseSchema().dump(
                transaction
            )
        }), 200

    except Exception as e:
        print(
            "UPDATE TRANSACTION ERROR:",
            repr(e)
        )

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


# --------------------------------------------------
# DELETE TRANSACTION
# --------------------------------------------------

@finance_bp.route(
    "/transactions/<uuid:txn_id>",
    methods=["DELETE"]
)
@require_auth
def delete_transaction(txn_id):
    try:
        service = TransactionService()

        service.delete_transaction(
            txn_id=txn_id,
            user_id=g.user_id
        )

        return jsonify({
            "data": {
                "status": "deleted"
            }
        }), 200

    except Exception as e:
        print(
            "DELETE TRANSACTION ERROR:",
            repr(e)
        )

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


# ==================================================
# BUDGET ROUTES
# ==================================================

# --------------------------------------------------
# GET ALL BUDGETS
# --------------------------------------------------

@finance_bp.route("/budgets", methods=["GET"])
@require_auth
def get_budgets():
    try:
        service = BudgetService()

        budgets = service.get_all_budgets(
            user_id=g.user_id
        )

        return jsonify({
            "data": BudgetResponseSchema(
                many=True
            ).dump(budgets)
        }), 200

    except Exception as e:
        print(
            "GET BUDGETS ERROR:",
            repr(e)
        )

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


# --------------------------------------------------
# CREATE BUDGET
# --------------------------------------------------

@finance_bp.route("/budgets", methods=["POST"])
@require_auth
def create_budget():
    try:
        data = request.get_json() or {}

        validated_data = BudgetCreateSchema().load(
            data
        )

        service = BudgetService()

        budget = service.create_budget(
            user_id=g.user_id,
            **validated_data
        )

        return jsonify({
            "data": BudgetResponseSchema().dump(
                budget
            )
        }), 201

    except Exception as e:
        print(
            "CREATE BUDGET ERROR:",
            repr(e)
        )

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


# --------------------------------------------------
# UPDATE BUDGET
# --------------------------------------------------

@finance_bp.route(
    "/budgets/<uuid:budget_id>",
    methods=["PATCH"]
)
@require_auth
def update_budget(budget_id):
    try:
        data = request.get_json() or {}

        validated_data = BudgetUpdateSchema().load(
            data
        )

        service = BudgetService()

        budget = service.update_budget(
            budget_id=budget_id,
            user_id=g.user_id,
            **validated_data
        )

        return jsonify({
            "data": BudgetResponseSchema().dump(
                budget
            )
        }), 200

    except Exception as e:
        print(
            "UPDATE BUDGET ERROR:",
            repr(e)
        )

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


# --------------------------------------------------
# DELETE BUDGET
# --------------------------------------------------

@finance_bp.route(
    "/budgets/<uuid:budget_id>",
    methods=["DELETE"]
)
@require_auth
def delete_budget(budget_id):
    try:
        service = BudgetService()

        service.delete_budget(
            budget_id=budget_id,
            user_id=g.user_id
        )

        return jsonify({
            "data": {
                "status": "deleted"
            }
        }), 200

    except Exception as e:
        print(
            "DELETE BUDGET ERROR:",
            repr(e)
        )

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400