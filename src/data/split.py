"""Helpers to point YOLO ``data.yaml`` at processed COCO/YOLO layouts (optional)."""

from pathlib import Path


def ensure_processed_dir(root: str | Path) -> Path:
    p = Path(root) / "processed"
    p.mkdir(parents=True, exist_ok=True)
    return p
