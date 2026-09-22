"""
Patient profile and longitudinal screening history API.

Roles:
- patient -> own profile and history
- admin   -> all patients
"""

import random

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)

from sqlalchemy.orm import Session

from app.auth.security import (
    get_current_user,
    require_role,
)

from app.db.auth_models import User
from app.db.database import get_session
from app.db.models import Scan
from app.db.patient_models import Patient

from app.schemas_patient import (
    PatientCreate,
    PatientResponse,
    PatientScanSummary,
)


router = APIRouter(
    prefix="/api/v1/patients",
    tags=["Patients"],
)


# ============================================================
# HELPERS
# ============================================================

def generate_patient_id(
    db: Session,
) -> str:
    """
    Generate a unique public Patient ID.

    Format:
        DR-P-XXXXXX
    """

    while True:

        number = random.randint(
            1,
            999999,
        )

        patient_id = (
            f"DR-P-{number:06d}"
        )

        existing = (
            db.query(Patient)
            .filter(
                Patient.patient_id
                == patient_id
            )
            .first()
        )

        if existing is None:
            return patient_id


def _to_patient_response(
    patient: Patient,
) -> PatientResponse:

    return PatientResponse(
        patient_id=patient.patient_id,
        user_id=patient.user_id,
        full_name=patient.full_name,
        gender=patient.gender,
        age=patient.age,
        diabetes=patient.diabetes,
        diabetes_duration=(
            patient.diabetes_duration
        ),
        created_at=patient.created_at,
    )


def _get_patient(
    db: Session,
    patient_id: str,
) -> Patient:

    patient = (
        db.query(Patient)
        .filter(
            Patient.patient_id
            == patient_id
        )
        .first()
    )

    if patient is None:

        raise HTTPException(
            status_code=404,
            detail="Patient not found",
        )

    return patient


# ============================================================
# CREATE PATIENT PROFILE
# ============================================================

@router.post(
    "",
    response_model=PatientResponse,
    status_code=201,
)
def create_patient(
    payload: PatientCreate,
    db: Session = Depends(get_session),
    current_user: User = Depends(
        require_role("patient")
    ),
):

    existing = (
        db.query(Patient)
        .filter(
            Patient.user_id
            == current_user.id
        )
        .first()
    )

    if existing:

        raise HTTPException(
            status_code=409,
            detail="Patient profile already exists",
        )

    patient = Patient(
        user_id=current_user.id,
        patient_id=generate_patient_id(db),
        full_name=payload.full_name,
        gender=payload.gender,
        age=payload.age,
        diabetes=payload.diabetes,
        diabetes_duration=(
            payload.diabetes_duration
        ),
    )

    db.add(patient)
    db.commit()
    db.refresh(patient)

    return _to_patient_response(
        patient
    )


# ============================================================
# MY PROFILE
# ============================================================

@router.get(
    "/me",
    response_model=PatientResponse,
)
def get_my_profile(
    db: Session = Depends(get_session),
    current_user: User = Depends(
        require_role("patient")
    ),
):

    patient = (
        db.query(Patient)
        .filter(
            Patient.user_id
            == current_user.id
        )
        .first()
    )

    if patient is None:

        raise HTTPException(
            status_code=404,
            detail="Patient profile not found",
        )

    return _to_patient_response(
        patient
    )


# ============================================================
# PATIENT LIST — ADMIN ONLY
# ============================================================

@router.get(
    "",
    response_model=list[PatientResponse],
)
def list_patients(
    search: str | None = Query(
        default=None
    ),
    limit: int = Query(
        default=50,
        ge=1,
        le=200,
    ),
    db: Session = Depends(get_session),
    current_user: User = Depends(
        require_role("admin")
    ),
):

    query = db.query(Patient)

    if search:

        search_value = search.strip()

        query = query.filter(
            (
                Patient.patient_id.ilike(
                    f"%{search_value}%"
                )
            )
            |
            (
                Patient.full_name.ilike(
                    f"%{search_value}%"
                )
            )
        )

    patients = (
        query
        .order_by(
            Patient.created_at.desc()
        )
        .limit(limit)
        .all()
    )

    return [
        _to_patient_response(patient)
        for patient in patients
    ]


# ============================================================
# GET PATIENT — ADMIN ONLY
# ============================================================

@router.get(
    "/{patient_id}",
    response_model=PatientResponse,
)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(
        require_role("admin")
    ),
):

    patient = _get_patient(
        db,
        patient_id,
    )

    return _to_patient_response(
        patient
    )


# ============================================================
# PATIENT HISTORY
# ============================================================

@router.get(
    "/{patient_id}/history",
    response_model=list[PatientScanSummary],
)
def get_patient_history(
    patient_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(
        get_current_user
    ),
):

    patient = _get_patient(
        db,
        patient_id,
    )

    # Patient → own history only
    if current_user.role == "patient":

        if patient.user_id != current_user.id:

            raise HTTPException(
                status_code=403,
                detail=(
                    "You can only access "
                    "your own history"
                ),
            )

    # Admin → all patient histories
    elif current_user.role != "admin":

        raise HTTPException(
            status_code=403,
            detail="Not authorized",
        )

    scans = (
        db.query(Scan)
        .filter(
            Scan.patient_id
            == patient.id
        )
        .order_by(
            Scan.created_at.desc()
        )
        .all()
    )

    return [
        PatientScanSummary(
            scan_id=scan.id,
            created_at=scan.created_at,
            prediction=scan.prediction,
            confidence=scan.confidence,
            uncertainty=scan.uncertainty,
            gradcam_url=(
                f"/api/v1/scans/"
                f"{scan.id}/gradcam"
                if scan.gradcam_path
                else None
            ),
        )
        for scan in scans
    ]