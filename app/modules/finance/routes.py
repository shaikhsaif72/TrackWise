from flask import Blueprint, request, jsonify, g, send_file

from collections import defaultdict
from decimal import Decimal
from datetime import datetime
from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

# ==================================================
# REPORTLAB IMPORTS
# ==================================================

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

# ==================================================
# AUTH IMPORT
# ==================================================

from app.core.auth import require_auth
from app.core.constants import MISSING

# ==================================================
# SCHEMA IMPORTS
# ==================================================

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

# ==================================================
# SERVICE IMPORTS
# ==================================================

from app.modules.finance.services.wallet_service import WalletService
from app.modules.finance.services.category_service import CategoryService
from app.modules.finance.services.transaction_service import TransactionService
from app.modules.finance.services.budget_service import BudgetService


# ==================================================
# BLUEPRINT
# ==================================================

finance_bp = Blueprint(
    "finance",
    __name__,
    url_prefix="/api/v1/finance"
)


# ==================================================
# PDF FONT CONFIGURATION
# ==================================================

# routes.py location:
# TrackWise/app/modules/finance/routes.py
#
# parents[0] = finance
# parents[1] = modules
# parents[2] = app
# parents[3] = TrackWise project root

PROJECT_ROOT = Path(__file__).resolve().parents[3]

FONT_PATH = PROJECT_ROOT / "fonts" / "DejaVuSans.ttf"

REPORT_FONT_NAME = "Helvetica"

if FONT_PATH.exists():
    try:
        pdfmetrics.registerFont(
            TTFont(
                "DejaVuSans",
                str(FONT_PATH)
            )
        )

        REPORT_FONT_NAME = "DejaVuSans"

        print(
            "PDF FONT LOADED:",
            str(FONT_PATH)
        )

    except Exception as font_error:
        print(
            "PDF FONT LOAD ERROR:",
            repr(font_error)
        )

else:
    print(
        "WARNING: DejaVuSans.ttf not found at:",
        str(FONT_PATH)
    )


# Use actual rupee symbol only when Unicode font is available.
# Otherwise use INR to avoid black square rendering.
REPORT_CURRENCY_PREFIX = (
    "₹ " if REPORT_FONT_NAME == "DejaVuSans"
    else "INR "
)


# ==================================================
# WALLET ROUTES
# ==================================================

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
        print(
            "GET WALLETS ERROR:",
            repr(e)
        )

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


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
        print(
            "CREATE WALLET ERROR:",
            repr(e)
        )

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


@finance_bp.route(
    "/wallets/<uuid:wallet_id>",
    methods=["PATCH"]
)
@require_auth
def update_wallet(wallet_id):
    try:
        data = request.get_json() or {}

        validated_data = WalletUpdateSchema().load(data)

        service = WalletService()

        wallet = service.update_wallet(
            wallet_id=wallet_id,
            user_id=g.user_id,
            name=validated_data.get(
                "name",
                MISSING
            )
        )

        return jsonify({
            "data": WalletResponseSchema().dump(wallet)
        }), 200

    except Exception as e:
        print(
            "UPDATE WALLET ERROR:",
            repr(e)
        )

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


@finance_bp.route(
    "/wallets/<uuid:wallet_id>",
    methods=["DELETE"]
)
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
        print(
            "DELETE WALLET ERROR:",
            repr(e)
        )

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


# ==================================================
# CATEGORY ROUTES
# ==================================================

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
        print(
            "GET CATEGORIES ERROR:",
            repr(e)
        )

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


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
        print(
            "CREATE CATEGORY ERROR:",
            repr(e)
        )

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


@finance_bp.route(
    "/categories/<uuid:category_id>",
    methods=["GET"]
)
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
        print(
            "GET CATEGORY ERROR:",
            repr(e)
        )

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


@finance_bp.route(
    "/categories/<uuid:category_id>",
    methods=["PATCH"]
)
@require_auth
def update_category(category_id):
    try:
        data = request.get_json() or {}

        validated_data = CategoryUpdateSchema().load(data)

        service = CategoryService()

        category = service.update_category(
            category_id=category_id,
            user_id=g.user_id,
            name=validated_data.get(
                "name",
                MISSING
            )
        )

        return jsonify({
            "data": CategoryResponseSchema().dump(category)
        }), 200

    except Exception as e:
        print(
            "UPDATE CATEGORY ERROR:",
            repr(e)
        )

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


