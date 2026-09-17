import uuid
from decimal import Decimal, InvalidOperation
from datetime import datetime
from typing import Sequence

from app.extensions import db
from app.core.exceptions import APIException
from app.core.constants import MISSING
from app.core.utils.datetime import utc_now
from app.modules.finance.models import Transaction, TransactionType
from app.modules.finance.repositories import TransactionRepository
from app.modules.finance.services.wallet_service import WalletService
from app.modules.finance.services.category_service import CategoryService


class TransactionService:

    def __init__(
        self,
        txn_repo=None,
        wallet_service=None,
        category_service=None
    ):
        self.txn_repo = txn_repo or TransactionRepository()
        self.wallet_service = wallet_service or WalletService()
        self.category_service = category_service or CategoryService()

    # ==================================================
    # CREATE TRANSACTION
    # ==================================================
    def create_transaction(
        self,
        user_id: uuid.UUID,
        wallet_id: uuid.UUID,
        type: TransactionType,
        amount: Decimal,
        transaction_date: datetime,
        category_id: uuid.UUID = None,
        description: str = None
    ) -> Transaction:

        # --------------------------------------------------
        # Validate transaction type
        # --------------------------------------------------
        if isinstance(type, str):
            try:
                type = TransactionType(type.upper())
            except ValueError:
                raise APIException(
                    "Invalid transaction type.",
                    status_code=400
                )

        if type not in (
            TransactionType.INCOME,
            TransactionType.EXPENSE
        ):
            raise APIException(
                "Invalid transaction type.",
                status_code=400
            )

        # --------------------------------------------------
        # Validate amount
        # --------------------------------------------------
        try:
            amount_dec = Decimal(str(amount))
        except (InvalidOperation, TypeError, ValueError):
            raise APIException(
                "Invalid transaction amount.",
                status_code=400
            )

        if amount_dec <= Decimal("0.00"):
            raise APIException(
                "Transaction amount must be strictly positive.",
                status_code=400
            )

        # --------------------------------------------------
        # Get wallet
        # --------------------------------------------------
        wallet = self.wallet_service.get_wallet(
            wallet_id,
            user_id
        )

        # --------------------------------------------------
        # Validate category
        # --------------------------------------------------
        if category_id:
            self.category_service.get_category(
                category_id,
                user_id
            )

        # --------------------------------------------------
        # IMPORTANT:
        # Prevent expense greater than wallet balance
        # --------------------------------------------------
        current_balance = Decimal(
            str(wallet.balance or Decimal("0.00"))
        )

        if type == TransactionType.EXPENSE:

            if amount_dec > current_balance:

                raise APIException(
                    "Insufficient wallet balance. "
                    f"Available balance: {current_balance:.2f}. "
                    f"Expense amount: {amount_dec:.2f}.",
                    status_code=400
                )

        # --------------------------------------------------
        # Create transaction
        # --------------------------------------------------
        txn = Transaction(
            user_id=user_id,
            wallet_id=wallet_id,
            category_id=category_id,
            type=type,
            amount=amount_dec,
            transaction_date=transaction_date,
            description=description
        )

        # --------------------------------------------------
        # Update wallet balance
        # --------------------------------------------------
        if type == TransactionType.INCOME:

            wallet.balance = (
                current_balance + amount_dec
            )

        else:

            wallet.balance = (
                current_balance - amount_dec
            )

        # --------------------------------------------------
        # Save transaction
        # --------------------------------------------------
        self.txn_repo.add(txn)

        try:

            db.session.commit()
            return txn

        except Exception as e:

            db.session.rollback()

            print(
                "CREATE TRANSACTION ERROR:",
                repr(e)
            )

            raise APIException(
                "Failed to create transaction.",
                status_code=500
            )

    # ==================================================
    # GET SINGLE TRANSACTION
    # ==================================================
    def get_transaction(
        self,
        txn_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> Transaction:

        txn = self.txn_repo.get_active_by_id(
            txn_id,
            user_id
        )

        if not txn:
            raise APIException(
                "Transaction not found.",
                status_code=404
            )

        return txn

    # ==================================================
    # GET ALL TRANSACTIONS
    # ==================================================
    def get_all_transactions(
        self,
        user_id: uuid.UUID
    ) -> Sequence[Transaction]:

        return self.txn_repo.get_all_active_by_user(
            user_id
        )

    # ==================================================
    # DASHBOARD SUMMARY
    # ==================================================
    def get_dashboard_summary(
        self,
        user_id: uuid.UUID
    ) -> dict:

        wallets = self.wallet_service.get_all_wallets(
            user_id
        )

        transactions = self.get_all_transactions(
            user_id
        )

        # --------------------------------------------------
        # Total wallet balance
        # --------------------------------------------------
        total_balance = sum(
            (
                Decimal(str(wallet.balance or 0))
                for wallet in wallets
            ),
            Decimal("0.00")
        )

        # --------------------------------------------------
        # Total income
        # --------------------------------------------------
        total_income = sum(
            (
                Decimal(str(txn.amount or 0))
                for txn in transactions
                if txn.type == TransactionType.INCOME
            ),
            Decimal("0.00")
        )

        # --------------------------------------------------
        # Total expenses
        # --------------------------------------------------
        total_expenses = sum(
            (
                Decimal(str(txn.amount or 0))
                for txn in transactions
                if txn.type == TransactionType.EXPENSE
            ),
            Decimal("0.00")
        )

        # --------------------------------------------------
        # Net savings
        # --------------------------------------------------
        net_savings = (
            total_income - total_expenses
        )

        return {
            "totalBalance": total_balance,
            "income": total_income,
            "expenses": total_expenses,
            "savings": net_savings,
            "currency": "INR",
            "isDemo": False
        }

    # ==================================================
    # UPDATE TRANSACTION
    # ==================================================
    def update_transaction(
        self,
        txn_id: uuid.UUID,
        user_id: uuid.UUID,
        wallet_id=MISSING,
        category_id=MISSING,
        type=MISSING,
        amount=MISSING,
        transaction_date=MISSING,
        description=MISSING
    ) -> Transaction:

        # --------------------------------------------------
        # Get existing transaction
        # --------------------------------------------------
        txn = self.get_transaction(
            txn_id,
            user_id
        )

        # --------------------------------------------------
        # Determine new wallet
        # --------------------------------------------------
        new_wallet_id = (
            txn.wallet_id
            if wallet_id is MISSING
            else wallet_id
        )

        new_wallet = self.wallet_service.get_wallet(
            new_wallet_id,
            user_id
        )

        # --------------------------------------------------
        # Determine new category
        # --------------------------------------------------
        new_cat_id = (
            txn.category_id
            if category_id is MISSING
            else category_id
        )

        if new_cat_id is not None:

            self.category_service.get_category(
                new_cat_id,
                user_id
            )

        # --------------------------------------------------
        # Determine new transaction type
        # --------------------------------------------------
        new_type = (
            txn.type
            if type is MISSING
            else type
        )

        if isinstance(new_type, str):

            try:
                new_type = TransactionType(
                    new_type.upper()
                )

            except ValueError:

                raise APIException(
                    "Invalid transaction type.",
                    status_code=400
                )

        if new_type not in (
            TransactionType.INCOME,
            TransactionType.EXPENSE
        ):
            raise APIException(
                "Invalid transaction type.",
                status_code=400
            )

        # --------------------------------------------------
        # Determine new amount
        # --------------------------------------------------
        if amount is MISSING:

            new_amount = Decimal(
                str(txn.amount)
            )

        else:

            try:
                new_amount = Decimal(
                    str(amount)
                )

            except (InvalidOperation, TypeError, ValueError):

                raise APIException(
                    "Invalid transaction amount.",
                    status_code=400
                )

        if new_amount <= Decimal("0.00"):

            raise APIException(
                "Transaction amount must be strictly positive.",
                status_code=400
            )

        # --------------------------------------------------
        # Determine other values
        # --------------------------------------------------
        new_date = (
            txn.transaction_date
            if transaction_date is MISSING
            else transaction_date
        )

        new_desc = (
            txn.description
            if description is MISSING
            else description
        )

        # --------------------------------------------------
        # Get old wallet
        # --------------------------------------------------
        old_wallet = (
            self.wallet_service.get_wallet(
                txn.wallet_id,
                user_id
            )
            if new_wallet_id != txn.wallet_id
            else new_wallet
        )

        old_wallet_balance = Decimal(
            str(old_wallet.balance or Decimal("0.00"))
        )

        old_amount = Decimal(
            str(txn.amount)
        )

        # --------------------------------------------------
        # Calculate balance after removing old transaction
        # --------------------------------------------------
        if txn.type == TransactionType.INCOME:

            balance_after_reversal = (
                old_wallet_balance - old_amount
            )

        else:

            balance_after_reversal = (
                old_wallet_balance + old_amount
            )

        # --------------------------------------------------
        # Determine available balance for new expense
        # --------------------------------------------------
        if new_wallet_id == txn.wallet_id:

            available_balance = (
                balance_after_reversal
            )

        else:

            available_balance = Decimal(
                str(
                    new_wallet.balance
                    or Decimal("0.00")
                )
            )

        # --------------------------------------------------
        # IMPORTANT:
        # Prevent update from creating negative balance
        # --------------------------------------------------
        if new_type == TransactionType.EXPENSE:

            if new_amount > available_balance:

                raise APIException(
                    "Insufficient wallet balance. "
                    f"Available balance: "
                    f"{available_balance:.2f}. "
                    f"Expense amount: "
                    f"{new_amount:.2f}.",
                    status_code=400
                )

        # --------------------------------------------------
        # Apply wallet changes
        # --------------------------------------------------
        if new_wallet_id == txn.wallet_id:

            # Reverse old transaction
            old_wallet.balance = (
                balance_after_reversal
            )

            # Apply new transaction
            if new_type == TransactionType.INCOME:

                old_wallet.balance = (
                    old_wallet.balance
                    + new_amount
                )

            else:

                old_wallet.balance = (
                    old_wallet.balance
                    - new_amount
                )

        else:

            # ----------------------------------------------
            # Reverse old transaction from old wallet
            # ----------------------------------------------
            old_wallet.balance = (
                balance_after_reversal
            )

            # ----------------------------------------------
            # Apply new transaction to new wallet
            # ----------------------------------------------
            new_wallet_balance = Decimal(
                str(
                    new_wallet.balance
                    or Decimal("0.00")
                )
            )

            if new_type == TransactionType.INCOME:

                new_wallet.balance = (
                    new_wallet_balance
                    + new_amount
                )

            else:

                new_wallet.balance = (
                    new_wallet_balance
                    - new_amount
                )

        # --------------------------------------------------
        # Update transaction object
        # --------------------------------------------------
        txn.wallet_id = new_wallet_id
        txn.category_id = new_cat_id
        txn.type = new_type
        txn.amount = new_amount
        txn.transaction_date = new_date
        txn.description = new_desc

        # --------------------------------------------------
        # Save changes
        # --------------------------------------------------
        try:

            db.session.commit()

            return txn

        except Exception as e:

            db.session.rollback()

            print(
                "UPDATE TRANSACTION ERROR:",
                repr(e)
            )

            raise APIException(
                "Failed to update transaction.",
                status_code=500
            )

    # ==================================================
    # DELETE TRANSACTION
    # ==================================================
    def delete_transaction(
        self,
        txn_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> None:

        # --------------------------------------------------
        # Get transaction
        # --------------------------------------------------
        txn = self.get_transaction(
            txn_id,
            user_id
        )

        # --------------------------------------------------
        # Try to find wallet
        # --------------------------------------------------
        wallet = None

        if txn.wallet_id:

            try:

                wallet = self.wallet_service.get_wallet(
                    txn.wallet_id,
                    user_id
                )

            except Exception as wallet_error:

                print(
                    "DELETE TRANSACTION WALLET WARNING:",
                    repr(wallet_error)
                )

                wallet = None

        # --------------------------------------------------
        # Reverse transaction effect
        # --------------------------------------------------
        if wallet:

            wallet_balance = Decimal(
                str(
                    wallet.balance
                    or Decimal("0.00")
                )
            )

            transaction_amount = Decimal(
                str(txn.amount)
            )

            if txn.type == TransactionType.INCOME:

                wallet.balance = (
                    wallet_balance
                    - transaction_amount
                )

            else:

                wallet.balance = (
                    wallet_balance
                    + transaction_amount
                )

        # --------------------------------------------------
        # Soft delete transaction
        # --------------------------------------------------
        txn.deleted_at = utc_now()

        # --------------------------------------------------
        # Save
        # --------------------------------------------------
        try:

            db.session.commit()

        except Exception as e:

            db.session.rollback()

            print(
                "DELETE TRANSACTION ERROR:",
                repr(e)
            )

            raise APIException(
                "Failed to delete transaction.",
                status_code=500
            )