"""
Pydantic schemas for authentication.

These schemas deliberately never expose password hashes.

Supported roles:
- patient
- admin
"""

from typing import Optional

from pydantic import (
    BaseModel,
    Field,
    field_validator,
)


VALID_ROLES = {
    "patient",
    "admin",
}


class UserCreate(BaseModel):

    username: str = Field(
        ...,
        min_length=3,
        max_length=120,
    )

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
    )

    role: str = Field(
        ...,
        min_length=1,
        max_length=20,
    )

    full_name: Optional[str] = Field(
        default=None,
        max_length=120,
    )

    @field_validator("username")
    @classmethod
    def validate_username(
        cls,
        value: str,
    ) -> str:

        value = value.strip()

        if not value:
            raise ValueError(
                "Username cannot be empty"
            )

        return value

    @field_validator("role")
    @classmethod
    def validate_role(
        cls,
        value: str,
    ) -> str:

        value = value.strip().lower()

        if value not in VALID_ROLES:
            raise ValueError(
                "role must be one of: patient, admin"
            )

        return value

    @field_validator("full_name")
    @classmethod
    def validate_full_name(
        cls,
        value: Optional[str],
    ) -> Optional[str]:

        if value is None:
            return None

        value = value.strip()

        return value if value else None


class UserResponse(BaseModel):

    id: str
    username: str
    role: str
    full_name: Optional[str] = None
    is_active: bool


class Token(BaseModel):

    access_token: str
    token_type: str = "bearer"