@finance_bp.route(
    "/categories/<uuid:category_id>",
    methods=["DELETE"]
)
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
        print(
            "DELETE CATEGORY ERROR:",
            repr(e)
        )

        return jsonify({
            
            "error": {
                "message": str(e)
            }
        }), 400


# ==================================================
# DASHBOARD SUMMARY
# ==================================================

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
        print(
            "GET DASHBOARD SUMMARY ERROR:",
            repr(e)
        )

        return jsonify({
            "error": {
                "message": str(e)
            }
        }), 400


# ==================================================
# GENERAL FINANCIAL ANALYTICS
# ==================================================

@finance_bp.route("/analytics", methods=["GET"])
@require_auth
def get_financial_analytics():
    try:
        transaction_service = TransactionService()
        category_service = CategoryService()

        transactions = (
            transaction_service.get_all_transactions(
                user_id=g.user_id
            )
        )

        categories = (
            category_service.get_all_categories(
                user_id=g.user_id
            )
        )

        category_map = {
            str(category.id): category.name
            for category in categories
        }

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

        for transaction in transactions:
            if not transaction.amount:
                continue

            amount = Decimal(
                str(transaction.amount)
            )

            transaction_type = transaction.type

            if hasattr(transaction_type, "value"):
                transaction_type = transaction_type.value

            transaction_type = str(
                transaction_type
            ).upper()

            transaction_date = transaction.transaction_date

            if not transaction_date:
                continue

            month_key = transaction_date.strftime(
                "%Y-%m"
            )

            if transaction_type == "INCOME":
                total_income += amount

                monthly_data[
                    month_key
                ]["income"] += amount

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

        net_balance = (
            total_income - total_expenses
        )

        if total_income > Decimal("0.00"):
            savings_rate = (
                net_balance / total_income
            ) * Decimal("100")
        else:
            savings_rate = Decimal("0.00")

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

@finance_bp.route("/transactions", methods=["GET"])
@require_auth
def get_transactions():
    try:
        service = TransactionService()

        transactions = service.get_all_transactions(
            user_id=g.user_id
        )

        transactions = sorted(
            transactions,
            key=lambda txn: txn.transaction_date
            if txn.transaction_date
            else datetime.min,
            reverse=True
        )

        transaction_data = []

        for txn in transactions:
            transaction_type = txn.type

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


# ==================================================
# PDF FINANCIAL REPORT
# ==================================================

