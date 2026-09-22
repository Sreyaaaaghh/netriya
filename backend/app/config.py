"""
app/config.py

Central application configuration.

Responsibilities:
- Database configuration
- ML/model configuration
- CORS configuration
- JWT authentication configuration
- API rate limiting configuration

Sensitive values should be supplied through environment variables.
"""

import os

from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address


# ---------------------------------------------------------------------------
# LOAD ENVIRONMENT VARIABLES
# ---------------------------------------------------------------------------

# Loads variables from backend/.env
load_dotenv()


# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------

def _split_origins(raw: str) -> list[str]:
    """Convert comma-separated CORS origins into a clean list."""
    return [
        origin.strip()
        for origin in raw.split(",")
        if origin.strip()
    ]


# ---------------------------------------------------------------------------
# ENVIRONMENT
# ---------------------------------------------------------------------------

ENVIRONMENT: str = os.getenv(
    "ENVIRONMENT",
    "development",
).lower()

IS_PRODUCTION: bool = ENVIRONMENT == "production"


# ---------------------------------------------------------------------------
# DATABASE
# ---------------------------------------------------------------------------

DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "sqlite:///./local_dev.db",
)


# ---------------------------------------------------------------------------
# MACHINE LEARNING
# ---------------------------------------------------------------------------

MODEL_PATH: str = os.getenv(
    "MODEL_PATH",
    "./models/dr_classifier_finetuned.keras",
)

MODEL_VERSION: str = os.getenv(
    "MODEL_VERSION",
    "dr-classifier-efficientnetb0-v1",
)

# ---------------------------------------------------------------------------
# LEGACY / MODEL CALIBRATION SETTINGS
# ---------------------------------------------------------------------------

# Kept temporarily so existing ML/inference code does not break.

RISK_THRESHOLD_MEDIUM: float = float(
    os.getenv(
        "RISK_THRESHOLD_MEDIUM",
        "0.4",
    )
)

RISK_THRESHOLD_HIGH: float = float(
    os.getenv(
        "RISK_THRESHOLD_HIGH",
        "0.7",
    )
)


# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

ALLOWED_ORIGINS: list[str] = _split_origins(
    os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
)


# ---------------------------------------------------------------------------
# JWT AUTHENTICATION
# ---------------------------------------------------------------------------

SECRET_KEY: str | None = os.getenv(
    "SECRET_KEY"
)


# Production MUST have a real secret.
if IS_PRODUCTION and not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY must be configured in production."
    )


# Development fallback only.
#
# Your .env already contains a generated SECRET_KEY,
# so this fallback should normally never be used.
if not SECRET_KEY:
    SECRET_KEY = (
        "development-only-secret-"
        "do-not-use-in-production-"
        "change-this-value"
    )


ALGORITHM: str = os.getenv(
    "ALGORITHM",
    "HS256",
)


# Short-lived JWT access tokens.
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "30",
    )
)


# ---------------------------------------------------------------------------
# UPLOAD RATE LIMITING
# ---------------------------------------------------------------------------

UPLOAD_RATE_LIMIT: str = os.getenv(
    "UPLOAD_RATE_LIMIT",
    "25/minute",
)


# ---------------------------------------------------------------------------
# GLOBAL RATE LIMITER
# ---------------------------------------------------------------------------

limiter = Limiter(
    key_func=get_remote_address,
)