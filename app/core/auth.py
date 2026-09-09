import uuid
import jwt
from functools import wraps
from flask import request, current_app, g
from app.core.exceptions import APIException

def require_auth(f):
    """
    Decorator for API routes ensuring valid JWT authentication.
    Safely verifies Bearer token and injects a verified uuid.UUID into flask.g.user_id.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # 1. Read Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            raise APIException("Authentication required. Missing Authorization header.", status_code=401)
        
        # 2. Require Bearer scheme
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise APIException("Invalid authentication scheme. Expected Bearer.", status_code=401)
        
        token = parts[1]
        if not token:
            raise APIException("Invalid authentication scheme. Missing token.", status_code=401)
        
        secret = current_app.config.get("AUTH_SECRET_KEY")
        if not secret:
            # Server misconfiguration, but presented as 401 to avoid leaking server state to client
            raise APIException("Server authentication configuration missing.", status_code=401)
            
        algorithm = current_app.config.get("JWT_ALGORITHM", "HS256")
        
        try:
            # Explicitly enforce algorithm matching, and require 'sub', 'iat', and 'exp' claims.
            payload = jwt.decode(
                token,
                secret,
                algorithms=[algorithm],
                options={
                    "require": ["sub", "iat", "exp"],
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_iat": True
                }
            )
        except jwt.ExpiredSignatureError:
            raise APIException("Authentication token has expired.", status_code=401)
        except jwt.InvalidAlgorithmError:
            raise APIException("Invalid authentication algorithm.", status_code=401)
        except jwt.MissingRequiredClaimError:
            raise APIException("Authentication token missing required claims.", status_code=401)
        except jwt.InvalidTokenError:
            raise APIException("Invalid authentication token.", status_code=401)
        except Exception:
            raise APIException("Authentication verification failed.", status_code=401)
            
        # Extract sub claim
        sub = payload.get("sub")
        if not sub:
            raise APIException("Invalid authentication token. Missing subject.", status_code=401)
            
        # Convert sub to uuid.UUID
        try:
            user_id = uuid.UUID(str(sub))
        except ValueError:
            raise APIException("Invalid authentication token. Malformed subject.", status_code=401)
            
        # Store strictly as UUID in Flask application context
        g.user_id = user_id
        
        # Execute wrapped route
        return f(*args, **kwargs)
        
    return decorated