@finance_bp.route(
    "/reports/transactions/pdf",
    methods=["GET"]
)
@require_auth
def download_transactions_pdf():
    try:
        # --------------------------------------------------
        # READ DATE FILTERS
        # --------------------------------------------------

        start_date_text = request.args.get(
            "start_date",
            ""
        ).strip()

        end_date_text = request.args.get(
            "end_date",
            ""
        ).strip()

        if not start_date_text or not end_date_text:
            return jsonify({
                "error": {
                    "message": (
                        "start_date and end_date are required."
                    )
                }
            }), 400

        try:
            start_date = datetime.strptime(
                start_date_text,
                "%Y-%m-%d"
            ).date()

            end_date = datetime.strptime(
                end_date_text,
                "%Y-%m-%d"
            ).date()

        except ValueError:
            return jsonify({
                "error": {
                    "message": (
                        "Date format must be YYYY-MM-DD."
                    )
                }
            }), 400

        if start_date > end_date:
            return jsonify({
                "error": {
                    "message": (
                        "Start date cannot be greater than end date."
                    )
                }
            }), 400

        # --------------------------------------------------
        # LOAD SERVICES
        # --------------------------------------------------

        transaction_service = TransactionService()
        category_service = CategoryService()
        wallet_service = WalletService()

        all_transactions = (
            transaction_service.get_all_transactions(
                user_id=g.user_id
            )
        )

        categories = (
            category_service.get_all_categories(
                user_id=g.user_id
            )
        )

        wallets = (
            wallet_service.get_all_wallets(
                user_id=g.user_id
            )
        )

        # --------------------------------------------------
        # CREATE LOOKUP MAPS
        # --------------------------------------------------

        category_map = {
            str(category.id): category.name
            for category in categories
        }

        wallet_map = {
            str(wallet.id): wallet.name
            for wallet in wallets
        }

        # --------------------------------------------------
        # FILTER TRANSACTIONS BY DATE
        # --------------------------------------------------

        filtered_transactions = []

        for transaction in all_transactions:
            transaction_date = transaction.transaction_date

            if not transaction_date:
                continue

            if hasattr(transaction_date, "date"):
                transaction_day = transaction_date.date()
            else:
                transaction_day = transaction_date

            if start_date <= transaction_day <= end_date:
                filtered_transactions.append(transaction)

        filtered_transactions.sort(
            key=lambda transaction: (
                transaction.transaction_date
                if transaction.transaction_date
                else datetime.min
            ),
            reverse=True
        )

        # --------------------------------------------------
        # CALCULATE TOTALS
        # --------------------------------------------------

        total_income = Decimal("0.00")
        total_expenses = Decimal("0.00")

        for transaction in filtered_transactions:
            amount = Decimal(
                str(transaction.amount or 0)
            )

            transaction_type = transaction.type

            if hasattr(transaction_type, "value"):
                transaction_type = transaction_type.value

            transaction_type = str(
                transaction_type
            ).upper()

            if transaction_type == "INCOME":
                total_income += amount

            elif transaction_type == "EXPENSE":
                total_expenses += amount

        net_balance = (
            total_income - total_expenses
        )

        # --------------------------------------------------
        # CREATE PDF DOCUMENT
        # --------------------------------------------------

        pdf_buffer = BytesIO()

        document = SimpleDocTemplate(
            pdf_buffer,
            pagesize=landscape(A4),
            rightMargin=12 * mm,
            leftMargin=12 * mm,
            topMargin=12 * mm,
            bottomMargin=12 * mm
        )

        # --------------------------------------------------
        # PDF STYLES
        # --------------------------------------------------

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Title"],
            fontName=REPORT_FONT_NAME,
            fontSize=20,
            leading=24,
            alignment=TA_CENTER,
            spaceAfter=8
        )

        subtitle_style = ParagraphStyle(
            "ReportSubtitle",
            parent=styles["Normal"],
            fontName=REPORT_FONT_NAME,
            fontSize=10,
            leading=14,
            alignment=TA_CENTER,
            textColor=colors.grey,
            spaceAfter=14
        )

        normal_style = ParagraphStyle(
            "ReportNormal",
            parent=styles["Normal"],
            fontName=REPORT_FONT_NAME,
            fontSize=8,
            leading=10
        )

        right_style = ParagraphStyle(
            "ReportRight",
            parent=normal_style,
            fontName=REPORT_FONT_NAME,
            alignment=TA_RIGHT
        )

        # --------------------------------------------------
        # PDF ELEMENTS
        # --------------------------------------------------

        elements = []

        elements.append(
            Paragraph(
                "TrackWise Financial Report",
                title_style
            )
        )

        elements.append(
            Paragraph(
                (
                    f"Report Period: "
                    f"{start_date.strftime('%d-%m-%Y')} "
                    f"to "
                    f"{end_date.strftime('%d-%m-%Y')}"
                ),
                subtitle_style
            )
        )

        # --------------------------------------------------
        # SUMMARY TABLE
        # --------------------------------------------------

        summary_data = [
            [
                Paragraph(
                    "<b>Total Income</b>",
                    normal_style
                ),
                Paragraph(
                    "<b>Total Expenses</b>",
                    normal_style
                ),
                Paragraph(
                    "<b>Net Balance</b>",
                    normal_style
                ),
                Paragraph(
                    "<b>Total Transactions</b>",
                    normal_style
                )
            ],
            [
                Paragraph(
                    (
                        f"{REPORT_CURRENCY_PREFIX}"
                        f"{total_income:,.2f}"
                    ),
                    normal_style
                ),
                Paragraph(
                    (
                        f"{REPORT_CURRENCY_PREFIX}"
                        f"{total_expenses:,.2f}"
                    ),
                    normal_style
                ),
                Paragraph(
                    (
                        f"{REPORT_CURRENCY_PREFIX}"
                        f"{net_balance:,.2f}"
                    ),
                    normal_style
                ),
                Paragraph(
                    str(len(filtered_transactions)),
                    normal_style
                )
            ]
        ]

        summary_table = Table(
            summary_data,
            colWidths=[
                65 * mm,
                65 * mm,
                65 * mm,
                65 * mm
            ]
        )

        summary_table.setStyle(
            TableStyle([
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.HexColor("#E8F0FE")
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, 0),
                    colors.HexColor("#1F2937")
                ),
                (
                    "FONTNAME",
                    (0, 0),
                    (-1, -1),
                    REPORT_FONT_NAME
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor("#B8C2CC")
                ),
                (
                    "ALIGN",
                    (0, 0),
                    (-1, -1),
                    "CENTER"
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE"
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    8
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    8
                )
            ])
        )

        elements.append(summary_table)
        elements.append(Spacer(1, 14))

        # --------------------------------------------------
        # TRANSACTIONS TABLE HEADER
        # --------------------------------------------------

        table_header = [
            Paragraph(
                "<b>Date</b>",
                normal_style
            ),
            Paragraph(
                "<b>Type</b>",
                normal_style
            ),
            Paragraph(
                "<b>Description</b>",
                normal_style
            ),
            Paragraph(
                "<b>Wallet</b>",
                normal_style
            ),
            Paragraph(
                "<b>Category</b>",
                normal_style
            ),
            Paragraph(
                "<b>Amount</b>",
                right_style
            )
        ]

        table_rows = [
            table_header
        ]

        # --------------------------------------------------
        # TRANSACTIONS TABLE ROWS
        # --------------------------------------------------

        for transaction in filtered_transactions:
            transaction_date = transaction.transaction_date

            if hasattr(transaction_date, "strftime"):
                formatted_date = transaction_date.strftime(
                    "%d-%m-%Y"
                )
            else:
                formatted_date = str(transaction_date)

            transaction_type = transaction.type

            if hasattr(transaction_type, "value"):
                transaction_type = transaction_type.value

            transaction_type = str(
                transaction_type
            ).upper().capitalize()

            description = (
                transaction.description
                if transaction.description
                else "-"
            )

            wallet_name = (
                wallet_map.get(
                    str(transaction.wallet_id),
                    "-"
                )
                if getattr(
                    transaction,
                    "wallet_id",
                    None
                )
                else "-"
            )

            category_name = (
                category_map.get(
                    str(transaction.category_id),
                    "-"
                )
                if getattr(
                    transaction,
                    "category_id",
                    None
                )
                else "-"
            )

            amount = Decimal(
                str(transaction.amount or 0)
            )

            table_rows.append([
                Paragraph(
                    escape(formatted_date),
                    normal_style
                ),
                Paragraph(
                    escape(transaction_type),
                    normal_style
                ),
                Paragraph(
                    escape(str(description)),
                    normal_style
                ),
                Paragraph(
                    escape(str(wallet_name)),
                    normal_style
                ),
                Paragraph(
                    escape(str(category_name)),
                    normal_style
                ),
                Paragraph(
                    (
                        f"{REPORT_CURRENCY_PREFIX}"
                        f"{amount:,.2f}"
                    ),
                    right_style
                )
            ])

        # --------------------------------------------------
        # EMPTY TRANSACTION MESSAGE
        # --------------------------------------------------

        if not filtered_transactions:
            table_rows.append([
                Paragraph(
                    "No transactions found for the selected date range.",
                    normal_style
                ),
                "",
                "",
                "",
                "",
                ""
            ])

        # --------------------------------------------------
        # CREATE TRANSACTIONS TABLE
        # --------------------------------------------------

        transactions_table = Table(
            table_rows,
            colWidths=[
                28 * mm,
                25 * mm,
                75 * mm,
                45 * mm,
                45 * mm,
                38 * mm
            ],
            repeatRows=1
        )

        # --------------------------------------------------
        # TRANSACTIONS TABLE STYLING
        # --------------------------------------------------

        table_style_commands = [
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor("#DCE6F1")
            ),
            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                colors.HexColor("#1F2937")
            ),
            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                REPORT_FONT_NAME
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.4,
                colors.HexColor("#C7CDD4")
            ),
            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE"
            ),
            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                6
            ),
            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                6
            ),
            (
                "ALIGN",
                (-1, 1),
                (-1, -1),
                "RIGHT"
            )
        ]

        if not filtered_transactions:
            table_style_commands.append(
                (
                    "SPAN",
                    (0, 1),
                    (-1, 1)
                )
            )

        transactions_table.setStyle(
            TableStyle(table_style_commands)
        )

        elements.append(transactions_table)
        elements.append(Spacer(1, 12))

        elements.append(
            Paragraph(
                "Generated by TrackWise",
                subtitle_style
            )
        )

        # --------------------------------------------------
        # BUILD PDF
        # --------------------------------------------------

        document.build(elements)

        pdf_buffer.seek(0)

        filename = (
            f"trackwise_report_"
            f"{start_date_text}_"
            f"{end_date_text}.pdf"
        )

        return send_file(
            pdf_buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=filename,
            max_age=0
        )

    except Exception as e:
        print(
            "DOWNLOAD PDF REPORT ERROR:",
            repr(e)
        )

        return jsonify({
            "error": {
                "message": (
                    f"Unable to generate PDF report: {str(e)}"
                )
            }
        }), 500

