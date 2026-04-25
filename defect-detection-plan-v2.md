# 🔍 Defect Detection Portfolio — Project Plan

**Stack**: PyTorch · YOLOv8 · FastAPI · TanStack · MLflow · Podman  
**Package managers**: `uv` (Python) · `bun` (JavaScript)  
**Hardware**: MacBook M1 Air (8GB RAM, MPS backend)  
**Dataset**: MVTec AD  
**Estimasi total**: 6–8 minggu paruh waktu

---

## Daftar Isi

1. [Overview Arsitektur](#1-overview-arsitektur)
2. [Struktur Repo](#2-struktur-repo)
3. [Phase 1 — Setup & Data](#phase-1--setup--data-ingestion-minggu-1)
4. [Phase 2 — Modeling](#phase-2--modeling-minggu-23)
5. [Phase 3 — Backend API](#phase-3--backend-api-minggu-4)
6. [Phase 4 — Frontend TanStack](#phase-4--frontend-tanstack-minggu-56)
7. [Phase 5 — Containerization](#phase-5--containerization-podman-minggu-7)
8. [Phase 6 — Polish & Deploy](#phase-6--polish--deploy-minggu-8)
9. [Tech Stack Summary](#tech-stack-summary)
10. [Tips M1 Air](#tips-m1-air)

---

## 1. Overview Arsitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                        Podman Pod                               │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │   MinIO      │    │  FastAPI     │    │  React + TanStack│  │
│  │  (storage)   │───▶│  (backend)   │◀───│  (frontend)      │  │
│  └──────────────┘    └──────┬───────┘    └──────────────────┘  │
│                             │                                   │
│  ┌──────────────┐    ┌──────▼───────┐                          │
│  │   MLflow     │◀───│  YOLOv8 /   │                          │
│  │  (tracking)  │    │  PatchCore   │                          │
│  └──────────────┘    └──────┬───────┘                          │
│                             │                                   │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │              SQLite / PostgreSQL (results DB)            │   │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Data flow:**
1. User upload gambar via React frontend
2. Frontend kirim POST ke FastAPI
3. FastAPI simpan gambar ke MinIO, jalankan inference YOLOv8/PatchCore
4. Hasil deteksi disimpan ke DB dan dikembalikan ke frontend
5. TanStack Query handle caching, TanStack Table untuk history

---

## 2. Struktur Repo

```
defect-detection/
├── README.md
├── .gitignore
├── .env.example
│
├── data/
│   ├── raw/                    # MVTec AD (di .gitignore)
│   │   ├── bottle/
│   │   ├── cable/
│   │   └── ...
│   └── processed/
│
├── notebooks/
│   ├── 01_eda.ipynb
│   ├── 02_preprocessing.ipynb
│   └── 03_model_eval.ipynb
│
├── src/                        # Python source (dikelola uv)
│   ├── data/
│   │   ├── __init__.py
│   │   ├── dataset.py
│   │   ├── transforms.py
│   │   └── split.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── yolov8_trainer.py
│   │   ├── patchcore.py
│   │   └── base.py
│   ├── training/
│   │   ├── train.py
│   │   ├── evaluate.py
│   │   └── config.yaml
│   └── utils/
│       ├── visualize.py
│       ├── storage.py
│       └── logger.py
│
├── backend/                    # FastAPI (dikelola uv)
│   ├── Containerfile
│   ├── pyproject.toml          # uv project manifest
│   ├── uv.lock
│   ├── main.py
│   ├── routers/
│   │   ├── inference.py
│   │   ├── results.py
│   │   └── health.py
│   ├── schemas/
│   │   ├── request.py
│   │   └── response.py
│   ├── services/
│   │   ├── inference_service.py
│   │   ├── storage_service.py
│   │   └── db_service.py
│   └── db/
│       ├── models.py
│       └── migrations/
│
├── frontend/                   # React + TanStack (dikelola bun)
│   ├── Containerfile
│   ├── package.json            # bun-managed
│   ├── bun.lockb               # bun lockfile (binary)
│   ├── vite.config.ts
│   ├── src/
│   │   ├── main.tsx
│   │   ├── routes/
│   │   │   ├── __root.tsx
│   │   │   ├── index.tsx
│   │   │   ├── history.tsx
│   │   │   └── analytics.tsx
│   │   ├── components/
│   │   │   ├── ImageUploader.tsx
│   │   │   ├── DetectionResult.tsx
│   │   │   ├── DefectTable.tsx
│   │   │   └── StatsCard.tsx
│   │   ├── queries/
│   │   │   ├── useInference.ts
│   │   │   └── useResults.ts
│   │   └── types/
│   │       └── api.ts
│   └── public/
│
├── mlflow/
│   └── mlruns/
│
├── podman/
│   ├── pod.yaml
│   └── compose.yaml
│
└── scripts/
    ├── download_mvtec.sh
    ├── train.sh
    └── dev.sh
```

---

## Phase 1 — Setup & Data Ingestion (Minggu 1)

### 1.1 Tool Installation

```bash
# Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install Bun (JS runtime + package manager)
curl -fsSL https://bun.sh/install | bash

# Install Podman
brew install podman
podman machine init --cpus 4 --memory 4096 --disk-size 40
podman machine start
```

### 1.2 Python Project Setup dengan uv

```bash
# Inisialisasi project Python (dari root repo)
uv init .
uv python pin 3.11   # Pin versi Python

# Install semua dependencies sekaligus
uv add torch torchvision --index-url https://download.pytorch.org/whl/cpu
uv add ultralytics albumentations mlflow minio sqlalchemy
uv add fastapi uvicorn[standard] python-multipart pydantic
uv add scikit-learn numpy pillow pyyaml

# Dev dependencies
uv add --dev pytest ruff mypy jupyter ipykernel

# Verify MPS
uv run python -c "import torch; print('MPS:', torch.backends.mps.is_available())"
# Output: MPS: True ✅
```

`uv` akan auto-generate `pyproject.toml` dan `uv.lock`. Tidak perlu `requirements.txt` lagi — tapi kalau Containerfile butuh pip-compatible list, bisa generate dengan:

```bash
uv export --format requirements-txt > requirements.txt
```

### 1.3 Backend Project Setup dengan uv

```bash
cd backend

# Inisialisasi sebagai uv project terpisah
uv init --package
uv python pin 3.11

# Dependencies backend
uv add fastapi uvicorn[standard] pydantic sqlalchemy aiosqlite
uv add python-multipart minio pillow torch torchvision
uv add ultralytics scikit-learn numpy

uv add --dev pytest httpx ruff
```

### 1.4 Frontend Setup dengan Bun

```bash
cd frontend

# Scaffold React + TypeScript via Vite, pakai bun
bun create vite . --template react-ts

# Install TanStack stack
bun add @tanstack/react-router @tanstack/react-query @tanstack/react-table
bun add @tanstack/router-devtools @tanstack/react-query-devtools

# Utilities
bun add axios react-dropzone recharts
bun add tailwindcss @tailwindcss/vite

# Dev deps
bun add -d @types/react @types/react-dom typescript vite

# Verify
bun run dev   # Starts dev server via Bun (jauh lebih cepat dari Node)
```

> **Kenapa Bun lebih kencang:**
> - Install dependencies ~10–20x lebih cepat dari npm/pnpm
> - `bun run dev` startup Vite lebih cepat karena Bun menggantikan Node.js runtime
> - Lockfile binary (`bun.lockb`) — lebih kecil dan tidak perlu di-parse sebagai teks

### 1.5 Download MVTec AD Dataset

```bash
# scripts/download_mvtec.sh
#!/bin/bash
set -e
mkdir -p data/raw
cd data/raw

echo "📦 Download MVTec AD dari website resmi..."
echo "URL: https://www.mvtec.com/company/research/datasets/mvtec-ad"
echo "Setelah download manual, jalankan:"
echo "  tar -xJf mvtec_anomaly_detection.tar.xz"

# Jika sudah ada filenya:
if [ -f "mvtec_anomaly_detection.tar.xz" ]; then
  tar -xJf mvtec_anomaly_detection.tar.xz
  echo "✅ Dataset extracted. Categories:"
  ls -1d */ | head -10
fi
```

### 1.6 Dataset Class (PyTorch)

```python
# src/data/dataset.py
import torch
from torch.utils.data import Dataset
from pathlib import Path
from PIL import Image
import albumentations as A
from albumentations.pytorch import ToTensorV2
import numpy as np

class DefectDataset(Dataset):
    def __init__(self, root_dir: str, category: str,
                 split: str = "train", img_size: int = 224,
                 augment: bool = False):
        self.root = Path(root_dir) / category
        self.samples: list[tuple[Path, int]] = []

        for label_dir in (self.root / split).iterdir():
            label = 0 if label_dir.name == "good" else 1
            for img_path in label_dir.glob("*.png"):
                self.samples.append((img_path, label))

        base = [
            A.Resize(img_size, img_size),
            A.Normalize(mean=[0.485, 0.456, 0.406],
                        std=[0.229, 0.224, 0.225]),
            ToTensorV2(),
        ]
        aug_steps = [
            A.HorizontalFlip(p=0.5),
            A.Rotate(limit=15, p=0.3),
            A.GaussNoise(p=0.2),
        ] + base if augment else base

        self.transform = A.Compose(aug_steps)

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int):
        img_path, label = self.samples[idx]
        image = np.array(Image.open(img_path).convert("RGB"))
        out = self.transform(image=image)
        return out["image"], torch.tensor(label, dtype=torch.long)
```

---

## Phase 2 — Modeling (Minggu 2–3)

### 2.1 Pilihan Model untuk M1 Air

| Model | Approach | RAM Usage | Training | Rekomendasi |
|---|---|---|---|---|
| **PatchCore** | Unsupervised anomaly | ~2.5GB | ❌ Tidak perlu | ⭐ Mulai dari sini |
| **YOLOv8-nano** | Supervised detection | ~3GB | ~1–2 jam | ⭐ Model kedua |
| ResNet18 + FC | Classification | ~1GB | ~30 menit | Fallback/baseline |

### 2.2 PatchCore Implementation

```python
# src/models/patchcore.py
"""
PatchCore: no-training anomaly detection.
Kumpulkan patch features dari gambar NORMAL via WideResNet50,
bangun memory bank, lalu hitung jarak terdekat saat inference.
"""
import pickle
import numpy as np
import torch
import torch.nn as nn
from torchvision.models import wide_resnet50_2, Wide_ResNet50_2_Weights
from sklearn.neighbors import NearestNeighbors


def _get_device() -> torch.device:
    if torch.backends.mps.is_available():
        return torch.device("mps")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


class PatchCore:
    def __init__(self, device: torch.device | None = None):
        self.device = device or _get_device()
        self.backbone = self._build_backbone()
        self.memory_bank: np.ndarray | None = None
        self.knn: NearestNeighbors | None = None
        self.threshold: float = 0.0

    def _build_backbone(self) -> nn.Module:
        model = wide_resnet50_2(weights=Wide_ResNet50_2_Weights.IMAGENET1K_V1)
        model = nn.Sequential(*list(model.children())[:-2])
        return model.eval().to(self.device)

    def fit(self, normal_images: list[torch.Tensor],
            threshold_percentile: int = 95) -> None:
        features = []
        with torch.no_grad():
            for img in normal_images:
                feat = self.backbone(img.unsqueeze(0).to(self.device))
                features.append(feat.cpu().numpy().reshape(-1))

        self.memory_bank = np.array(features)
        self.knn = NearestNeighbors(
            n_neighbors=9, metric="euclidean", algorithm="ball_tree"
        )
        self.knn.fit(self.memory_bank)

        # Auto-threshold dari data normal itu sendiri
        distances, _ = self.knn.kneighbors(self.memory_bank)
        self.threshold = float(
            np.percentile(distances.mean(axis=1), threshold_percentile)
        )
        print(f"✅ PatchCore fitted. threshold={self.threshold:.4f}")

    def predict(self, image_tensor: torch.Tensor) -> dict:
        assert self.knn is not None, "Fit model dulu sebelum predict"
        with torch.no_grad():
            feat = self.backbone(image_tensor.unsqueeze(0).to(self.device))
            feat_np = feat.cpu().numpy().reshape(1, -1)

        distances, _ = self.knn.kneighbors(feat_np)
        score = float(distances.mean())

        if self.device.type == "mps":
            torch.mps.empty_cache()

        return {
            "anomaly_score": score,
            "is_defect": score > self.threshold,
            "threshold": self.threshold,
        }

    def save(self, path: str) -> None:
        with open(path, "wb") as f:
            pickle.dump({
                "memory_bank": self.memory_bank,
                "threshold": self.threshold,
            }, f)

    def load(self, path: str) -> None:
        with open(path, "rb") as f:
            data = pickle.load(f)
        self.memory_bank = data["memory_bank"]
        self.threshold = data["threshold"]
        self.knn = NearestNeighbors(n_neighbors=9, metric="euclidean")
        self.knn.fit(self.memory_bank)
```

### 2.3 YOLOv8-nano Training

```python
# src/models/yolov8_trainer.py
import mlflow
from ultralytics import YOLO


def train_yolov8(data_yaml: str, epochs: int = 50,
                 imgsz: int = 640, batch: int = 16) -> YOLO:
    mlflow.set_experiment("defect-yolov8")

    with mlflow.start_run():
        model = YOLO("yolov8n.pt")

        results = model.train(
            data=data_yaml,
            epochs=epochs,
            imgsz=imgsz,
            device="mps",
            batch=batch,
            workers=4,
            project="mlflow/yolov8",
            name="defect_nano",
        )

        mlflow.log_params({
            "model": "yolov8n", "epochs": epochs,
            "imgsz": imgsz, "device": "mps",
        })
        mlflow.log_metrics({
            "mAP50": results.results_dict["metrics/mAP50(B)"],
            "mAP50-95": results.results_dict["metrics/mAP50-95(B)"],
        })

    return model
```

### 2.4 Training Entry Point

```bash
# Jalankan training dengan uv run (tanpa activate venv)
uv run python -m src.training.train --model patchcore --category bottle
uv run python -m src.training.train --model yolov8 --category bottle
```

```python
# src/training/train.py
import argparse, yaml
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", choices=["patchcore", "yolov8"],
                        default="patchcore")
    parser.add_argument("--category", default="bottle")
    parser.add_argument("--config", default="src/training/config.yaml")
    args = parser.parse_args()

    with open(args.config) as f:
        cfg = yaml.safe_load(f)

    Path("models").mkdir(exist_ok=True)

    if args.model == "patchcore":
        from src.data.dataset import DefectDataset
        from src.models.patchcore import PatchCore

        dataset = DefectDataset("data/raw", args.category,
                                split="train", augment=False)
        images = [img for img, _ in dataset]

        model = PatchCore()
        model.fit(images, threshold_percentile=cfg["threshold_percentile"])
        model.save(f"models/patchcore_{args.category}.pkl")

    elif args.model == "yolov8":
        from src.models.yolov8_trainer import train_yolov8
        train_yolov8(
            data_yaml=f"data/processed/{args.category}.yaml",
            epochs=cfg["epochs"],
            imgsz=cfg["imgsz"],
            batch=cfg["batch_size"],
        )


if __name__ == "__main__":
    main()
```

```yaml
# src/training/config.yaml
device: mps
epochs: 50
imgsz: 640
batch_size: 16
img_size_patchcore: 224
threshold_percentile: 95
```

### 2.5 Evaluation

```bash
uv run python -m src.training.evaluate --model patchcore --category bottle
```

```python
# src/training/evaluate.py
import numpy as np
from sklearn.metrics import roc_auc_score, f1_score, confusion_matrix


def evaluate_patchcore(model, test_loader) -> dict:
    scores, labels = [], []

    for images, targets in test_loader:
        for img, label in zip(images, targets):
            result = model.predict(img)
            scores.append(result["anomaly_score"])
            labels.append(label.item())

    preds = [1 if s > model.threshold else 0 for s in scores]
    auroc = roc_auc_score(labels, scores)
    f1 = f1_score(labels, preds)
    cm = confusion_matrix(labels, preds)

    print(f"AUROC : {auroc:.4f}")
    print(f"F1    : {f1:.4f}")
    print(f"CM    :\n{cm}")
    return {"auroc": auroc, "f1": f1}
```

---

## Phase 3 — Backend API (Minggu 4)

### 3.1 pyproject.toml Backend

```toml
# backend/pyproject.toml
[project]
name = "defect-backend"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.111",
    "uvicorn[standard]>=0.30",
    "pydantic>=2.7",
    "sqlalchemy>=2.0",
    "aiosqlite>=0.20",
    "python-multipart>=0.0.9",
    "minio>=7.2",
    "pillow>=10.3",
    "torch>=2.3",
    "torchvision>=0.18",
    "ultralytics>=8.2",
    "scikit-learn>=1.5",
    "numpy>=1.26",
]

[tool.uv]
dev-dependencies = ["pytest>=8", "httpx>=0.27", "ruff>=0.4"]
```

### 3.2 FastAPI App

```python
# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import inference, results, health

app = FastAPI(title="Defect Detection API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(inference.router, prefix="/api/v1")
app.include_router(results.router, prefix="/api/v1")
```

```bash
# Jalankan backend
cd backend
uv run uvicorn main:app --reload --port 8000
```

### 3.3 Inference Router

```python
# backend/routers/inference.py
import uuid, time
from fastapi import APIRouter, UploadFile, File, HTTPException
from schemas.response import InferenceResponse
from services.inference_service import run_inference
from services.storage_service import upload_image
from services.db_service import save_result

router = APIRouter()

@router.post("/infer", response_model=InferenceResponse)
async def infer(file: UploadFile = File(...), category: str = "bottle"):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File harus berupa gambar")

    image_bytes = await file.read()
    image_id = str(uuid.uuid4())

    image_url = await upload_image(image_bytes, image_id)

    t0 = time.perf_counter()
    result = await run_inference(image_bytes, category)
    latency_ms = (time.perf_counter() - t0) * 1000

    await save_result({
        "image_id": image_id,
        "image_url": image_url,
        "category": category,
        "is_defect": result["is_defect"],
        "anomaly_score": result["anomaly_score"],
        "latency_ms": latency_ms,
    })

    return InferenceResponse(
        image_id=image_id,
        image_url=image_url,
        is_defect=result["is_defect"],
        anomaly_score=result["anomaly_score"],
        detections=result.get("detections", []),
        latency_ms=latency_ms,
    )
```

### 3.4 Endpoints Summary

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/health` | Health check + model status |
| `POST` | `/api/v1/infer` | Upload gambar → hasil deteksi |
| `GET` | `/api/v1/results` | List hasil (pagination) |
| `GET` | `/api/v1/results/{id}` | Detail satu hasil |
| `GET` | `/api/v1/stats` | Defect rate, avg latency, total inspections |
| `GET` | `/api/v1/categories` | List model/kategori yang tersedia |

---

## Phase 4 — Frontend TanStack (Minggu 5–6)

### 4.1 Setup dengan Bun

```bash
cd frontend

# Scaffold
bun create vite . --template react-ts

# TanStack stack
bun add @tanstack/react-router @tanstack/react-query @tanstack/react-table
bun add @tanstack/router-devtools @tanstack/react-query-devtools

# Utilities
bun add axios react-dropzone recharts
bun add tailwindcss @tailwindcss/vite

# Dev tools
bun add -d @types/react @types/react-dom typescript

# Start dev server (pakai Bun runtime, bukan Node)
bun run dev
```

> `bun run dev` menjalankan Vite lewat Bun runtime — startup biasanya < 300ms.

### 4.2 vite.config.ts

```typescript
// frontend/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": "http://localhost:8000",   // Proxy ke FastAPI
    },
  },
});
```

### 4.3 TanStack Router Setup

```typescript
// frontend/src/routes/__root.tsx
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 px-6 py-3 flex items-center gap-6">
        <span className="font-semibold text-white">Defect Detector</span>
        <Link to="/" className="text-gray-400 hover:text-white text-sm">
          Inspect
        </Link>
        <Link to="/history" className="text-gray-400 hover:text-white text-sm">
          History
        </Link>
        <Link to="/analytics" className="text-gray-400 hover:text-white text-sm">
          Analytics
        </Link>
      </nav>
      <main className="p-6 max-w-5xl mx-auto">
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </div>
  ),
});
```

### 4.4 TanStack Query Hooks

```typescript
// frontend/src/queries/useInference.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { InferenceResponse } from "../types/api";

export function useInference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) =>
      axios.post<InferenceResponse>("/api/v1/infer", form)
        .then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["results"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
```

```typescript
// frontend/src/queries/useResults.ts
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";
import type { ResultRecord } from "../types/api";

export function useResults(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["results", page, pageSize],
    queryFn: () =>
      axios.get<{ data: ResultRecord[]; total: number }>("/api/v1/results", {
        params: { page, page_size: pageSize },
      }).then(r => r.data),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
```

### 4.5 Inference Page

```typescript
// frontend/src/routes/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useInference } from "../queries/useInference";

export const Route = createFileRoute("/")({
  component: InferencePage,
});

function InferencePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const mutation = useInference();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    onDrop: ([f]) => {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    },
  });

  const handleSubmit = () => {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    form.append("category", "bottle");
    mutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inspect Product</h1>

      <div {...getRootProps()} className={`
        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
        transition-colors
        ${isDragActive
          ? "border-indigo-400 bg-indigo-950/20"
          : "border-gray-700 hover:border-indigo-600"
        }
      `}>
        <input {...getInputProps()} />
        {preview
          ? <img src={preview} alt="preview"
              className="max-h-64 mx-auto rounded-lg object-contain" />
          : <p className="text-gray-500">
              Drop gambar di sini atau klik untuk upload
            </p>
        }
      </div>

      <button
        onClick={handleSubmit}
        disabled={!file || mutation.isPending}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500
                   disabled:opacity-40 rounded-lg font-medium transition-colors"
      >
        {mutation.isPending ? "Analyzing..." : "Run Inference"}
      </button>

      {mutation.data && (
        <div className={`p-6 rounded-xl border ${
          mutation.data.is_defect
            ? "border-red-500/50 bg-red-950/30"
            : "border-green-500/50 bg-green-950/30"
        }`}>
          <p className={`text-xl font-bold mb-2 ${
            mutation.data.is_defect ? "text-red-400" : "text-green-400"
          }`}>
            {mutation.data.is_defect ? "⚠ DEFECT DETECTED" : "✓ PASSED"}
          </p>
          <p className="text-sm text-gray-400">
            Score:{" "}
            <code className="text-white">
              {mutation.data.anomaly_score.toFixed(4)}
            </code>
            {" · "}Latency:{" "}
            <code className="text-white">
              {mutation.data.latency_ms.toFixed(1)}ms
            </code>
          </p>
        </div>
      )}
    </div>
  );
}
```

### 4.6 TanStack Table — History Page

```typescript
// frontend/src/routes/history.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  createColumnHelper, flexRender,
  getCoreRowModel, getSortedRowModel,
  useReactTable, type SortingState,
} from "@tanstack/react-table";
import { useResults } from "../queries/useResults";
import type { ResultRecord } from "../types/api";

