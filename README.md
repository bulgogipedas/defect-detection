# Visual defect pipeline

Local-first MVP MLOps project for visual defect detection with:
- model training + evaluation + promotion workflow,
- version-aware FastAPI inference service,
- operational telemetry + CI quality gates.

## Layout

| Path | Role |
|------|------|
| `src/` | Training, evaluation, model promotion (`uv` package) |
| `backend/` | FastAPI inference API (`uv` project) |
| `frontend/` | Vite + React + TanStack UI (`bun`) |
| `podman/compose.yaml` | MinIO, MLflow, API, UI local stack |
| `scripts/` | Dev, CI, model gate, train/eval/promote helpers |
| `.github/workflows/ci.yml` | CI quality/build workflow |

## Quick start (local)

1. Install dependencies
   - root: `uv sync`
   - backend: `cd backend && uv sync`
   - frontend: `cd frontend && bun install`

2. Optional accelerator check
   - `uv run python -c "import torch; print(torch.backends.mps.is_available())"`

3. Start services for development
   - backend: `cd backend && PYTHONPATH=.. MODEL_MODE=auto uv run uvicorn main:app --reload --port 8000`
   - frontend: `cd frontend && bun run dev`

## Local-first MLOps workflow

### Data ingest
- `./scripts/download_mvtec.sh`
- extract MVTec AD into `data/raw/` (example: `data/raw/bottle/train/good/*.png`)

### Train + evaluate + promote
- `./scripts/train.sh bottle`
- pipeline performed by the script:
  1. train PatchCore (`src.training.train`)
  2. evaluate (`src.training.evaluate`) -> `models/eval/bottle_metrics.json`
  3. promote if gate passes (`src.training.promote`) -> `models/releases/...` + `models/active_model.json`

### Inference serving modes
- `MODEL_MODE=auto`: use active/promoted model when available, otherwise demo fallback.
- `MODEL_MODE=production`: require model artifact, fail if missing.
- `MODEL_MODE=demo`: always use demo predictor.

## Container stack (Podman)

From repo root:
- `./scripts/dev.sh up`
- `./scripts/dev.sh logs backend`
- `./scripts/dev.sh down`

Services:
- Frontend: `http://localhost:3000`
- API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- MLflow: `http://localhost:5000`
- MinIO console: `http://localhost:9001`

## Standard task entrypoints

- `./scripts/tasks.sh lint`
- `./scripts/tasks.sh test`
- `./scripts/tasks.sh build`
- `./scripts/tasks.sh train bottle`
- `./scripts/tasks.sh compose-up`
- `./scripts/tasks.sh compose-down`

## API smoke tests

```bash
curl -s http://localhost:8000/health | jq

curl -s -X POST http://localhost:8000/api/v1/infer \
  -F "file=@data/raw/bottle/test/broken_large/000.png" \
  -F "category=bottle" | jq

curl -s "http://localhost:8000/api/v1/results?page=1&page_size=5" | jq
curl -s "http://localhost:8000/api/v1/telemetry" | jq
```

## Release checklist (MVP)

1. Quality gates pass:
   - `uv run ruff check src`
   - `cd backend && uv run ruff check . && uv run pytest -q`
   - `cd frontend && bun run lint && bun run build`
2. Model gate pass:
   - if model/inference code changes, update evidence in `reports/model-eval/`.
3. Inference smoke pass:
   - `/health`, `/api/v1/infer`, `/api/v1/results`, `/api/v1/telemetry` work.
4. Container build smoke pass:
   - backend/frontend images build from containerfiles.

## Rollback guide

- App rollback: redeploy previous image tag / commit.
- Model rollback:
  1. point `models/active_model.json` to previous release artifact.
  2. restart backend.
- Emergency fallback:
  - set `MODEL_MODE=demo` to keep API available while debugging model artifacts.
