import uuid
import jwt
import pytest
from datetime import datetime, timezone, timedelta
from flask import Flask, g, jsonify
from app.core.exceptions import APIException
from app.core.auth import require_auth

# --- Test Application Harness ---

@pytest.fixture
def auth_test_app():
    """Minimal Flask app to test the authentication decorator in isolation."""
    app = Flask(__name__)
    app.config["AUTH_SECRET_KEY"] = "trackwise-test-auth-secret-key-2026-strong-123456"
    app.config["JWT_ALGORITHM"] = "HS256"
    app.config["TESTING"] = True

    # Local error handler strictly to catch the expected APIExceptions in tests
    @app.errorhandler(APIException)
    def handle_api_exception(e):
        return jsonify({"error": {"message": e.message}}), e.status_code

    # Temporary protected endpoint ONLY for verifying authentication context
    @app.route("/protected")
    @require_auth
    def protected():
        # Prove that g.user_id is a valid UUID type and accessible
        user_id = g.user_id
        is_uuid_type = isinstance(user_id, uuid.UUID)
        return jsonify({"user_id": str(user_id), "is_uuid": is_uuid_type}), 200

    return app

@pytest.fixture
def auth_client(auth_test_app):
    """Test client for the minimal auth app."""
    return auth_test_app.test_client()

# --- Test Token Generator ---

def generate_test_token(secret, sub=None, expired=False, omit_claims=None, wrong_alg=False, tampered=False):
    """Helper to generate JWTs programmatically without requiring a login route."""
    now = datetime.now(timezone.utc)
    exp = now - timedelta(hours=1) if expired else now + timedelta(hours=1)
    
    payload = {
        "iat": now.timestamp(),
        "exp": exp.timestamp()
    }
    
    if sub is not False:
        payload["sub"] = str(sub) if sub else str(uuid.uuid4())
        
    if omit_claims:
        for claim in omit_claims:
            payload.pop(claim, None)
            
    alg = "HS384" if wrong_alg else "HS256"
    token = jwt.encode(payload, secret, algorithm=alg)
    
    if tampered:
        # Tamper with the payload (middle segment) without recalculating the signature
        parts = token.split(".")
        parts[1] = "eyJzdWIiOiAibm90LW15LXV1aWQifQ"  # Base64 for {"sub": "not-my-uuid"}
        token = ".".join(parts)
        
    return token

# --- Authentication Tests ---

def test_missing_authorization_header(auth_client):
    response = auth_client.get("/protected")
    assert response.status_code == 401
    assert "Missing Authorization header" in response.get_json()["error"]["message"]

def test_empty_authorization_header(auth_client):
    response = auth_client.get("/protected", headers={"Authorization": ""})
    assert response.status_code == 401
    assert "Missing Authorization header" in response.get_json()["error"]["message"]

def test_non_bearer_authorization(auth_client):
    response = auth_client.get("/protected", headers={"Authorization": "Token 12345"})
    assert response.status_code == 401
    assert "Expected Bearer" in response.get_json()["error"]["message"]

def test_bearer_without_token(auth_client):
    response = auth_client.get("/protected", headers={"Authorization": "Bearer "})
    assert response.status_code == 401
    assert "Expected Bearer" in response.get_json()["error"]["message"]

def test_malformed_jwt(auth_client):
    response = auth_client.get("/protected", headers={"Authorization": "Bearer not-a-real-jwt"})
    assert response.status_code == 401
    assert "Invalid authentication token" in response.get_json()["error"]["message"]

def test_expired_jwt(auth_client, auth_test_app):
    token = generate_test_token(auth_test_app.config["AUTH_SECRET_KEY"], expired=True)
    response = auth_client.get("/protected", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert "expired" in response.get_json()["error"]["message"]

def test_invalid_signature_tampered_payload(auth_client, auth_test_app):
    token = generate_test_token(auth_test_app.config["AUTH_SECRET_KEY"], tampered=True)
    response = auth_client.get("/protected", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert "Invalid authentication token" in response.get_json()["error"]["message"]

def test_wrong_signing_secret(auth_client):
    token = generate_test_token("trackwise-wrong-secret-key-2026-strong")
    response = auth_client.get("/protected", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert "Invalid authentication token" in response.get_json()["error"]["message"]

def test_missing_sub_claim(auth_client, auth_test_app):
    token = generate_test_token(auth_test_app.config["AUTH_SECRET_KEY"], sub=False)
    response = auth_client.get("/protected", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert "missing required claims" in response.get_json()["error"]["message"]

def test_missing_iat_claim(auth_client, auth_test_app):
    token = generate_test_token(auth_test_app.config["AUTH_SECRET_KEY"], omit_claims=["iat"])
    response = auth_client.get("/protected", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert "missing required claims" in response.get_json()["error"]["message"]

def test_invalid_uuid_sub_claim(auth_client, auth_test_app):
    token = generate_test_token(auth_test_app.config["AUTH_SECRET_KEY"], sub="not-a-valid-uuid")
    response = auth_client.get("/protected", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert "Malformed subject" in response.get_json()["error"]["message"]

def test_algorithm_mismatch(auth_client, auth_test_app):
    token = generate_test_token(auth_test_app.config["AUTH_SECRET_KEY"], wrong_alg=True)
    response = auth_client.get("/protected", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert "Invalid authentication algorithm" in response.get_json()["error"]["message"]

def test_valid_jwt_success_and_injection(auth_client, auth_test_app):
    user_id = uuid.uuid4()
    token = generate_test_token(auth_test_app.config["AUTH_SECRET_KEY"], sub=user_id)
    
    response = auth_client.get("/protected", headers={"Authorization": f"Bearer {token}"})
    
    assert response.status_code == 200
    data = response.get_json()
    
    # Prove the endpoint succeeded, injected the correct string UUID, and that it was cast to a real UUID object
    assert data["user_id"] == str(user_id)
    assert data["is_uuid"] is True

def test_client_cannot_override_identity(auth_client, auth_test_app):
    """
    Proves that sending alternate identity data via request parameters
    cannot override the securely extracted g.user_id from the verified JWT.
    """
    true_user_id = uuid.uuid4()
    forged_user_id = uuid.uuid4()
    
    token = generate_test_token(auth_test_app.config["AUTH_SECRET_KEY"], sub=true_user_id)
    
    # Attempting to forge identity via headers
    headers = {
        "Authorization": f"Bearer {token}",
        "X-User-ID": str(forged_user_id),
        "user_id": str(forged_user_id)
    }
    
    # Attempting to forge identity via query param
    response = auth_client.get(f"/protected?user_id={forged_user_id}", headers=headers)
    
    assert response.status_code == 200
    
    # The application context perfectly isolated the true JWT subject
    assert response.get_json()["user_id"] == str(true_user_id)
    assert response.get_json()["user_id"] != str(forged_user_id)