const col = createColumnHelper<ResultRecord>();

const columns = [
  col.accessor("created_at", {
    header: "Time",
    cell: i => new Date(i.getValue()).toLocaleString("id-ID"),
  }),
  col.accessor("category", { header: "Category" }),
  col.accessor("is_defect", {
    header: "Status",
    cell: i => (
      <span className={i.getValue()
        ? "text-red-400 font-medium"
        : "text-green-400 font-medium"
      }>
        {i.getValue() ? "Defect" : "OK"}
      </span>
    ),
  }),
  col.accessor("anomaly_score", {
    header: "Score",
    cell: i => <code>{i.getValue().toFixed(4)}</code>,
  }),
  col.accessor("latency_ms", {
    header: "Latency",
    cell: i => `${i.getValue().toFixed(1)}ms`,
  }),
];

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([]);
  const { data, isLoading, isFetching } = useResults(page);

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: data ? Math.ceil(data.total / 20) : -1,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inspection History</h1>
        {isFetching && (
          <span className="text-xs text-gray-500">Refreshing...</span>
        )}
      </div>

      {isLoading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(h => (
                    <th
                      key={h.id}
                      onClick={h.column.getToggleSortingHandler()}
                      className="px-4 py-3 text-left text-gray-400 font-medium
                                 cursor-pointer hover:text-white select-none"
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {({ asc: " ↑", desc: " ↓" } as Record<string, string>)
                        [h.column.getIsSorted() as string] ?? ""}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id}
                  className="border-t border-gray-800 hover:bg-gray-900/50 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center gap-2 justify-end text-sm">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg border border-gray-700
                     disabled:opacity-30 hover:bg-gray-800 transition-colors"
        >Prev</button>
        <span className="text-gray-400">
          Page {page} of {data ? Math.ceil(data.total / 20) : "—"}
        </span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={!data || page >= Math.ceil(data.total / 20)}
          className="px-3 py-1.5 rounded-lg border border-gray-700
                     disabled:opacity-30 hover:bg-gray-800 transition-colors"
        >Next</button>
      </div>
    </div>
  );
}
```

---

## Phase 5 — Containerization Podman (Minggu 7)

### 5.1 Backend Containerfile

```dockerfile
# backend/Containerfile
FROM python:3.11-slim

