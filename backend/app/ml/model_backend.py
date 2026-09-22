"""
NETRAVA ML model backend.

Current model:
    Input (224x224x3)
        ↓
    EfficientNetB0
        ↓
    GlobalAveragePooling2D
        ↓
    Feature Bottleneck (256)
        ↓
    Classifier Head
        ↓
    5 DR classes

This file performs:
    - model loading
    - image preprocessing
    - 5-class prediction
    - confidence calculation
    - conditional ambiguity detection
    - Grad-CAM generation
    - Grad-CAM overlay generation
"""

from __future__ import annotations

import numpy as np
import tensorflow as tf

from PIL import Image


# ============================================================
# CONFIGURATION
# ============================================================

IMG_SIZE = 224

CLASS_NAMES = [
    "No DR",
    "Mild Non-Proliferative retinopathy [NPDR]",
    "Moderate NPDR",
    "Severe NPDR",
    "Proliferative Diabetic Retinopathy",
]

# Conditional ambiguity thresholds
AMBIGUITY_GAP_THRESHOLD = 0.10
AMBIGUITY_ENTROPY_THRESHOLD = 0.50


# ============================================================
# MODEL LOADING
# ============================================================

def load_model(checkpoint_path: str = None):
    """
    Load the trained Keras diabetic-retinopathy model.
    """

    if not checkpoint_path:
        raise ValueError(
            "MODEL_PATH is not configured."
        )

    model = tf.keras.models.load_model(
        checkpoint_path,
        compile=False,
    )

    return model


# ============================================================
# IMAGE PREPROCESSING
# ============================================================

def preprocess_image(
    image: Image.Image,
) -> tf.Tensor:
    """
    Convert PIL image into the format expected by
    the trained EfficientNetB0 model.
    """

    image = image.convert("RGB")

    image = image.resize(
        (IMG_SIZE, IMG_SIZE),
        Image.Resampling.BILINEAR,
    )

    image_array = np.asarray(
        image,
        dtype=np.float32,
    )

    # Same EfficientNet preprocessing used by
    # the standalone model test.
    image_array = (
        tf.keras.applications.efficientnet.preprocess_input(
            image_array
        )
    )

    image_array = np.expand_dims(
        image_array,
        axis=0,
    )

    return tf.convert_to_tensor(
        image_array,
        dtype=tf.float32,
    )


# ============================================================
# FIND EFFICIENTNET BACKBONE
# ============================================================

def get_efficientnet_backbone(model):
    """
    Retrieve the nested EfficientNetB0 backbone.
    """

    try:
        return model.get_layer(
            "efficientnetb0"
        )

    except ValueError as exc:

        raise ValueError(
            "The loaded model does not contain "
            "an 'efficientnetb0' layer."
        ) from exc


# ============================================================
# FIND LAST CONVOLUTIONAL LAYER
# ============================================================

def find_last_conv_layer(backbone):
    """
    Find the final convolutional layer inside
    EfficientNetB0.

    The current model uses 'top_conv', but this
    function also supports a generic fallback.
    """

    # Current known layer.
    try:

        return backbone.get_layer(
            "top_conv"
        )

    except ValueError:
        pass

    # Generic fallback.
    for layer in reversed(
        backbone.layers
    ):

        if isinstance(
            layer,
            (
                tf.keras.layers.Conv2D,
                tf.keras.layers.SeparableConv2D,
                tf.keras.layers.DepthwiseConv2D,
            ),
        ):

            return layer

    raise ValueError(
        "Could not find a convolutional layer "
        "inside EfficientNetB0 for Grad-CAM."
    )


