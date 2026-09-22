"""
NETRAVA FastAPI application.

Roles:
- patient
- admin

Core modules:
- authentication
- patient profiles
- fundus screening
- reports
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app import config
from app.db import database
from app.ml import inference

from app.api import (
    auth,
    patients,
    scans,
    reports,
)


# ============================================================
# APPLICATION LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    # Initialize database tables.
    database.init_db()

    # Load the ML model once during startup.
    # inference.get_model() is cached with lru_cache.
    inference.get_model()

    yield


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="NETRAVA — Diabetic Retinopathy Screening",
    version=getattr(
        config,
        "APP_VERSION",
        "1.0.0",
    ),
    lifespan=lifespan,
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# RATE LIMITING
# ============================================================

app.state.limiter = config.limiter

app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(
    auth.router
)

app.include_router(
    patients.router
)

app.include_router(
    scans.router
)

app.include_router(
    reports.router
)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get(
    "/",
    tags=["System"],
)
def root():

    return {
        "name": "NETRAVA",
        "status": "running",
        "version": getattr(
            config,
            "APP_VERSION",
            "1.0.0",
        ),
    }