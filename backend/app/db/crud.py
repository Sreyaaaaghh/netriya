"""
CRUD functions for scans and model metrics.
"""

from app.db.models import (
    ModelMetrics,
    Scan,
)


# ============================================================
# SCANS
# ============================================================

def create_scan(
    db,
    *,
    scan_id: str,
    patient_id: str,
    uploaded_by: str,
    image_path: str,
    gradcam_path=None,
    prediction: str,
    confidence: float,
    uncertainty=None,
    model_version=None,
    inference_ms=None,
):
    """
    Insert one screening scan.
    """

    scan = Scan(
        id=scan_id,
        patient_id=patient_id,
        uploaded_by=uploaded_by,
        image_path=image_path,
        gradcam_path=gradcam_path,
        prediction=prediction,
        confidence=confidence,
        uncertainty=uncertainty,
        model_version=model_version,
        inference_ms=inference_ms,
    )

    db.add(scan)
    db.commit()
    db.refresh(scan)

    return scan


def get_scan(
    db,
    scan_id: str,
):
    """
    Return a scan by ID.
    """

    return db.get(
        Scan,
        scan_id,
    )


def list_scans(
    db,
    limit: int = 20,
):
    """
    Return newest scans first.
    """

    return (
        db.query(Scan)
        .order_by(
            Scan.created_at.desc()
        )
        .limit(limit)
        .all()
    )


# ============================================================
# MODEL METRICS
# ============================================================

def record_metrics(
    db,
    *,
    model_type: str,
    accuracy,
    precision,
    recall,
    f1,
    auc_roc,
    test_set_size,
):
    """
    Persist one model evaluation result.
    """

    metric = ModelMetrics(
        model_type=model_type,
        accuracy=accuracy,
        precision_score=precision,
        recall=recall,
        f1_score=f1,
        auc_roc=auc_roc,
        test_set_size=test_set_size,
    )

    db.add(metric)
    db.commit()
    db.refresh(metric)

    return metric


def get_latest_metrics(
    db,
) -> dict:
    """
    Return the latest metrics for each
    supported model type.
    """

    latest = {}

    for model_type in (
        "classical",
        "hybrid_quantum",
    ):

        latest[model_type] = (
            db.query(ModelMetrics)
            .filter(
                ModelMetrics.model_type
                == model_type
            )
            .order_by(
                ModelMetrics.evaluated_at.desc()
            )
            .first()
        )

    return latest