import uuid
from decimal import Decimal
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
    def __init__(self, txn_repo=None, wallet_service=None, category_service=None):
        self.txn_repo = txn_repo or TransactionRepository()
        self.wallet_service = wallet_service or WalletService()
        self.category_service = category_service or CategoryService()

    def create_transaction(
        self, user_id: uuid.UUID, wallet_id: uuid.UUID, type: TransactionType, 
        amount: Decimal, transaction_date: datetime, category_id: uuid.UUID = None, description: str = None
    ) -> Transaction:
        # 1. Validation
        if type not in (TransactionType.INCOME, TransactionType.EXPENSE):
            raise APIException("Invalid transaction type.", status_code=400)
            
        amount_dec = Decimal(amount)
        if amount_dec <= Decimal("0.00"):
            raise APIException("Transaction amount must be strictly positive.", status_code=400)

        wallet = self.wallet_service.get_wallet(wallet_id, user_id)
        if category_id:
            self.category_service.get_category(category_id, user_id)

        # 2. State Mutation
        txn = Transaction(
            user_id=user_id,
            wallet_id=wallet_id,
            category_id=category_id,
            type=type,
            amount=amount_dec,
            transaction_date=transaction_date,
            description=description
        )
        
        if type == TransactionType.INCOME:
            wallet.balance += amount_dec
        elif type == TransactionType.EXPENSE:
            wallet.balance -= amount_dec
            
        self.txn_repo.add(txn)

        # 3. Atomic Commit
        try:
            db.session.commit()
            return txn
        except Exception:
            db.session.rollback()
            raise APIException("Failed to create transaction.", status_code=500)

    def get_transaction(self, txn_id: uuid.UUID, user_id: uuid.UUID) -> Transaction:
        txn = self.txn_repo.get_active_by_id(txn_id, user_id)
        if not txn:
            raise APIException("Transaction not found.", status_code=404)
        return txn

    def get_all_transactions(self, user_id: uuid.UUID) -> Sequence[Transaction]:
        return self.txn_repo.get_all_active_by_user(user_id)

    def update_transaction(
        self, txn_id: uuid.UUID, user_id: uuid.UUID, 
        wallet_id=MISSING, category_id=MISSING, type=MISSING, 
        amount=MISSING, transaction_date=MISSING, description=MISSING
    ) -> Transaction:
        txn = self.get_transaction(txn_id, user_id)
        
        # 1. Validate and resolve all new values
        new_wallet_id = txn.wallet_id if wallet_id is MISSING else wallet_id
        new_wallet = self.wallet_service.get_wallet(new_wallet_id, user_id)
        
        new_cat_id = txn.category_id if category_id is MISSING else category_id
        if new_cat_id is not None:
            self.category_service.get_category(new_cat_id, user_id)
            
        new_type = txn.type if type is MISSING else type
        if new_type not in (TransactionType.INCOME, TransactionType.EXPENSE):
            raise APIException("Invalid transaction type.", status_code=400)
            
        new_amount = txn.amount if amount is MISSING else Decimal(amount)
        if new_amount <= Decimal("0.00"):
            raise APIException("Transaction amount must be strictly positive.", status_code=400)
            
        new_date = txn.transaction_date if transaction_date is MISSING else transaction_date
        new_desc = txn.description if description is MISSING else description

        # 2. Apply financial mutations safely
        old_wallet = self.wallet_service.get_wallet(txn.wallet_id, user_id) if new_wallet_id != txn.wallet_id else new_wallet
        
        # Reverse old effect
        if txn.type == TransactionType.INCOME:
            old_wallet.balance -= txn.amount
        else:
            old_wallet.balance += txn.amount
            
        # Apply new effect
        if new_type == TransactionType.INCOME:
            new_wallet.balance += new_amount
        else:
            new_wallet.balance -= new_amount

        # 3. Update entity fields
        txn.wallet_id = new_wallet_id
        txn.category_id = new_cat_id
        txn.type = new_type
        txn.amount = new_amount
        txn.transaction_date = new_date
        txn.description = new_desc

        # 4. Atomic Commit
        try:
            db.session.commit()
            return txn
        except Exception:
            db.session.rollback()
            raise APIException("Failed to update transaction.", status_code=500)

    def delete_transaction(self, txn_id: uuid.UUID, user_id: uuid.UUID) -> None:
        txn = self.get_transaction(txn_id, user_id)
        wallet = self.wallet_service.get_wallet(txn.wallet_id, user_id)
        
        # Reverse financial effect
        if txn.type == TransactionType.INCOME:
            wallet.balance -= txn.amount
        else:
            wallet.balance += txn.amount
            
        txn.deleted_at = utc_now()

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise APIException("Failed to delete transaction.", status_code=500)