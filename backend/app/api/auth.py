"""
Authentication API.

Supports:
- Patient registration
- Patient/Admin login
- JWT authentication
- Current-user lookup

Roles:
- patient
- admin
"""

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from fastapi.security import OAuth2PasswordRequestForm

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import crud
from app.auth.schemas import (
    Token,
    UserCreate,
    UserResponse,
)

from app.auth.security import (
    create_access_token,
    get_current_user,
)

from app.db.auth_models import User
from app.db.database import get_session


router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
)


VALID_ROLES = {
    "patient",
    "admin",
}


def _to_user_response(
    user: User,
) -> UserResponse:

    return UserResponse(
        id=user.id,
        username=user.username,
        role=user.role,
        full_name=user.full_name,
        is_active=user.is_active,
    )


# ============================================================
# PATIENT REGISTRATION
# ============================================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: UserCreate,
    db: Session = Depends(get_session),
):
    """
    Public registration is restricted to patients.

    Admin accounts must be created separately.
    """

    if payload.role != "patient":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Only patient accounts "
                "can be registered publicly"
            ),
        )

    existing_user = (
        crud.get_user_by_username(
            db,
            payload.username,
        )
    )

    if existing_user is not None:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already registered",
        )

    try:

        user = crud.create_user(
            db,
            username=payload.username,
            password=payload.password,
            role="patient",
            full_name=payload.full_name,
        )

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already registered",
        )

    return _to_user_response(user)


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=Token,
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_session),
):
    """
    Authenticate a patient or admin and issue a JWT.
    """

    user = crud.authenticate_user(
        db,
        form_data.username,
        form_data.password,
    )

    if user is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    if user.role not in VALID_ROLES:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User role is not permitted",
        )

    access_token = create_access_token(
        data={
            "sub": user.id,
            "role": user.role,
        }
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
    )


# ============================================================
# CURRENT USER
# ============================================================

@router.get(
    "/me",
    response_model=UserResponse,
)
def read_current_user(
    current_user: User = Depends(
        get_current_user
    ),
):

    return _to_user_response(
        current_user
    )