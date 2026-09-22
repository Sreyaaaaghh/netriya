"""
Authentication and security utilities.

Security features:
- Argon2id password hashing
- JWT access tokens
- Token expiration
- Unique token IDs
- OAuth2 Bearer authentication
- Database-backed user validation
- Role-based access control

Supported roles:
- patient
- admin
"""

from datetime import (
    datetime,
    timedelta,
    timezone,
)

from typing import Optional

from uuid import uuid4

import jwt

from fastapi import (
    Depends,
    HTTPException,
    status,
)

from fastapi.security import (
    OAuth2PasswordBearer,
)

from pwdlib import PasswordHash

from sqlalchemy.orm import Session

from app import config

from app.db.auth_models import User

from app.db.database import get_session


VALID_ROLES = {
    "patient",
    "admin",
}


# ============================================================
# PASSWORD SECURITY
# ============================================================

password_hash = PasswordHash.recommended()


def hash_password(
    password: str,
) -> str:
    """
    Securely hash a password using Argon2id.
    """

    return password_hash.hash(
        password
    )


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    """
    Verify a plain password against
    its stored hash.
    """

    try:

        return password_hash.verify(
            plain_password,
            hashed_password,
        )

    except Exception:

        return False


# ============================================================
# OAUTH2
# ============================================================

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login"
)


# ============================================================
# JWT
# ============================================================

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a signed JWT access token.

    Expected data normally contains:

        sub  -> user ID
        role -> user role

    Medical information must NEVER
    be placed inside the token.
    """

    now = datetime.now(
        timezone.utc
    )

    expire = now + (
        expires_delta
        or timedelta(
            minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    to_encode = data.copy()

    # Standard JWT claims
    to_encode["iat"] = now
    to_encode["exp"] = expire

    # Unique token identifier
    to_encode["jti"] = str(
        uuid4()
    )

    return jwt.encode(
        to_encode,
        config.SECRET_KEY,
        algorithm=config.ALGORITHM,
    )


# ============================================================
# CURRENT USER
# ============================================================

def get_current_user(
    token: str = Depends(
        oauth2_scheme
    ),
    db: Session = Depends(
        get_session
    ),
) -> User:
    """
    Validate JWT and return the
    corresponding active user.

    The user is fetched from the database
    on every request so deactivation takes
    effect immediately.
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        },
    )

    try:

        payload = jwt.decode(
            token,
            config.SECRET_KEY,
            algorithms=[
                config.ALGORITHM
            ],
            options={
                "require": [
                    "sub",
                    "exp",
                    "iat",
                    "jti",
                ]
            },
        )

        user_id = payload.get(
            "sub"
        )

        if not user_id:
            raise credentials_exception

    except jwt.ExpiredSignatureError:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "Authentication token "
                "has expired"
            ),
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    except jwt.InvalidTokenError:

        raise credentials_exception

    # Import here to avoid circular dependency.
    from app.auth.crud import (
        get_user_by_id
    )

    user = get_user_by_id(
        db,
        user_id,
    )

    if user is None:
        raise credentials_exception

    if not user.is_active:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    if user.role not in VALID_ROLES:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User role is not permitted",
        )

    return user


# ============================================================
# ROLE-BASED ACCESS CONTROL
# ============================================================

def require_role(
    *roles: str,
):
    """
    Dependency factory for role-based
    authorization.

    Examples:

        Depends(require_role("patient"))

        Depends(require_role("admin"))

        Depends(require_role("patient", "admin"))
    """

    allowed_roles = set(roles)

    invalid_roles = (
        allowed_roles - VALID_ROLES
    )

    if invalid_roles:

        raise ValueError(
            "Invalid role(s): "
            + ", ".join(
                sorted(invalid_roles)
            )
        )

    def _require_role(
        current_user: User = Depends(
            get_current_user
        ),
    ) -> User:

        if (
            current_user.role
            not in allowed_roles
        ):

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )

        return current_user

    return _require_role