# ============================================================
# GRAD-CAM
# ============================================================
def make_gradcam_heatmap(model, image_tensor, pred_index):
    """
    Generate a class-specific Grad-CAM using the final
    higher-resolution EfficientNet feature representation.

    Target layer:
        block5c_project_bn -> 14x14x112

    The 14x14 representation provides better spatial
    localization than the final 7x7 representation.
    """

    backbone = model.get_layer(
        "efficientnetb0"
    )

    # ---------------------------------------------------------
    # Use the last 14x14 feature representation.
    # ---------------------------------------------------------

    target_layer = backbone.get_layer(
        "block5c_project_bn"
    )

    # ---------------------------------------------------------
    # Build a gradient model.
    #
    # Both target activations and backbone output are obtained
    # from the SAME forward pass so TensorFlow preserves the
    # gradient connection.
    # ---------------------------------------------------------

    grad_model = tf.keras.Model(
        inputs=backbone.input,
        outputs=[
            target_layer.output,
            backbone.output,
        ],
    )

    # ---------------------------------------------------------
    # Forward pass + class-specific gradients
    # ---------------------------------------------------------

    with tf.GradientTape() as tape:

        conv_outputs, backbone_features = grad_model(
            image_tensor,
            training=False,
        )

        # Recreate the exact classifier head.
        x = model.get_layer(
            "global_average_pooling2d"
        )(
            backbone_features
        )

        x = model.get_layer(
            "dropout"
        )(
            x,
            training=False,
        )

        x = model.get_layer(
            "feature_bottleneck"
        )(
            x
        )

        x = model.get_layer(
            "dropout_1"
        )(
            x,
            training=False,
        )

        predictions = model.get_layer(
            "classifier_head"
        )(
            x
        )

        class_score = predictions[
            :,
            pred_index,
        ]

    # ---------------------------------------------------------
    # Calculate gradients
    # ---------------------------------------------------------

    gradients = tape.gradient(
        class_score,
        conv_outputs,
    )

    if gradients is None:
        raise RuntimeError(
            "Could not calculate Grad-CAM gradients."
        )

    # ---------------------------------------------------------
    # Grad-CAM channel weights
    # ---------------------------------------------------------

    weights = tf.reduce_mean(
        gradients,
        axis=(1, 2),
        keepdims=True,
    )

    # ---------------------------------------------------------
    # Weighted activation map
    # ---------------------------------------------------------

    cam = tf.reduce_sum(
        weights * conv_outputs,
        axis=-1,
    )

    # Keep only positive class-supporting activations.
    cam = tf.nn.relu(
        cam
    )

    cam = cam[0]

    # ---------------------------------------------------------
    # Initial normalization
    # ---------------------------------------------------------

    cam_min = tf.reduce_min(
        cam
    )

    cam_max = tf.reduce_max(
        cam
    )

    denominator = (
        cam_max - cam_min
    )

    if float(
        denominator.numpy()
    ) <= 1e-8:

        raise RuntimeError(
            "Grad-CAM produced an empty activation map."
        )

    cam = (
        cam - cam_min
    ) / denominator

    # ---------------------------------------------------------
    # Resize 14x14 -> 224x224
    #
    # Bicubic interpolation gives a smoother visualization
    # than direct bilinear upsampling.
    # ---------------------------------------------------------

    cam = tf.image.resize(
        cam[..., tf.newaxis],
        (
            IMG_SIZE,
            IMG_SIZE,
        ),
        method="bicubic",
    )

    cam = tf.squeeze(
        cam,
        axis=-1,
    )

    cam = np.clip(
        cam.numpy(),
        0.0,
        1.0,
    )

    # ---------------------------------------------------------
    # Smooth the upsampled activation.
    # ---------------------------------------------------------

    import cv2

    cam = cv2.GaussianBlur(
        cam,
        (0, 0),
        sigmaX=5,
        sigmaY=5,
    )

    # ---------------------------------------------------------
    # Retinal-field mask.
    #
    # This suppresses activations in the black area outside
    # the circular fundus image.
    # ---------------------------------------------------------

    h, w = cam.shape

    yy, xx = np.ogrid[
        :h,
        :w,
    ]

    center_x = w / 2.0
    center_y = h / 2.0

    radius = min(
        h,
        w,
    ) * 0.47

    retina_mask = (
        (xx - center_x) ** 2
        +
        (yy - center_y) ** 2
        <=
        radius ** 2
    )

    cam *= retina_mask.astype(
        np.float32
    )

    # ---------------------------------------------------------
    # Suppress only weak activation.
    #
    # This removes background noise without creating
    # artificial hotspots.
    # ---------------------------------------------------------

    positive = cam[
        cam > 0
    ]

    if positive.size > 0:

        threshold = np.percentile(
            positive,
            60,
        )

        cam = np.where(
            cam >= threshold,
            cam,
            0.0,
        )

    # ---------------------------------------------------------
    # Final normalization.
    # ---------------------------------------------------------

    max_value = cam.max()

    if max_value > 0:

        cam = (
            cam / max_value
        )

    # ---------------------------------------------------------
    # Convert to PIL grayscale heatmap.
    # ---------------------------------------------------------

    heatmap_uint8 = (
        cam * 255.0
    ).astype(
        np.uint8
    )

    return Image.fromarray(
        heatmap_uint8,
        mode="L",
    )

