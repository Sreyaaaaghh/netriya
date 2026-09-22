"""
Inference adapter for NETRAVA.

API layer works with raw image bytes.
model_backend works with PIL images.
"""

import io
from functools import lru_cache

from PIL import Image

from app import config
from . import model_backend


def load_model():
    """Load the trained NETRAVA model."""

    return model_backend.load_model(
        config.MODEL_PATH
    )


@lru_cache(maxsize=1)
def get_model():
    """
    Load the model once and reuse it.
    """

    return load_model()


def run_inference(
    model,
    image_bytes: bytes,
) -> dict:
    """
    bytes -> PIL image -> real model prediction.

    Returns:
        prediction
        confidence
        probabilities
        uncertainty
        heatmap
        overlay
    """

    image = Image.open(
        io.BytesIO(image_bytes)
    )

    image.load()

    image = image.convert("RGB")

    result = model_backend.predict(
        model,
        image,
    )

    heatmap_buffer = io.BytesIO()

    result["heatmap"].save(
        heatmap_buffer,
        format="PNG",
    )

    overlay = model_backend.create_gradcam_overlay(
        image,
        result["heatmap"],
    )

    overlay_buffer = io.BytesIO()

    overlay.save(
        overlay_buffer,
        format="PNG",
    )

    return {
        "predicted_stage": result["predicted_stage"],
        "predicted_class_index": result[
            "predicted_class_index"
        ],
        "confidence": float(
            result["confidence"]
        ),
        "probabilities": result[
            "probabilities"
        ],
        "uncertainty": result[
            "uncertainty"
        ],
        "heatmap_bytes": heatmap_buffer.getvalue(),
        "overlay_bytes": overlay_buffer.getvalue(),
    }