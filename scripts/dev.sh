#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if command -v podman &>/dev/null; then
  echo "Building and starting Podman compose..."
  podman compose -f "$ROOT/podman/compose.yaml" build
  podman compose -f "$ROOT/podman/compose.yaml" up -d
  echo ""
  echo "Services:"
  echo "  Frontend  → http://localhost:3000"
  echo "  API       → http://localhost:8000"
  echo "  API docs  → http://localhost:8000/docs"
  echo "  MLflow    → http://localhost:5000"
  echo "  MinIO UI  → http://localhost:9001"
else
  echo "Podman not found. For local dev run:"
  echo "  Terminal 1: cd backend && USE_MINIO=false uv run uvicorn main:app --reload --port 8000"
  echo "  Terminal 2: cd frontend && bun run dev"
fi
