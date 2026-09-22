"""
Fundus screening and scan orchestration API.

Roles:
- patient -> upload/view own scans
- admin   -> upload/view scans for any patient
"""

import time
import uuid

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)

from fastapi.responses import Response

from sqlalchemy.orm import Session

from app.auth.security import get_current_user
from app.db.auth_models import User
from app.db.database import get_session
from app.db.patient_models import Patient
from app.db import crud

from app import config, schemas
from app.ml import inference, storage


router = APIRouter(
    prefix="/api/v1/scans",
    tags=["Screening"],
)


# ============================================================
# IMAGE VALIDATION
# ============================================================

_IMAGE_SIGNATURES = (
    b"\x89PNG\r\n\x1a\n",
    b"\xff\xd8\xff",
    b"GIF87a",
    b"GIF89a",
    b"BM",
    b"II*\x00",
    b"MM\x00*",
)


def _looks_like_image(data: bytes) -> bool:
    return any(
        data.startswith(signature)
        for signature in _IMAGE_SIGNATURES
    )


# ============================================================
# PATIENT AUTHORIZATION
# ============================================================

def _get_patient_for_user(
    db: Session,
    patient_id: str,
    current_user: User,
) -> Patient:

    patient = (
        db.query(Patient)
        .filter(
            Patient.patient_id == patient_id
        )
        .first()
    )

    if patient is None:
        raise HTTPException(
            status_code=404,
            detail="Patient not found",
        )

    # Patient can access only their own profile.
    if current_user.role == "patient":

        if patient.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail=(
                    "You can only upload "
                    "scans for yourself"
                ),
            )

    # Admin can access any patient.
    elif current_user.role == "admin":
        pass

    else:
        raise HTTPException(
            status_code=403,
            detail="Not authorized",
        )

    return patient


def _get_scan_patient(
    db: Session,
    scan,
) -> Patient:

    patient = (
        db.query(Patient)
        .filter(
            Patient.id == scan.patient_id
        )
        .first()
    )

    if patient is None:
        raise HTTPException(
            status_code=404,
            detail="Patient not found",
        )

    return patient


def _authorize_scan_access(
    patient: Patient,
    current_user: User,
):

    if current_user.role == "admin":
        return

    if current_user.role == "patient":

        if patient.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Not authorized",
            )

        return

    raise HTTPException(
        status_code=403,
        detail="Not authorized",
    )


# ============================================================
# RESPONSE CONVERSION
# ============================================================

def _to_scan_response(row):

    patient_id = getattr(
        row,
        "_public_patient_id",
        None,
    )

    if patient_id is None:
        patient_id = row.patient_id

    return schemas.ScanResponse(
        scan_id=row.id,
        patient_id=patient_id,
        created_at=row.created_at,
        prediction=row.prediction,
        confidence=row.confidence,
        uncertainty=row.uncertainty,
        gradcam_url=(
            f"/api/v1/scans/"
            f"{row.id}/gradcam"
            if row.gradcam_path
            else None
        ),
        model_version=row.model_version,
        uploaded_by=row.uploaded_by,
    )


# ============================================================
# CREATE SCREENING
# ============================================================

@router.post(
    "",
    response_model=schemas.ScanResponse,
    status_code=201,
)
async def create_scan(
    image: UploadFile = File(...),
    patient_id: str = Form(...),
    db: Session = Depends(get_session),
    current_user: User = Depends(
        get_current_user
    ),
):

    if current_user.role not in {
        "patient",
        "admin",
    }:
        raise HTTPException(
            status_code=403,
            detail="Not authorized",
        )

    # --------------------------------------------------------
    # Read uploaded image
    # --------------------------------------------------------

    image_bytes = await image.read()

    if not image_bytes:
        raise HTTPException(
            status_code=422,
            detail="Empty image uploaded",
        )

    if not _looks_like_image(
        image_bytes
    ):
        raise HTTPException(
            status_code=422,
            detail=(
                "Uploaded file is "
                "not a valid image"
            ),
        )

    # --------------------------------------------------------
    # Verify patient ownership/access
    # --------------------------------------------------------

    patient = _get_patient_for_user(
        db,
        patient_id,
        current_user,
    )

    # --------------------------------------------------------
    # Generate scan ID
    # --------------------------------------------------------

    scan_id = str(
        uuid.uuid4()
    )

    # --------------------------------------------------------
    # Run REAL ML inference
    # --------------------------------------------------------

    start = time.perf_counter()

    model = inference.get_model()

    result = inference.run_inference(
        model,
        image_bytes,
    )

    inference_ms = int(
        (
            time.perf_counter()
            - start
        )
        * 1000
    )

    # --------------------------------------------------------
    # Extract real model result
    # --------------------------------------------------------

    prediction = result[
        "predicted_stage"
    ]

    confidence = float(
        result["confidence"]
    )

    uncertainty = result.get(
        "uncertainty"
    )

    heatmap_bytes = result.get(
        "heatmap_bytes"
    )

    overlay_bytes = result.get(
        "overlay_bytes"
    )

    # --------------------------------------------------------
    # Save original image
    # --------------------------------------------------------

    image_path = storage.save_upload(
        scan_id,
        image_bytes,
    )

    # --------------------------------------------------------
    # Save Grad-CAM heatmap
    # --------------------------------------------------------

    gradcam_path = None

    if heatmap_bytes:

        gradcam_path = (
            storage.save_heatmap(
                scan_id,
                heatmap_bytes,
            )
        )

    # --------------------------------------------------------
    # Save Grad-CAM overlay
    # --------------------------------------------------------

    if overlay_bytes:

        storage.save_overlay(
            scan_id,
            overlay_bytes,
        )

    # --------------------------------------------------------
    # Save scan in database
    # --------------------------------------------------------

    row = crud.create_scan(
        db,
        scan_id=scan_id,
        patient_id=patient.id,
        uploaded_by=current_user.username,
        image_path=image_path,
        gradcam_path=gradcam_path,
        prediction=prediction,
        confidence=confidence,
        uncertainty=uncertainty,
        model_version=config.MODEL_VERSION,
        inference_ms=inference_ms,
    )

    # Store public patient ID temporarily for response.
    row._public_patient_id = (
        patient.patient_id
    )

    return _to_scan_response(
        row
    )


