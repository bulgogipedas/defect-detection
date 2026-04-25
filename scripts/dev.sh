#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CMD="${1:-up}"

if [[ "$CMD" == "local" ]]; then
  echo "Run local dev:"
  echo "  Terminal 1: cd backend && PYTHONPATH=.. USE_MINIO=false MODEL_MODE=auto uv run uvicorn main:app --reload --port 8000"
  echo "  Terminal 2: cd frontend && bun run dev"
  exit 0
fi

if ! command -v podman &>/dev/null; then
  echo "Podman not found. Use './scripts/dev.sh local' instead."
  exit 1
fi

COMPOSE_FILE="$ROOT/podman/compose.yaml"
case "$CMD" in
  up)
    echo "Building and starting Podman compose..."
    podman compose -f "$COMPOSE_FILE" build
    podman compose -f "$COMPOSE_FILE" up -d
    echo ""
    echo "Services:"
    echo "  Frontend  → http://localhost:3000"
    echo "  API       → http://localhost:8000"
    echo "  API docs  → http://localhost:8000/docs"
    echo "  MLflow    → http://localhost:5000"
    echo "  MinIO UI  → http://localhost:9001"
    ;;
  down)
    podman compose -f "$COMPOSE_FILE" down
    ;;
  logs)
    podman compose -f "$COMPOSE_FILE" logs -f "${2:-backend}"
    ;;
  *)
    echo "Usage: $0 [up|down|logs|local]"
    exit 1
    ;;
esac
