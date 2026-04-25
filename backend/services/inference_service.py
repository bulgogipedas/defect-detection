import asyncio
import io
import json
import sys
from pathlib import Path
from typing import Any

import numpy as np
import torch
import albumentations as A
from albumentations.pytorch import ToTensorV2
from PIL import Image


def _repo_with_src() -> Path:
    """Repo root (directory containing `src/`) in dev; `/workspace` in the backend image."""
    p = Path(__file__).resolve()
    for anchor in (p.parents[2], p.parents[1], Path("/workspace")):
        if (anchor / "src" / "models").is_dir():
            if str(anchor) not in sys.path:
                sys.path.insert(0, str(anchor))
            return anchor
    raise RuntimeError("Could not locate `src/models` on PYTHONPATH or next to the backend app")


_repo_with_src()
from src.models.patchcore import PatchCore  # noqa: E402

_models: dict[str, PatchCore] = {}
_model_meta: dict[str, dict[str, Any]] = {}


def _preprocess(png_bytes: bytes, img_size: int = 224) -> torch.Tensor:
    image = np.array(Image.open(io.BytesIO(png_bytes)).convert("RGB"))
    transform = A.Compose(
        [
            A.Resize(img_size, img_size),
            A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ToTensorV2(),
        ]
    )
    return transform(image=image)["image"]


def _load_model(category: str) -> PatchCore:
    if category in _models:
        return _models[category]
    from config import get_settings

    s = get_settings()
    manifest = s.resolve_active_model_manifest()
    path = s.resolve_patchcore_path(category)
    meta: dict[str, Any] = {
        "model_mode": "patchcore",
        "model_version": "unversioned",
        "model_source": str(path),
    }
    if manifest.is_file():
        with manifest.open("r", encoding="utf-8") as f:
            active = json.load(f)
        if active.get("category") == category and active.get("artifact_path"):
            cand = Path(active["artifact_path"])
            if not cand.is_absolute():
                cand = (s.repo_root / cand).resolve()
            path = cand
            meta["model_version"] = active.get("version", "unknown")
            meta["model_source"] = str(path)

    if not path.is_file():
        raise FileNotFoundError(
            f"PatchCore weights not found at {path}. Train with: "
            f"uv run python -m src.training.train --model patchcore --category {category}"
        )
    m = PatchCore()
    m.load(str(path))
    _models[category] = m
    _model_meta[category] = meta
    return m


def _demo_predict(image_bytes: bytes) -> dict[str, Any]:
    """Fallback heuristic so the API is runnable before training a model."""
    image = np.array(Image.open(io.BytesIO(image_bytes)).convert("RGB"))
    gray = image.mean(axis=2)
    score = float(gray.std() / 64.0)
    threshold = 0.9
    return {
        "anomaly_score": score,
        "is_defect": score > threshold,
        "threshold": threshold,
        "mode": "demo",
    }


def _run_inference_sync(image_bytes: bytes, category: str) -> dict[str, Any]:
    from config import get_settings

    settings = get_settings()
    if settings.model_mode not in {"auto", "demo", "production"}:
        raise RuntimeError("MODEL_MODE must be one of: auto, demo, production")
    if settings.model_mode == "demo":
        return _demo_predict(image_bytes)

    try:
        model = _load_model(category)
    except FileNotFoundError:
        if settings.model_mode == "auto" and settings.allow_demo_inference_without_model:
            return _demo_predict(image_bytes)
        raise

    tensor = _preprocess(image_bytes)
    pred = model.predict(tensor)
    meta = _model_meta.get(category, {})
    pred["mode"] = meta.get("model_mode", "patchcore")
    pred["model_version"] = meta.get("model_version", "unversioned")
    pred["model_source"] = meta.get("model_source", "unknown")
    return pred


async def run_inference(image_bytes: bytes, category: str) -> dict[str, Any]:
    return await asyncio.to_thread(_run_inference_sync, image_bytes, category)


async def get_runtime_model_status(category: str = "bottle") -> dict[str, Any]:
    from config import get_settings

    settings = get_settings()
    manifest_path = settings.resolve_active_model_manifest()
    status: dict[str, Any] = {
        "configured_mode": settings.model_mode,
        "allow_demo_inference_without_model": settings.allow_demo_inference_without_model,
        "active_manifest_path": str(manifest_path),
        "active_manifest_exists": manifest_path.is_file(),
    }
    if manifest_path.is_file():
        with manifest_path.open("r", encoding="utf-8") as f:
            status["active_model"] = json.load(f)
    else:
        path = settings.resolve_patchcore_path(category)
        status["fallback_patchcore_path"] = str(path)
        status["fallback_patchcore_exists"] = path.is_file()
    return status