# ============================================================
# GRAD-CAM OVERLAY
# ============================================================

def create_gradcam_overlay(
    original_image: Image.Image,
    heatmap: Image.Image,
) -> Image.Image:
    """
    Create a localized Grad-CAM overlay.

    Weak activations are kept close to the original fundus
    instead of coloring the entire image.
    """

    import cv2

    original_image = (
        original_image.convert(
            "RGB"
        )
    )

    original_array = np.asarray(
        original_image,
        dtype=np.uint8,
    )

    # ---------------------------------------------------------
    # Resize heatmap to original image size.
    # ---------------------------------------------------------

    heatmap_array = np.asarray(
        heatmap.resize(
            original_image.size,
            Image.Resampling.BICUBIC,
        ),
        dtype=np.uint8,
    )

    if heatmap_array.ndim == 3:

        heatmap_array = (
            heatmap_array[..., 0]
        )

    # ---------------------------------------------------------
    # Normalize heatmap.
    # ---------------------------------------------------------

    heatmap_float = (
        heatmap_array.astype(
            np.float32
        ) / 255.0
    )

    # ---------------------------------------------------------
    # Suppress weak activation.
    #
    # Activation below 0.25 remains essentially transparent.
    # Strong activation gradually reaches the overlay alpha.
    # ---------------------------------------------------------

    activation_mask = np.clip(
        (
            heatmap_float - 0.25
        ) / 0.50,
        0.0,
        1.0,
    )

    # Smooth alpha so there are no hard block boundaries.
    activation_mask = cv2.GaussianBlur(
        activation_mask,
        (0, 0),
        sigmaX=3,
        sigmaY=3,
    )

    # ---------------------------------------------------------
    # Create retinal-field mask.
    #
    # This prevents the colored overlay from appearing in the
    # black region outside the fundus.
    # ---------------------------------------------------------

    h, w = heatmap_float.shape

    yy, xx = np.ogrid[
        :h,
        :w,
    ]

    center_x = w / 2.0
    center_y = h / 2.0

    radius = min(
        h,
        w,
    ) * 0.47

    retina_mask = (
        (xx - center_x) ** 2
        +
        (yy - center_y) ** 2
        <=
        radius ** 2
    )

    activation_mask *= retina_mask.astype(
        np.float32
    )

    # ---------------------------------------------------------
    # Convert heatmap to color.
    # ---------------------------------------------------------

    colored_heatmap = cv2.applyColorMap(
        heatmap_array,
        cv2.COLORMAP_JET,
    )

    colored_heatmap = cv2.cvtColor(
        colored_heatmap,
        cv2.COLOR_BGR2RGB,
    )

    colored_heatmap = (
        colored_heatmap.astype(
            np.float32
        )
    )

    original_float = (
        original_array.astype(
            np.float32
        )
    )

    # ---------------------------------------------------------
    # Adaptive transparency.
    # ---------------------------------------------------------

    alpha = (
        activation_mask[
            ...,
            np.newaxis,
        ]
        * 0.65
    )

    overlay = (
        original_float
        * (1.0 - alpha)
        +
        colored_heatmap
        * alpha
    )

    overlay = np.clip(
        overlay,
        0,
        255,
    ).astype(
        np.uint8
    )

    return Image.fromarray(
        overlay
    )

