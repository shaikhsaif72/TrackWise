import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration."""
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    
    # Authentication Configuration
    AUTH_SECRET_KEY = os.getenv(
        "AUTH_SECRET_KEY",
        "trackwise-development-auth-secret-key-2026"
    )
    JWT_ALGORITHM = "HS256"
    TOKEN_EXPIRATION_HOURS = int(os.getenv("TOKEN_EXPIRATION_HOURS", 1))
    
    # Database Configuration
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///:memory:")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEBUG = False
    TESTING = False

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/trackwise_dev"
    )

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    # Enforce deterministic safe secret for tests
    AUTH_SECRET_KEY = "test-auth-secret-key-32-bytes-long!!"
    
    def __init__(self):
        self.SQLALCHEMY_DATABASE_URI = os.getenv("TEST_DATABASE_URL")
        if not self.SQLALCHEMY_DATABASE_URI:
            raise ValueError(
                "CRITICAL: TEST_DATABASE_URL environment variable is missing. "
                "Integration tests strictly require an isolated PostgreSQL test database."
            )

class ProductionConfig(Config):
    """Production configuration enforcing strict secrets."""
    DEBUG = False
    
    def __init__(self):
        self.SECRET_KEY = os.getenv("SECRET_KEY")
        self.AUTH_SECRET_KEY = os.getenv("AUTH_SECRET_KEY")
        self.SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
        
        if not self.SECRET_KEY:
            raise ValueError("SECRET_KEY environment variable is required in production.")
        if not self.AUTH_SECRET_KEY:
            raise ValueError("AUTH_SECRET_KEY environment variable is required in production. Must not be empty.")
        if not self.SQLALCHEMY_DATABASE_URI:
            raise ValueError("DATABASE_URL environment variable is required in production.")