# Install uv di dalam container
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy manifest dulu untuk layer caching yang optimal
COPY pyproject.toml uv.lock ./

# Install dependencies via uv (jauh lebih cepat dari pip)
RUN uv sync --frozen --no-dev

COPY . .

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 5.2 Frontend Containerfile

```dockerfile
# frontend/Containerfile
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy lockfile dulu untuk layer caching
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

> Base image `oven/bun:1` adalah image resmi Bun — tersedia untuk `linux/arm64` (M1 compatible).

### 5.3 nginx.conf

```nginx
# frontend/nginx.conf
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  # SPA fallback — semua route ke index.html (TanStack Router)
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Proxy API calls ke backend
  location /api/ {
    proxy_pass http://localhost:8000;
    proxy_set_header Host $host;
  }
}
```

### 5.4 Podman Compose

```yaml
# podman/compose.yaml
version: "3.8"
services:
  backend:
    build:
      context: ../backend
      dockerfile: Containerfile
    ports: ["8000:8000"]
    environment:
      DATABASE_URL: sqlite:///./results.db
      MINIO_ENDPOINT: minio:9000
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    volumes:
      - ../models:/app/models:z      # :z wajib di Podman (SELinux relabeling)
    depends_on: [minio]

  frontend:
    build:
      context: ../frontend
      dockerfile: Containerfile
    ports: ["3000:80"]
    depends_on: [backend]

  minio:
    image: quay.io/minio/minio:latest   # quay.io lebih direkomendasikan di Podman
    command: server /data --console-address :9001
    ports: ["9000:9000", "9001:9001"]
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data:z

  mlflow:
    image: ghcr.io/mlflow/mlflow:latest
    command: mlflow server --host 0.0.0.0 --port 5000
    ports: ["5000:5000"]
    volumes:
      - ../mlflow:/mlflow:z

