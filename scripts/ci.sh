#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[CI] Root lint"
uv run ruff check src

echo "[CI] Backend lint + test"
(
  cd backend
  uv run ruff check .
  uv run pytest -q
)

echo "[CI] Frontend lint + build"
(
  cd frontend
  bun run lint
  bun run build
)

echo "[CI] Container build smoke"
podman build -f backend/Containerfile -t defect-backend:ci .
podman build -f frontend/Containerfile -t defect-frontend:ci .

echo "[CI] Done"
