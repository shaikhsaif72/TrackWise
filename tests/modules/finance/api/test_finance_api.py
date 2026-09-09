import uuid
import pytest
import jwt
from datetime import datetime, timezone, timedelta
from app.modules.finance.models import TransactionType
from app.modules.finance.services.wallet_service import WalletService
from app.modules.finance.services.category_service import CategoryService
from app.modules.finance.services.transaction_service import TransactionService
from app.modules.finance.services.budget_service import BudgetService

# --- Test Authentication Helper ---
def create_auth_token(user_id: uuid.UUID) -> str:
    """Generates a mathematically valid JWT signed with the testing secret key."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": now.timestamp(),
        "exp": (now + timedelta(hours=1)).timestamp()
    }
    return jwt.encode(
        payload,
        "test-auth-secret-key-32-bytes-long!!",
        algorithm="HS256"
    )

# --- Wallet API Tests ---

def test_wallet_api_crud_and_isolation(client, db_session):
    user_a = uuid.uuid4()
    user_b = uuid.uuid4()
    
    headers_a = {"Authorization": f"Bearer {create_auth_token(user_a)}"}
    headers_b = {"Authorization": f"Bearer {create_auth_token(user_b)}"}

    # 1. Reject Missing Auth
    assert client.get("/api/v1/finance/wallets").status_code == 401

    # 2. Create
    res = client.post("/api/v1/finance/wallets", json={"name": "Bank", "balance": "100.50"}, headers=headers_a)
    assert res.status_code == 201
    wallet_id = res.json["data"]["id"]
    assert res.json["data"]["balance"] == "100.50"

    # 3. Tenant Isolation
    # Client cannot override identity via JSON request body
    client.post("/api/v1/finance/wallets", json={"name": "Bank B", "user_id": str(user_a)}, headers=headers_b)
    
    # User B attempting to access User A's wallet gets a generic 404
    res_b = client.get(f"/api/v1/finance/wallets/{wallet_id}", headers=headers_b)
    assert res_b.status_code == 404

    # 4. List
    res = client.get("/api/v1/finance/wallets", headers=headers_a)
    assert res.status_code == 200
    assert len(res.json["data"]) == 1

    # 5. Unknown Field Rejection (marshmallow.RAISE)
    res = client.patch(f"/api/v1/finance/wallets/{wallet_id}", json={"invalid_field": "123"}, headers=headers_a)
    assert res.status_code == 400

    # 6. Delete
    res = client.delete(f"/api/v1/finance/wallets/{wallet_id}", headers=headers_a)
    assert res.status_code == 200

# --- Transaction API Tests ---

def test_transaction_api_crud_and_patch_semantics(client, db_session):
    user_id = uuid.uuid4()
    headers = {"Authorization": f"Bearer {create_auth_token(user_id)}"}

    # Setup
    wallet = WalletService().create_wallet(user_id, "Test")
    cat = CategoryService().create_category(user_id, "Food")
    db_session.commit()

    # 1. Create Transaction (Implicitly tests JSON Decimal mapping)
    payload = {
        "wallet_id": str(wallet.id),
        "category_id": str(cat.id),
        "type": "EXPENSE",
        "amount": "50.00",
        "transaction_date": "2026-01-01T12:00:00Z"
    }
    res = client.post("/api/v1/finance/transactions", json=payload, headers=headers)
    assert res.status_code == 201
    txn_id = res.json["data"]["id"]

    # 2. PATCH Semantics (Explicitly passing None maps to None, omitted preserves data)
    res = client.patch(f"/api/v1/finance/transactions/{txn_id}", json={"category_id": None}, headers=headers)
    assert res.status_code == 200
    assert res.json["data"]["category_id"] is None
    # Amount was omitted in JSON, so it falls back to MISSING inside the controller and is left untouched by the service
    assert res.json["data"]["amount"] == "50.00"

# --- Budget & Analytics API Tests ---

def test_budget_api_and_advanced_endpoints(client, db_session):
    user_id = uuid.uuid4()
    headers = {"Authorization": f"Bearer {create_auth_token(user_id)}"}

    # 1. Create Overall Budget
    payload = {
        "amount": "100.00",
        "start_date": "2026-01-01",
        "end_date": "2026-01-31"
    }
    res = client.post("/api/v1/finance/budgets", json=payload, headers=headers)
    assert res.status_code == 201
    budget_id = res.json["data"]["id"]

    # 2. Analytics 
    res = client.get(f"/api/v1/finance/budgets/{budget_id}/analytics?timezone=UTC", headers=headers)
    assert res.status_code == 200
    assert res.json["data"]["budget_amount"] == "100.00"
    
    # 3. Pacing
    res = client.get(f"/api/v1/finance/budgets/{budget_id}/pacing?timezone=UTC&as_of_date=2026-01-15", headers=headers)
    assert res.status_code == 200
    assert res.json["data"]["total_days"] == 31
    
    # 4. Rollover
    rollover_payload = {
        "instructions": [{
            "category_id": None,
            "new_start_date": "2026-02-01",
            "new_end_date": "2026-02-28",
            "new_amount": "50.00"
        }]
    }
    res = client.post("/api/v1/finance/budgets/rollover/bulk", json=rollover_payload, headers=headers)
    assert res.status_code == 200
    assert len(res.json["data"]) == 1
    assert res.json["data"][0]["amount"] == "150.00" # 100 unspent + 50 new