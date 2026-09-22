"""
NETRAVA Clinical PDF Report API.

Patients can download their own reports.
Admins can download reports for any patient.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.auth.security import get_current_user
from app.db.auth_models import User
from app.db.database import get_session
from app.db import crud
from app.db.patient_models import Patient
from app.ml import storage
from app.reports.pdf_generator import build_scan_report_pdf


router = APIRouter(
    prefix="/api/v1/scans",
    tags=["Reports"],
)


@router.get("/{scan_id}/report")
def get_scan_report(
    scan_id: str,
    language: str = Query(
        default="en",
        pattern="^(en|hi)$",
    ),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------------------------
    # Get scan
    # --------------------------------------------------
    scan = crud.get_scan(
        db,
        scan_id,
    )

    if scan is None:
        raise HTTPException(
            status_code=404,
            detail="Scan not found",
        )

    # --------------------------------------------------
    # Get patient
    # --------------------------------------------------
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

    # --------------------------------------------------
    # Authorization
    # --------------------------------------------------
    if current_user.role == "patient":

        if patient.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Not authorized to access this report",
            )

    elif current_user.role != "admin":

        raise HTTPException(
            status_code=403,
            detail="Not authorized",
        )

    # --------------------------------------------------
    # Read stored files
    # --------------------------------------------------
    original_image_bytes = storage.read_upload(
        scan_id
    )

    heatmap_bytes = storage.read_heatmap(
        scan_id
    )

    overlay_bytes = storage.read_overlay(
        scan_id
    )

    # --------------------------------------------------
    # Generate PDF
    # --------------------------------------------------
    try:
        pdf_bytes = build_scan_report_pdf(
            scan=scan,
            patient=patient,
            original_image_bytes=original_image_bytes,
            heatmap_bytes=heatmap_bytes,
            overlay_bytes=overlay_bytes,
            language=language,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate report: {exc}",
        )

    # --------------------------------------------------
    # Return PDF
    # --------------------------------------------------
    filename = (
        f"NETRAVA_{patient.patient_id}_"
        f"{scan_id}_report.pdf"
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )