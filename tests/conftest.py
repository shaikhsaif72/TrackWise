import pytest
from app import create_app
from app.extensions import db
from app.config import TestingConfig

# Explicitly import the finance module to register the ORM models 
# to SQLAlchemy's metadata before generating the test schema.
import app.modules.finance 

@pytest.fixture
def app():
    """
    Creates and configures an isolated Flask application instance per test.
    Instantiating TestingConfig() ensures we fail fast if TEST_DATABASE_URL is missing.
    """
    app = create_app(config_class=TestingConfig())
    
    with app.app_context():
        # Generate the isolated PostgreSQL schema
        db.create_all()
        
        try:
            yield app
        finally:
            # Absolute test isolation: remove session and drop all tables
            db.session.remove()
            db.drop_all()

@pytest.fixture
def client(app):
    """Provides a test client for the isolated app instance."""
    return app.test_client()

@pytest.fixture
def db_session(app):
    """Provides direct access to the database session for integration tests."""
    return db.session