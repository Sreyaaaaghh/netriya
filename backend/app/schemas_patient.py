from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class PatientCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    gender: str = Field(..., min_length=1, max_length=20)
    age: int = Field(..., ge=1, le=120)
    diabetes: bool = False
    diabetes_duration: str | None = Field(default=None, max_length=50)


class PatientResponse(BaseModel):
    patient_id: str
    user_id: str
    full_name: str
    gender: str
    age: int
    diabetes: bool
    diabetes_duration: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class PatientScanSummary(BaseModel):
    scan_id: str
    created_at: datetime
    prediction: str
    confidence: float
    uncertainty: dict[str, Any] | None = None
    gradcam_url: str | None = None

    class Config:
        from_attributes = True
