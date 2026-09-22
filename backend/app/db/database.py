"""
Database engine and session setup.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import config

from app.db.models import Base


DATABASE_URL = config.DATABASE_URL


connect_args = (
    {
        "check_same_thread": False
    }
    if DATABASE_URL.startswith("sqlite")
    else {}
)


engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def init_db():
    """
    Import all ORM models before creating tables.
    """

    # These imports intentionally happen here
    # so every model registers with the same Base.
    from app.db import auth_models
    from app.db import patient_models

    # Optional referral model.
    try:
        from app.db import referral_models
    except ImportError:
        referral_models = None

    Base.metadata.create_all(
        bind=engine
    )


def get_session():
    """
    FastAPI dependency that provides
    one SQLAlchemy session per request.
    """

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()