"""
User CRUD helpers.

Handles:
- User creation
- User lookup
- Password authentication

Supported roles:
- patient
- admin
"""

import uuid
from typing import Optional

from sqlalchemy.orm import Session

from app.auth.security import (
    hash_password,
    verify_password,
)

from app.db.auth_models import User


VALID_ROLES = {
    "patient",
    "admin",
}


def create_user(
    db: Session,
    *,
    username: str,
    password: str,
    role: str,
    full_name: Optional[str] = None,
) -> User:
    """
    Create a new user.

    Passwords are never stored directly.
    They are converted to a secure Argon2id hash.
    """

    if role not in VALID_ROLES:
        raise ValueError(
            "role must be one of: patient, admin"
        )

    user = User(
        id=str(uuid.uuid4()),
        username=username.strip(),
        hashed_password=hash_password(password),
        role=role,
        full_name=(
            full_name.strip()
            if full_name
            else None
        ),
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def get_user_by_username(
    db: Session,
    username: str,
) -> Optional[User]:
    """Return a user by username."""

    return (
        db.query(User)
        .filter(
            User.username == username.strip()
        )
        .first()
    )


def get_user_by_id(
    db: Session,
    user_id: str,
) -> Optional[User]:
    """Return a user by ID."""

    return (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )


def authenticate_user(
    db: Session,
    username: str,
    password: str,
) -> Optional[User]:
    """
    Authenticate a user.

    Returns:
        User if credentials are valid.
        None otherwise.
    """

    user = get_user_by_username(
        db,
        username,
    )

    if user is None:
        return None

    if not user.is_active:
        return None

    if not verify_password(
        password,
        user.hashed_password,
    ):
        return None

    if user.role not in VALID_ROLES:
        return None

    return user