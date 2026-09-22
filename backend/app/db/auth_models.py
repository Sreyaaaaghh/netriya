"""
ORM model for user accounts.

Supported roles:
- patient
- admin
"""

import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    String,
    func,
)

from app.db.models import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    username = Column(
        String(120),
        unique=True,
        nullable=False,
        index=True,
    )

    hashed_password = Column(
        String(255),
        nullable=False,
    )

    role = Column(
        String(20),
        nullable=False,
        index=True,
    )

    full_name = Column(
        String(120),
        nullable=True,
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )