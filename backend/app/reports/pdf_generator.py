"""
NETRAVA PDF report generator.

Pure function:
- Receives a Scan ORM row
- Receives patient information
- Receives optional original fundus image
- Receives optional Grad-CAM heatmap
- Receives optional Grad-CAM overlay
- Returns the completed PDF as bytes

No database or disk access occurs here.
"""

import io
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import (
    ParagraphStyle,
    getSampleStyleSheet,
)
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


# ============================================================
# CONSTANTS
# ============================================================

DISCLAIMER_TEXT = (
    "This report is an automated diabetic retinopathy screening aid "
    "and is not a clinical diagnosis. The result should be reviewed "
    "by a qualified healthcare professional."
)

MAX_IMAGE_DIM = 3.2 * inch


# ============================================================
# IMAGE HELPERS
# ============================================================

def _scaled_image_size(
    image_bytes: bytes,
) -> tuple[float, float]:
    """
    Scale an image to fit inside a square report area
    while preserving its aspect ratio.
    """

    orig_w, orig_h = ImageReader(
        io.BytesIO(image_bytes)
    ).getSize()

    if not orig_w or not orig_h:
        return (
            MAX_IMAGE_DIM,
            MAX_IMAGE_DIM,
        )

    aspect = orig_h / orig_w

    width = MAX_IMAGE_DIM
    height = MAX_IMAGE_DIM * aspect

    if height > MAX_IMAGE_DIM:
        width = MAX_IMAGE_DIM / aspect
        height = MAX_IMAGE_DIM

    return width, height


def _report_image(
    image_bytes: bytes | None,
) -> Image | None:
    """
    Convert image bytes into a ReportLab Image.
    """

    if not image_bytes:
        return None

    width, height = _scaled_image_size(
        image_bytes
    )

    return Image(
        io.BytesIO(image_bytes),
        width=width,
        height=height,
    )


# ============================================================
# UNCERTAINTY FORMATTER
# ============================================================

def _format_uncertainty(
    uncertainty: dict[str, Any] | None,
) -> str:

    if not uncertainty:
        return "No significant ambiguity detected."

    if not uncertainty.get(
        "ambiguous",
        False,
    ):
        return "No significant ambiguity detected."

    alternatives = uncertainty.get(
        "alternatives",
        [],
    )

    if len(alternatives) < 2:
        return "Ambiguous prediction detected."

    first = alternatives[0]
    second = alternatives[1]

    first_stage = first.get(
        "stage",
        "Unknown",
    )

    second_stage = second.get(
        "stage",
        "Unknown",
    )

    first_probability = float(
        first.get(
            "probability",
            0,
        )
    )

    second_probability = float(
        second.get(
            "probability",
            0,
        )
    )

    return (
        "The prediction shows some ambiguity between "
        f"{first_stage} ({first_probability:.1%}) "
        f"and {second_stage} ({second_probability:.1%})."
    )


# ============================================================
# RESULTS TABLE STYLE
# ============================================================

def _results_table_style() -> TableStyle:

    return TableStyle(
        [
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor("#0A2A6A"),
            ),
            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                colors.white,
            ),
            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold",
            ),
            (
                "FONTSIZE",
                (0, 0),
                (-1, -1),
                10,
            ),
            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                7,
            ),
            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                7,
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey,
            ),
            (
                "ROWBACKGROUNDS",
                (0, 1),
                (-1, -1),
                [
                    colors.white,
                    colors.HexColor("#F5F7FA"),
                ],
            ),
            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE",
            ),
        ]
    )


# ============================================================
# MAIN PDF GENERATOR
# ============================================================

def build_scan_report_pdf(
    scan,
    patient,
    original_image_bytes: bytes | None = None,
    heatmap_bytes: bytes | None = None,
    overlay_bytes: bytes | None = None,
    language: str = "en",
) -> bytes:
    """
    Build a complete NETRAVA screening report.

    Parameters
    ----------
    scan:
        Scan ORM row.

    patient:
        Patient ORM row.

    original_image_bytes:
        Original uploaded fundus image.

    heatmap_bytes:
        Raw Grad-CAM heatmap.

    overlay_bytes:
        Grad-CAM overlay.

    language:
        "en" or "hi".
        The report language currently controls the report labels.
    """

    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        topMargin=0.65 * inch,
        bottomMargin=0.65 * inch,
        leftMargin=0.65 * inch,
        rightMargin=0.65 * inch,
        title=(
            f"NETRAVA Screening Report — "
            f"{scan.id}"
        ),
    )

    styles = getSampleStyleSheet()

    title_style = styles["Title"]

    heading_style = styles["Heading2"]

    normal_style = styles["Normal"]

    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=normal_style,
        fontName="Helvetica-Oblique",
        fontSize=9,
        textColor=colors.HexColor("#444444"),
    )

    story = []

    # --------------------------------------------------------
    # LANGUAGE
    # --------------------------------------------------------

    is_hindi = language.lower() == "hi"

    if is_hindi:

        title = "डायबिटिक रेटिनोपैथी स्क्रीनिंग रिपोर्ट"
        patient_section = "रोगी विवरण"
        result_section = "स्क्रीनिंग परिणाम"
        images_section = "रेटिना इमेज एवं व्याख्या"
        prediction_label = "पूर्वानुमान"
        confidence_label = "विश्वास स्तर"
        uncertainty_label = "अनिश्चितता"
        patient_id_label = "रोगी आईडी"
        name_label = "नाम"
        age_label = "आयु"
        gender_label = "लिंग"
        diabetes_label = "डायबिटीज"
        date_label = "तारीख / समय"
        model_label = "मॉडल संस्करण"
        uploader_label = "अपलोड करने वाला"

    else:

        title = "Diabetic Retinopathy Screening Report"
        patient_section = "Patient Details"
        result_section = "Screening Result"
        images_section = "Retinal Image & Explainability"
        prediction_label = "Prediction"
        confidence_label = "Confidence"
        uncertainty_label = "Uncertainty"
        patient_id_label = "Patient ID"
        name_label = "Name"
        age_label = "Age"
        gender_label = "Gender"
        diabetes_label = "Diabetes"
        date_label = "Date / Time"
        model_label = "Model Version"
        uploader_label = "Uploaded By"

    # --------------------------------------------------------
    # TITLE
    # --------------------------------------------------------

    story.append(
        Paragraph(
            title,
            title_style,
        )
    )

    story.append(
        Spacer(
            1,
            14,
        )
    )

    # --------------------------------------------------------
    # PATIENT DETAILS
    # --------------------------------------------------------

    story.append(
        Paragraph(
            patient_section,
            heading_style,
        )
    )

    created_at = (
        scan.created_at.strftime(
            "%Y-%m-%d %H:%M:%S"
        )
        if scan.created_at
        else "Unknown"
    )

    patient_data = [
        [
            patient_id_label,
            str(patient.patient_id),
        ],
        [
            name_label,
            str(
                patient.full_name
                or "Not provided"
            ),
        ],
        [
            age_label,
            str(patient.age),
        ],
        [
            gender_label,
            str(patient.gender),
        ],
        [
            diabetes_label,
            "Yes" if patient.diabetes else "No",
        ],
        [
            date_label,
            created_at,
        ],
    ]

    patient_table = Table(
        patient_data,
        colWidths=[
            1.7 * inch,
            3.8 * inch,
        ],
    )

    patient_table.setStyle(
        TableStyle(
            [
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.grey,
                ),
                (
                    "BACKGROUND",
                    (0, 0),
                    (0, -1),
                    colors.HexColor(
                        "#F0F3F8"
                    ),
                ),
                (
                    "FONTNAME",
                    (0, 0),
                    (0, -1),
                    "Helvetica-Bold",
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
            ]
        )
    )

    story.append(patient_table)

    story.append(
        Spacer(
            1,
            18,
        )
    )

    # --------------------------------------------------------
    # SCREENING RESULT
    # --------------------------------------------------------

    story.append(
        Paragraph(
            result_section,
            heading_style,
        )
    )

    story.append(
        Spacer(
            1,
            5,
        )
    )

    confidence = float(
        scan.confidence or 0
    )

    result_data = [
        [
            prediction_label,
            str(scan.prediction),
        ],
        [
            confidence_label,
            f"{confidence:.1%}",
        ],
        [
            uncertainty_label,
            _format_uncertainty(
                scan.uncertainty
            ),
        ],
    ]

    result_table = Table(
        result_data,
        colWidths=[
            1.7 * inch,
            3.8 * inch,
        ],
    )

    result_table.setStyle(
        _results_table_style()
    )

    story.append(result_table)

    story.append(
        Spacer(
            1,
            18,
        )
    )

    # --------------------------------------------------------
    # ORIGINAL FUNDUS
    # --------------------------------------------------------

    if original_image_bytes:

        story.append(
            Paragraph(
                "Original Fundus Image",
                heading_style,
            )
        )

        story.append(
            Spacer(
                1,
                6,
            )
        )

        original_image = _report_image(
            original_image_bytes
        )

        if original_image:
            story.append(original_image)

        story.append(
            Spacer(
                1,
                16,
            )
        )

    # --------------------------------------------------------
    # GRAD-CAM HEATMAP
    # --------------------------------------------------------

    if heatmap_bytes:

        story.append(
            Paragraph(
                "Grad-CAM Heatmap",
                heading_style,
            )
        )

        story.append(
            Spacer(
                1,
                6,
            )
        )

        heatmap_image = _report_image(
            heatmap_bytes
        )

        if heatmap_image:
            story.append(heatmap_image)

        story.append(
            Spacer(
                1,
                16,
            )
        )

    # --------------------------------------------------------
    # GRAD-CAM OVERLAY
    # --------------------------------------------------------

    if overlay_bytes:

        story.append(
            Paragraph(
                "Grad-CAM Overlay",
                heading_style,
            )
        )

        story.append(
            Spacer(
                1,
                6,
            )
        )

        overlay_image = _report_image(
            overlay_bytes
        )

        if overlay_image:
            story.append(overlay_image)

        story.append(
            Spacer(
                1,
                16,
            )
        )

    # --------------------------------------------------------
    # MODEL INFORMATION
    # --------------------------------------------------------

    story.append(
        Paragraph(
            f"<b>{model_label}:</b> "
            f"{scan.model_version}",
            normal_style,
        )
    )

    story.append(
        Paragraph(
            f"<b>{uploader_label}:</b> "
            f"{scan.uploaded_by}",
            normal_style,
        )
    )

    story.append(
        Spacer(
            1,
            18,
        )
    )

    # --------------------------------------------------------
    # DISCLAIMER
    # --------------------------------------------------------

    disclaimer_box = Table(
        [
            [
                Paragraph(
                    DISCLAIMER_TEXT,
                    disclaimer_style,
                )
            ]
        ],
        colWidths=[
            5.5 * inch
        ],
    )

    disclaimer_box.setStyle(
        TableStyle(
            [
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.75,
                    colors.HexColor("#999999"),
                ),
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    colors.HexColor("#F0F0F0"),
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    10,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    10,
                ),
            ]
        )
    )

    story.append(disclaimer_box)

    # --------------------------------------------------------
    # BUILD
    # --------------------------------------------------------

    doc.build(story)

    return buffer.getvalue()