# ============================================================
# PREDICTION
# ============================================================

def predict(
    model,
    image: Image.Image,
) -> dict:
    """
    Run the real 5-class diabetic-retinopathy model.

    Returns:

        predicted_stage
        predicted_class_index
        confidence
        probabilities
        uncertainty
        heatmap
    """

    # --------------------------------------------------------
    # PREPROCESS IMAGE
    # --------------------------------------------------------

    input_tensor = preprocess_image(
        image
    )

    # --------------------------------------------------------
    # REAL MODEL PREDICTION
    # --------------------------------------------------------

    predictions = model.predict(
        input_tensor,
        verbose=0,
    )[0]

    probabilities = np.asarray(
        predictions,
        dtype=np.float32,
    )

    # --------------------------------------------------------
    # Normalize probabilities defensively
    # --------------------------------------------------------

    probability_sum = float(
        np.sum(
            probabilities
        )
    )

    if probability_sum > 0:

        probabilities = (
            probabilities
            / probability_sum
        )

    # --------------------------------------------------------
    # Top two predictions
    # --------------------------------------------------------

    sorted_indices = np.argsort(
        probabilities
    )[::-1]

    top_index = int(
        sorted_indices[0]
    )

    second_index = int(
        sorted_indices[1]
    )

    top_probability = float(
        probabilities[
            top_index
        ]
    )

    second_probability = float(
        probabilities[
            second_index
        ]
    )

    # --------------------------------------------------------
    # Probability gap
    # --------------------------------------------------------

    probability_gap = (
        top_probability
        - second_probability
    )

    # --------------------------------------------------------
    # Entropy-based ambiguity
    # --------------------------------------------------------

    entropy = float(
        -np.sum(
            probabilities
            * np.log(
                probabilities
                + 1e-8
            )
        )
    )

    max_entropy = float(
        np.log(
            len(
                CLASS_NAMES
            )
        )
    )

    normalized_entropy = (
        entropy / max_entropy
        if max_entropy > 0
        else 0.0
    )

    # --------------------------------------------------------
    # CONDITIONAL UNCERTAINTY
    #
    # Only create uncertainty when the model actually
    # shows ambiguity between predictions.
    # --------------------------------------------------------

    ambiguous = (
        probability_gap
        <= AMBIGUITY_GAP_THRESHOLD
        or normalized_entropy
        > AMBIGUITY_ENTROPY_THRESHOLD
    )

    uncertainty = None

    if ambiguous:

        uncertainty = {
            "ambiguous": True,

            "alternatives": [

                {
                    "stage": CLASS_NAMES[
                        top_index
                    ],

                    "probability": round(
                        top_probability,
                        4,
                    ),
                },

                {
                    "stage": CLASS_NAMES[
                        second_index
                    ],

                    "probability": round(
                        second_probability,
                        4,
                    ),
                },

            ],

            "probability_gap": round(
                probability_gap,
                4,
            ),

            "normalized_entropy": round(
                normalized_entropy,
                4,
            ),
        }

    # --------------------------------------------------------
    # REAL GRAD-CAM
    # --------------------------------------------------------

    heatmap = make_gradcam_heatmap(
        model,
        input_tensor,
        top_index,
    )

    # --------------------------------------------------------
    # RESULT
    # --------------------------------------------------------

    return {

        "predicted_stage": CLASS_NAMES[
            top_index
        ],

        "predicted_class_index": top_index,

        "confidence": round(
            top_probability,
            4,
        ),

        "probabilities": {

            CLASS_NAMES[i]: round(
                float(
                    probabilities[i]
                ),
                4,
            )

            for i in range(
                len(
                    CLASS_NAMES
                )
            )
        },

        "uncertainty": uncertainty,

        "heatmap": heatmap,
    }