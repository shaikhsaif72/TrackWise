import uuid
from decimal import Decimal
from typing import Sequence

from app.extensions import db
from app.core.exceptions import APIException
from app.core.constants import MISSING
from app.core.utils.datetime import utc_now
from app.modules.finance.models import Wallet
from app.modules.finance.repositories import WalletRepository


class WalletService:

    def __init__(self, wallet_repo: WalletRepository = None):
        self.wallet_repo = wallet_repo or WalletRepository()

    # --------------------------------------------------
    # CREATE WALLET
    # --------------------------------------------------
    def create_wallet(
        self,
        user_id: uuid.UUID,
        name: str,
        balance: Decimal = Decimal("0.00"),
        currency: str = "INR"
    ) -> Wallet:

        if not name or not name.strip():
            raise APIException(
                "Wallet name cannot be empty.",
                status_code=400
            )

        try:
            wallet = Wallet(
                user_id=user_id,
                name=name.strip(),
                balance=Decimal(str(balance)),
                # TrackWise supports INR only
                currency="INR"
            )

            self.wallet_repo.add(wallet)
            db.session.commit()

            return wallet

        except APIException:
            db.session.rollback()
            raise

        except Exception as e:
            db.session.rollback()
            print("CREATE WALLET SERVICE ERROR:", repr(e))

            raise APIException(
                "Failed to create wallet.",
                status_code=500
            )

    # --------------------------------------------------
    # GET SINGLE WALLET
    # --------------------------------------------------
    def get_wallet(
        self,
        wallet_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> Wallet:

        wallet = self.wallet_repo.get_active_by_id(
            wallet_id,
            user_id
        )

        if not wallet:
            raise APIException(
                "Wallet not found.",
                status_code=404
            )

        return wallet

    # --------------------------------------------------
    # GET ALL ACTIVE WALLETS
    # --------------------------------------------------
    def get_all_wallets(
        self,
        user_id: uuid.UUID
    ) -> Sequence[Wallet]:

        return self.wallet_repo.get_all_active_by_user(
            user_id
        )

    # --------------------------------------------------
    # UPDATE WALLET
    # --------------------------------------------------
    def update_wallet(
        self,
        wallet_id: uuid.UUID,
        user_id: uuid.UUID,
        name=MISSING,
        currency=MISSING
    ) -> Wallet:

        wallet = self.get_wallet(
            wallet_id,
            user_id
        )

        if name is not MISSING:
            if not name or not str(name).strip():
                raise APIException(
                    "Wallet name cannot be empty.",
                    status_code=400
                )

            wallet.name = str(name).strip()

        # TrackWise supports INR only
        wallet.currency = "INR"

        try:
            db.session.commit()
            return wallet

        except Exception as e:
            db.session.rollback()
            print("UPDATE WALLET SERVICE ERROR:", repr(e))

            raise APIException(
                "Failed to update wallet.",
                status_code=500
            )

    # --------------------------------------------------
    # DELETE WALLET - SOFT DELETE
    # --------------------------------------------------
    def delete_wallet(
        self,
        wallet_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> None:

        wallet = self.get_wallet(
            wallet_id,
            user_id
        )

        wallet.deleted_at = utc_now()

        try:
            db.session.commit()

        except Exception as e:
            db.session.rollback()
            print("DELETE WALLET SERVICE ERROR:", repr(e))

            raise APIException(
                "Failed to delete wallet.",
                status_code=500
            )