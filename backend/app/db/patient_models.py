"""
ORM model for the patient registry.

Internal identifier:
    id -> UUID

Public identifier:
    patient_id -> DR-P-XXXXXX
"""

import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    func,
)

from app.db.models import Base


class Patient(Base):
    __tablename__ = "patients"

    # Internal database identifier
    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    # Public identifier shown to patients/admins
    # Example: DR-P-001245
    patient_id = Column(
        String(11),
        unique=True,
        nullable=False,
        index=True,
    )

    # One patient profile per user account
    user_id = Column(
        String(36),
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
        index=True,
    )

    full_name = Column(
        String(120),
        nullable=False,
    )

    gender = Column(
        String(20),
        nullable=True,
    )

    age = Column(
        Integer,
        nullable=True,
    )

    diabetes = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    diabetes_duration = Column(
        String(50),
        nullable=True,
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )