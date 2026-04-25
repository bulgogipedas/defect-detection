import asyncio
import io
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
    path = s.resolve_patchcore_path(category)
    if not path.is_file():
        raise FileNotFoundError(
            f"PatchCore weights not found at {path}. Train with: "
            f"uv run python -m src.training.train --model patchcore --category {category}"
        )
    m = PatchCore()
    m.load(str(path))
    _models[category] = m
    return m


def _run_inference_sync(image_bytes: bytes, category: str) -> dict[str, Any]:
    model = _load_model(category)
    tensor = _preprocess(image_bytes)
    return model.predict(tensor)


async def run_inference(image_bytes: bytes, category: str) -> dict[str, Any]:
    return await asyncio.to_thread(_run_inference_sync, image_bytes, category)
