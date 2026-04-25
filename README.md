# Visual defect pipeline

End-to-end defect detection portfolio: **PyTorch / PatchCore & YOLOv8**, **FastAPI**, **React + TanStack**, **MLflow**, **Podman** (see `defect-detection-plan-v2.md`).

## Layout

| Path | Role |
|------|------|
| `src/` | Training & evaluation (`uv` package) |
| `backend/` | FastAPI API (separate `uv` project) |
| `frontend/` | Vite + React + TanStack Router/Query/Table (`bun`) |
| `podman/compose.yaml` | MinIO, MLflow, API, UI |
| `scripts/` | MVTec download helper, train, dev |

## Quick start (local)

1. **Python (repo root)**  
   `uv sync`  
   `uv run python -c "import torch; print(torch.backends.mps.is_available())"`

2. **MVTec AD**  
   `./scripts/download_mvtec.sh`  
   Extract the official archive under `data/raw/` so you have e.g. `data/raw/bottle/train/good/*.png`.

3. **Train PatchCore**  
   `./scripts/train.sh bottle`  
   Produces `models/patchcore_bottle.pkl`.

4. **Backend**  
   `cd backend && PYTHONPATH=.. uv run uvicorn main:app --reload --port 8000`  
   Docs: `http://localhost:8000/docs`

5. **Frontend**  
   `cd frontend && bun run dev`  
   Open the URL Vite prints (default `http://localhost:5173`).

## Container stack

From the repo root (with Podman):

`./scripts/dev.sh`

## API smoke tests

```bash
curl -s http://localhost:8000/health | jq
```

Upload (after a model exists at `models/patchcore_bottle.pkl` and paths are valid):

```bash
curl -s -X POST http://localhost:8000/api/v1/infer \
  -F "file=@data/raw/bottle/test/broken_large/000.png" \
  -F "category=bottle" | jq
```
