"""
Human-readable explanation generator for NETRAVA.

This module only converts the model result into presentation text.
It does not perform prediction.
"""


STAGE_EXPLANATIONS = {
    "No DR": (
        "The model classified the uploaded fundus image as showing "
        "no detectable diabetic-retinopathy pattern."
    ),

    "Mild Non-Proliferative retinopathy [NPDR]": (
        "The model classified the image as mild non-proliferative "
        "diabetic retinopathy."
    ),

    "Moderate NPDR": (
        "The model classified the image as moderate "
        "non-proliferative diabetic retinopathy."
    ),

    "Severe NPDR": (
        "The model classified the image as severe "
        "non-proliferative diabetic retinopathy."
    ),

    "Proliferative Diabetic Retinopathy": (
        "The model classified the image as proliferative "
        "diabetic retinopathy."
    ),
}


def generate_explanation(
    predicted_stage: str,
    confidence: float,
    uncertainty: dict | None = None,
) -> str:
    """
    Generate a concise explanation based only on the model output.
    """

    base = STAGE_EXPLANATIONS.get(
        predicted_stage,
        "The model generated a diabetic-retinopathy classification.",
    )

    confidence_text = (
        f" Model confidence for this classification was "
        f"{confidence * 100:.1f}%."
    )

    if uncertainty and uncertainty.get("ambiguous"):
        alternatives = uncertainty.get(
            "alternatives",
            [],
        )

        if len(alternatives) >= 2:
            second_stage = alternatives[1]["stage"]

            uncertainty_text = (
                f" The prediction is conditionally flagged as "
                f"ambiguous because the model also assigned substantial "
                f"probability to {second_stage}."
            )

            return (
                base
                + confidence_text
                + uncertainty_text
            )

    return base + confidence_text