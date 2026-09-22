"""
Shared Pydantic schemas for NETRAVA.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel


# ============================================================
# SCAN RESPONSE
# ============================================================

class ScanResponse(BaseModel):
    scan_id: str
    patient_id: str
    created_at: datetime

    prediction: str
    confidence: float

    uncertainty: dict[str, Any] | None = None

    gradcam_url: str | None = None

    model_version: str
    uploaded_by: str


# ============================================================
# SCAN HISTORY
# ============================================================

class ScanListItem(BaseModel):
    scan_id: str
    patient_id: str
    created_at: datetime

    prediction: str
    confidence: float

    uncertainty: dict[str, Any] | None = None

    gradcam_url: str | None = None

    model_version: str
    uploaded_by: str


# ============================================================
# MODEL METRICS
# ============================================================

class ModelMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1: float
    auc_roc: float


class MetricsResponse(BaseModel):
    classical: ModelMetrics | None = None
    hybrid_quantum: ModelMetrics | None = None
    evaluated_on: str | None = None


# ============================================================
# HEALTH
# ============================================================

class HealthResponse(BaseModel):
    status: str