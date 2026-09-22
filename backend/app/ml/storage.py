"""
Disk-backed storage for NETRAVA scans, Grad-CAM heatmaps,
and Grad-CAM overlays.
"""

import os


_APP_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

_ROOT_DIR = os.path.dirname(
    _APP_DIR
)

STORAGE_ROOT = os.path.join(
    _ROOT_DIR,
    "storage",
)

UPLOADS_DIR = os.path.join(
    STORAGE_ROOT,
    "uploads",
)

HEATMAPS_DIR = os.path.join(
    STORAGE_ROOT,
    "heatmaps",
)

OVERLAYS_DIR = os.path.join(
    STORAGE_ROOT,
    "overlays",
)


os.makedirs(
    UPLOADS_DIR,
    exist_ok=True,
)

os.makedirs(
    HEATMAPS_DIR,
    exist_ok=True,
)

os.makedirs(
    OVERLAYS_DIR,
    exist_ok=True,
)


def save_upload(
    scan_id: str,
    image_bytes: bytes,
) -> str:
    """Save the original uploaded fundus image."""

    path = os.path.join(
        UPLOADS_DIR,
        scan_id,
    )

    with open(
        path,
        "wb",
    ) as f:
        f.write(image_bytes)

    return path


def read_upload(
    scan_id: str,
) -> bytes | None:
    """Read the original uploaded image."""

    path = os.path.join(
        UPLOADS_DIR,
        scan_id,
    )

    if not os.path.exists(path):
        return None

    with open(
        path,
        "rb",
    ) as f:
        return f.read()


def save_heatmap(
    scan_id: str,
    heatmap_bytes: bytes,
) -> str:
    """Save the raw Grad-CAM heatmap."""

    path = os.path.join(
        HEATMAPS_DIR,
        f"{scan_id}.png",
    )

    with open(
        path,
        "wb",
    ) as f:
        f.write(heatmap_bytes)

    return path


def read_heatmap(
    scan_id: str,
) -> bytes | None:
    """Read a saved Grad-CAM heatmap."""

    path = os.path.join(
        HEATMAPS_DIR,
        f"{scan_id}.png",
    )

    if not os.path.exists(path):
        return None

    with open(
        path,
        "rb",
    ) as f:
        return f.read()


def save_overlay(
    scan_id: str,
    overlay_bytes: bytes,
) -> str:
    """Save the Grad-CAM overlay."""

    path = os.path.join(
        OVERLAYS_DIR,
        f"{scan_id}.png",
    )

    with open(
        path,
        "wb",
    ) as f:
        f.write(overlay_bytes)

    return path


def read_overlay(
    scan_id: str,
) -> bytes | None:
    """Read a saved Grad-CAM overlay."""

    path = os.path.join(
        OVERLAYS_DIR,
        f"{scan_id}.png",
    )

    if not os.path.exists(path):
        return None

    with open(
        path,
        "rb",
    ) as f:
        return f.read()