#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TASK="${1:-help}"

case "$TASK" in
  lint)
    cd "$ROOT"
    uv run ruff check src
    (
      cd backend
      uv run ruff check .
    )
    (
      cd frontend
      bun run lint
    )
    ;;
  test)
    cd "$ROOT/backend"
    uv run pytest -q
    ;;
  build)
    cd "$ROOT/frontend"
    bun run build
    ;;
  train)
    "$ROOT/scripts/train.sh" "${2:-bottle}" "${3:-}"
    ;;
  compose-up)
    "$ROOT/scripts/dev.sh" up
    ;;
  compose-down)
    "$ROOT/scripts/dev.sh" down
    ;;
  help|*)
    cat <<EOF
Usage: scripts/tasks.sh <task>
  lint          Run lint checks (root/backend/frontend)
  test          Run backend tests
  build         Build frontend bundle
  train [cat]   Train+evaluate+promote patchcore category
  compose-up    Start Podman stack
  compose-down  Stop Podman stack
EOF
    ;;
esac
