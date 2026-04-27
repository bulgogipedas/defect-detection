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
from torchvision.models import ResNet18_Weights, resnet18


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
_category_index: dict[str, np.ndarray] | None = None
_category_encoder: torch.nn.Module | None = None
_category_encoder_device: torch.device | None = None


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


def _preprocess_for_category(png_bytes: bytes, img_size: int = 160) -> torch.Tensor:
    image = np.array(Image.open(io.BytesIO(png_bytes)).convert("RGB"))
    transform = A.Compose(
        [
            A.Resize(img_size, img_size),
            A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ToTensorV2(),
        ]
    )
    return transform(image=image)["image"]


def _get_category_encoder() -> tuple[torch.nn.Module, torch.device]:
    global _category_encoder, _category_encoder_device
    if _category_encoder is not None and _category_encoder_device is not None:
        return _category_encoder, _category_encoder_device

    if torch.backends.mps.is_available():
        device = torch.device("mps")
    elif torch.cuda.is_available():
        device = torch.device("cuda")
    else:
        device = torch.device("cpu")
    model = resnet18(weights=ResNet18_Weights.IMAGENET1K_V1)
    model.fc = torch.nn.Identity()
    _category_encoder = model.eval().to(device)
    _category_encoder_device = device
    return _category_encoder, _category_encoder_device


def _embed_tensor(tensor: torch.Tensor) -> np.ndarray:
    encoder, device = _get_category_encoder()
    with torch.no_grad():
        feat = encoder(tensor.unsqueeze(0).to(device))
    vec = feat.detach().cpu().numpy().reshape(-1)
    norm = float(np.linalg.norm(vec))
    if norm > 0:
        vec = vec / norm
    return vec


def _build_category_index(max_samples_per_category: int = 30) -> dict[str, np.ndarray]:
    global _category_index
    if _category_index is not None:
        return _category_index

    from config import get_settings

    s = get_settings()
    data_root = s.resolve_data_raw_root()
    index: dict[str, np.ndarray] = {}
    if not data_root.is_dir():
        _category_index = index
        return index

    for cat_dir in sorted([p for p in data_root.iterdir() if p.is_dir()]):
        good_dir = cat_dir / "train" / "good"
        if not good_dir.is_dir():
            continue
        sample_paths = sorted(good_dir.glob("*.png"))[:max_samples_per_category]
        if not sample_paths:
            continue
        feats: list[np.ndarray] = []
        for p in sample_paths:
            try:
                tensor = _preprocess_for_category(p.read_bytes())
                feats.append(_embed_tensor(tensor))
            except Exception:
                continue
        if not feats:
            continue
        centroid = np.mean(np.stack(feats, axis=0), axis=0)
        norm = float(np.linalg.norm(centroid))
        if norm > 0:
            centroid = centroid / norm
        index[cat_dir.name] = centroid

    _category_index = index
    return index


def _resolve_auto_category(image_bytes: bytes) -> str | None:
    index = _build_category_index()
    if not index:
        return None
    query = _embed_tensor(_preprocess_for_category(image_bytes))
    best_cat: str | None = None
    best_sim = -1e9
    for cat, centroid in index.items():
        sim = float(np.dot(query, centroid))
        if sim > best_sim:
            best_sim = sim
            best_cat = cat
    return best_cat


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
        pred = _demo_predict(image_bytes)
        pred["category"] = category
        return pred

    use_fast = category == "auto_fast"
    tensor = _preprocess(image_bytes, img_size=160 if use_fast else 224)

    def predict_for_category(cat: str) -> dict[str, Any]:
        model = _load_model(cat)
        pred_local = model.predict(tensor)
        meta = _model_meta.get(cat, {})
        pred_local["mode"] = meta.get("model_mode", "patchcore")
        pred_local["model_version"] = meta.get("model_version", "unversioned")
        pred_local["model_source"] = meta.get("model_source", "unknown")
        pred_local["category"] = cat
        return pred_local

    if category in {"auto", "auto_fast"}:
        resolved = _resolve_auto_category(image_bytes)
        if resolved:
            try:
                pred_auto = predict_for_category(resolved)
                pred_auto["mode"] = "auto-fast-category" if use_fast else "auto-category"
                return pred_auto
            except FileNotFoundError:
                pass
        if settings.allow_demo_inference_without_model:
            pred = _demo_predict(image_bytes)
            pred["category"] = "unknown"
            return pred
        raise FileNotFoundError("No category models available for auto detection")

    try:
        return predict_for_category(category)
    except FileNotFoundError:
        if settings.model_mode == "auto" and settings.allow_demo_inference_without_model:
            pred = _demo_predict(image_bytes)
            pred["category"] = category
            return pred
        raise


async def run_inference(image_bytes: bytes, category: str) -> dict[str, Any]:
    return await asyncio.to_thread(_run_inference_sync, image_bytes, category)


async def warm_auto_category_cache() -> None:
    await asyncio.to_thread(_build_category_index)


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