volumes:
  minio_data:
```

### 5.5 Build & Run

```bash
# scripts/dev.sh
#!/bin/bash
set -e

echo "🔨 Building containers..."
podman compose -f podman/compose.yaml build

echo "🚀 Starting services..."
podman compose -f podman/compose.yaml up -d

echo ""
echo "✅ Services running:"
echo "  Frontend  → http://localhost:3000"
echo "  API       → http://localhost:8000"
echo "  API Docs  → http://localhost:8000/docs"
echo "  MLflow    → http://localhost:5000"
echo "  MinIO     → http://localhost:9001"
```

```bash
# Stop semua
podman compose -f podman/compose.yaml down

# Lihat logs
podman compose -f podman/compose.yaml logs -f backend
```

> **Catatan Podman vs Docker penting:**
> - Semua volume mount wajib suffix `:z` (SELinux relabeling) agar container bisa akses host files
> - Gunakan `quay.io/minio/minio` bukan `minio/minio` — lebih stabil di Podman
> - `podman compose` (bukan `docker-compose`) — install via `pip install podman-compose` atau `brew install podman-compose`
> - Rootless Podman: port < 1024 butuh `sudo sysctl net.ipv4.ip_unprivileged_port_start=80`

---

## Phase 6 — Polish & Deploy (Minggu 8)

### 6.1 Checklist Sebelum Push

- [ ] `.gitignore` exclude `data/raw/`, `models/*.pkl`, `.env`, `mlflow/mlruns/`, `bun.lockb` tidak di-ignore (commit lockfile!)
- [ ] `README.md` ada GIF demo, arsitektur diagram, hasil metrics (AUROC, F1)
- [ ] Semua secret pindah ke `.env` (tidak ada hardcoded credential)
- [ ] API punya error handling lengkap dan validasi input
- [ ] `uv run ruff check .` dan `bun run lint` bersih
- [ ] Podman build sukses di clean environment
- [ ] Notebook punya output yang clean (clear output sebelum commit)

### 6.2 Demo curl untuk README

```bash
# Health check
curl http://localhost:8000/health

# Inference
curl -X POST http://localhost:8000/api/v1/infer \
  -F "file=@data/raw/bottle/test/broken_large/000.png" \
  -F "category=bottle" | jq

# List results
curl "http://localhost:8000/api/v1/results?page=1&page_size=5" | jq
```

### 6.3 Optional Deploy

```bash
# Backend → Fly.io (support Containerfile langsung)
cd backend
fly launch --name defect-api
fly deploy

# Frontend → Vercel (support Bun natively sejak 2024)
cd frontend
bun run build
vercel deploy dist/
# Atau: vercel --prod (auto detect Bun dari bun.lockb)
```

---

## Tech Stack Summary

| Layer | Tool | Alasan |
|---|---|---|
| Python pkg manager | **uv** | 10–100x lebih cepat dari pip, lockfile deterministik |
| JS pkg manager | **Bun** | Install cepat, runtime cepat, lockfile binary |
| Dataset | MVTec AD | Benchmark standar, gratis, pre-labeled |
| ML Framework | PyTorch + MPS | Native M1 GPU support |
| Anomaly model | PatchCore | No training, state-of-the-art, ringan |
| Detection model | YOLOv8-nano | 3MB, cepat, cocok M1 |
| Experiment tracking | MLflow (lokal) | Zero cloud dependency |
| Data augmentation | Albumentations | Terbaik untuk CV |
| Backend | FastAPI + Uvicorn | Async, auto OpenAPI docs |
| Frontend routing | TanStack Router | Type-safe, file-based |
| Data fetching | TanStack Query | Caching, devtools, background refetch |
| Data table | TanStack Table | Headless, sorting, pagination |
| Styling | Tailwind CSS v4 | Zero config |
| Storage | MinIO | S3-compatible, run lokal |
| Database | SQLite → PostgreSQL | SQLite dev, PG prod |
| Container | Podman (rootless) | Drop-in Docker, lebih secure |
| Charts | Recharts | Simple, React-native |

---

## Tips M1 Air

### uv Tips

```bash
# Jalankan script tanpa activate venv dulu
uv run python script.py

# Tambah dependency baru
uv add <package>

# Sync setelah pull repo
uv sync

# Update semua dependencies
uv lock --upgrade

# Export ke requirements.txt (untuk Containerfile fallback)
uv export --format requirements-txt --no-dev > requirements.txt
```

### Bun Tips

```bash
# Jalankan npm script
bun run dev / build / lint

# Add dependency
bun add <package>

# Update dependencies
bun update

# Run TypeScript langsung (tanpa compile dulu)
bun run src/utils/check.ts

# Lockfile di-commit ke git — jangan di-gitignore
```

### MPS Memory Management

```python
# Selalu clear MPS cache setelah inference batch besar
import torch
if torch.backends.mps.is_available():
    torch.mps.empty_cache()
```

### RAM Budget M1 Air 8GB

| Service | RAM Usage |
|---|---|
| PatchCore (WideResNet50) | ~2.5GB |
| FastAPI + model loaded | ~1.5GB |
| Frontend dev server (Bun) | ~200MB |
| MinIO + MLflow | ~500MB |
| macOS + browser | ~1.5GB |
| **Total estimasi** | **~6.2GB ✅** |

Masih aman dengan margin ~1.8GB.

---

*v2 — Updated: uv + Bun edition*
