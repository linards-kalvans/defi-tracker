import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine

sys.path.append(os.getcwd())

def test_sqlite_default():
    if "DATABASE_URL" in os.environ:
        del os.environ["DATABASE_URL"]
    
    # Reload module
    if "database" in sys.modules:
        del sys.modules["database"]
    
    import database
    print(f"Default URL: {database.engine.url}")
    assert str(database.engine.url) == "sqlite+aiosqlite:///./crypto_tracker.db"

def test_postgres_env():
    # Test standard postgres://
    os.environ["DATABASE_URL"] = "postgres://user:pass@localhost/db"
    if "database" in sys.modules:
        del sys.modules["database"]
    import database
    print(f"Postgres URL (postgres://): {database.engine.url}")
    assert database.engine.url.drivername == "postgresql+asyncpg"

    # Test postgresql://
    os.environ["DATABASE_URL"] = "postgresql://user:pass@localhost/db"
    if "database" in sys.modules:
        del sys.modules["database"]
    import database
    print(f"Postgres URL (postgresql://): {database.engine.url}")
    assert database.engine.url.drivername == "postgresql+asyncpg"

if __name__ == "__main__":
    try:
        test_sqlite_default()
        test_postgres_env()
        print("Verification successful!")
    except Exception as e:
        print(f"Verification failed: {e}")
        sys.exit(1)
