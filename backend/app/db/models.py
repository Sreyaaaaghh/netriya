"""
SQLAlchemy ORM models for screening scans
and model evaluation metrics.
"""

import uuid

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    func,
)

from sqlalchemy.orm import declarative_base


Base = declarative_base()


class Scan(Base):
    __tablename__ = "scans"

    # Internal scan UUID
    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    # Internal Patient UUID
    patient_id = Column(
        String(36),
        ForeignKey("patients.id"),
        nullable=False,
        index=True,
    )

    # Username of the person who uploaded it
    uploaded_by = Column(
        String(120),
        nullable=False,
    )

    # Original fundus image
    image_path = Column(
        Text,
        nullable=False,
    )

    # Generated Grad-CAM
    gradcam_path = Column(
        Text,
        nullable=True,
    )

    # Final model prediction
    prediction = Column(
        String(50),
        nullable=False,
    )

    # Confidence in final prediction
    confidence = Column(
        Float,
        nullable=False,
    )

    # Conditional uncertainty.
    #
    # Example:
    # {
    #     "ambiguous": true,
    #     "alternatives": [
    #         {
    #             "stage": "moderate",
    #             "probability": 0.48
    #         },
    #         {
    #             "stage": "severe",
    #             "probability": 0.44
    #         }
    #     ]
    # }
    #
    # NULL when the prediction is not genuinely ambiguous.
    uncertainty = Column(
        JSON,
        nullable=True,
    )

    model_version = Column(
        String(100),
        nullable=True,
    )

    inference_ms = Column(
        Integer,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )


class ModelMetrics(Base):
    __tablename__ = "model_metrics"

    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    model_type = Column(
        String(50),
        nullable=False,
    )

    accuracy = Column(
        Float,
        nullable=True,
    )

    precision_score = Column(
        Float,
        nullable=True,
    )

    recall = Column(
        Float,
        nullable=True,
    )

    f1_score = Column(
        Float,
        nullable=True,
    )

    auc_roc = Column(
        Float,
        nullable=True,
    )

    test_set_size = Column(
        Integer,
        nullable=True,
    )

    evaluated_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )