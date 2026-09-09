from app.extensions import db
from sqlalchemy import text

def test_database_is_isolated_postgresql_test_db(app):
    """
    Ensures tests are running exclusively against the PostgreSQL trackwise_test database.
    This prevents accidental data corruption of the development or production databases,
    and guarantees SQLite is not being used as a silent fallback.
    """
    current_db = db.engine.url.database
    dialect = db.engine.name

    assert current_db == "trackwise_test", \
        f"CRITICAL: Expected to connect to trackwise_test, but connected to '{current_db}'"
        
    assert dialect == "postgresql", \
        f"CRITICAL: Integration tests must run against PostgreSQL, but found '{dialect}'"

def test_database_schema_created(db_session):
    """
    Verifies that the test schema was successfully created from SQLAlchemy metadata
    and that the physical PostgreSQL database is ready to accept queries.
    """
    # Verify the database accepts basic commands
    result = db_session.execute(text("SELECT 1 AS is_alive")).scalar()
    assert result == 1
    
    # Verify that the SQLAlchemy metadata successfully generated the finance tables
    # by querying PostgreSQL's native information_schema.
    table_check = db_session.execute(
        text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'wallets');")
    ).scalar()
    
    assert table_check is True, "The 'wallets' table was not generated in the PostgreSQL test schema."