# ============================================================
# GET ONE SCAN
# ============================================================

@router.get(
    "/{scan_id}",
    response_model=schemas.ScanResponse,
)
def get_scan(
    scan_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(
        get_current_user
    ),
):

    row = crud.get_scan(
        db,
        scan_id,
    )

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Scan not found",
        )

    patient = _get_scan_patient(
        db,
        row,
    )

    _authorize_scan_access(
        patient,
        current_user,
    )

    row._public_patient_id = (
        patient.patient_id
    )

    return _to_scan_response(
        row
    )


# ============================================================
# ORIGINAL FUNDUS IMAGE
# ============================================================

@router.get(
    "/{scan_id}/image",
)
def get_scan_image(
    scan_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(
        get_current_user
    ),
):

    row = crud.get_scan(
        db,
        scan_id,
    )

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Scan not found",
        )

    patient = _get_scan_patient(
        db,
        row,
    )

    _authorize_scan_access(
        patient,
        current_user,
    )

    image_bytes = (
        storage.read_upload(
            scan_id
        )
    )

    if image_bytes is None:
        raise HTTPException(
            status_code=404,
            detail="Original image not found",
        )

    # Determine image type from signature.
    if image_bytes.startswith(
        b"\x89PNG"
    ):
        media_type = "image/png"

    elif image_bytes.startswith(
        b"\xff\xd8\xff"
    ):
        media_type = "image/jpeg"

    elif image_bytes.startswith(
        b"GIF"
    ):
        media_type = "image/gif"

    elif image_bytes.startswith(
        b"BM"
    ):
        media_type = "image/bmp"

    else:
        media_type = "application/octet-stream"

    return Response(
        content=image_bytes,
        media_type=media_type,
    )


# ============================================================
# GRAD-CAM HEATMAP
# ============================================================

@router.get(
    "/{scan_id}/gradcam",
)
def get_gradcam(
    scan_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(
        get_current_user
    ),
):

    row = crud.get_scan(
        db,
        scan_id,
    )

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Scan not found",
        )

    patient = _get_scan_patient(
        db,
        row,
    )

    _authorize_scan_access(
        patient,
        current_user,
    )

    heatmap_bytes = (
        storage.read_heatmap(
            scan_id
        )
    )

    if heatmap_bytes is None:
        raise HTTPException(
            status_code=404,
            detail="Grad-CAM not found",
        )

    return Response(
        content=heatmap_bytes,
        media_type="image/png",
    )


# ============================================================
# GRAD-CAM OVERLAY
# ============================================================

@router.get(
    "/{scan_id}/gradcam-overlay",
)
def get_gradcam_overlay(
    scan_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(
        get_current_user
    ),
):

    row = crud.get_scan(
        db,
        scan_id,
    )

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Scan not found",
        )

    patient = _get_scan_patient(
        db,
        row,
    )

    _authorize_scan_access(
        patient,
        current_user,
    )

    overlay_bytes = (
        storage.read_overlay(
            scan_id
        )
    )

    if overlay_bytes is None:
        raise HTTPException(
            status_code=404,
            detail="Grad-CAM overlay not found",
        )

    return Response(
        content=overlay_bytes,
        media_type="image/png",
    )