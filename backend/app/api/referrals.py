"""
Optional clinical referral workflow.

Referral creation is separate from the ML screening result.
No risk_level is used by the screening system.
"""

import uuid
from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.auth.security import require_role
from app.db.auth_models import User
from app.db import crud
from app.db.database import get_session
from app.db.referral_models import Referral
from app.data.facilities import FACILITIES
from app.reports.referral_letter import (
    build_referral_letter_pdf,
)
from app.schemas_referral import (
    FacilityResponse,
    ReferralCreate,
    ReferralResponse,
    ReferralUpdate,
)


router = APIRouter(
    prefix="/api/v1",
    tags=["Referrals"],
)


@router.get(
    "/facilities",
    response_model=list[FacilityResponse],
)
def list_facilities(
    current_user: User = Depends(
        require_role("doctor", "admin")
    ),
):
    return FACILITIES


@router.post(
    "/scans/{scan_id}/referral",
    response_model=ReferralResponse,
    status_code=201,
)
def create_referral(
    scan_id: str,
    payload: ReferralCreate,
    db: Session = Depends(get_session),
    current_user: User = Depends(
        require_role("doctor", "admin")
    ),
):

    scan = crud.get_scan(
        db,
        scan_id,
    )

    if scan is None:
        raise HTTPException(
            status_code=404,
            detail="Scan not found",
        )

    referral = Referral(
        id=str(uuid.uuid4()),
        scan_id=scan_id,
        facility_name=payload.facility_name,
        facility_contact=payload.facility_contact,
        notes=payload.notes,
        status="pending",
    )

    db.add(referral)
    db.commit()
    db.refresh(referral)

    return referral


@router.get(
    "/referrals",
    response_model=list[ReferralResponse],
)
def list_referrals(
    status: str | None = None,
    db: Session = Depends(get_session),
    current_user: User = Depends(
        require_role("doctor", "admin")
    ),
):

    query = db.query(Referral)

    if status is not None:
        query = query.filter(
            Referral.status == status
        )

    return (
        query
        .order_by(Referral.created_at.desc())
        .all()
    )


@router.get(
    "/referrals/{referral_id}",
    response_model=ReferralResponse,
)
def get_referral(
    referral_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(
        require_role("doctor", "admin")
    ),
):

    referral = (
        db.query(Referral)
        .filter(
            Referral.id == referral_id
        )
        .first()
    )

    if referral is None:
        raise HTTPException(
            status_code=404,
            detail="Referral not found",
        )

    return referral


@router.patch(
    "/referrals/{referral_id}",
    response_model=ReferralResponse,
)
def update_referral(
    referral_id: str,
    payload: ReferralUpdate,
    db: Session = Depends(get_session),
    current_user: User = Depends(
        require_role("doctor", "admin")
    ),
):

    referral = (
        db.query(Referral)
        .filter(
            Referral.id == referral_id
        )
        .first()
    )

    if referral is None:
        raise HTTPException(
            status_code=404,
            detail="Referral not found",
        )

    if payload.status is not None:
        referral.status = payload.status

    if payload.notes is not None:
        referral.notes = payload.notes

    referral.updated_at = datetime.now(
        timezone.utc
    )

    db.commit()
    db.refresh(referral)

    return referral


@router.get(
    "/referrals/{referral_id}/letter"
)
def get_referral_letter(
    referral_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(
        require_role("doctor", "admin")
    ),
):

    referral = (
        db.query(Referral)
        .filter(
            Referral.id == referral_id
        )
        .first()
    )

    if referral is None:
        raise HTTPException(
            status_code=404,
            detail="Referral not found",
        )

    scan = crud.get_scan(
        db,
        referral.scan_id,
    )

    if scan is None:
        raise HTTPException(
            status_code=404,
            detail="Scan not found",
        )

    pdf_bytes = build_referral_letter_pdf(
        scan,
        referral,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; '
                f'filename="referral_{referral_id}.pdf"'
            )
        },
    )