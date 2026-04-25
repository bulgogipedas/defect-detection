#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export UV_HTTP_TIMEOUT="${UV_HTTP_TIMEOUT:-300}"

CATEGORY="${1:-bottle}"
RUN_NAME="${2:-}"
RUN_ARGS=()
if [[ -n "$RUN_NAME" ]]; then
  RUN_ARGS+=(--run-name "$RUN_NAME")
fi

uv run python -m src.training.train \
  --model patchcore \
  --category "$CATEGORY" \
  --mlflow-uri "file:./mlflow/mlruns" \
  "${RUN_ARGS[@]}"

LATEST_WEIGHTS="models/patchcore_${CATEGORY}.pkl"
METRICS_PATH="models/eval/${CATEGORY}_metrics.json"

uv run python -m src.training.evaluate \
  --model patchcore \
  --category "$CATEGORY" \
  --weights "$LATEST_WEIGHTS" \
  --output-json "$METRICS_PATH"

uv run python -m src.training.promote \
  --category "$CATEGORY" \
  --weights "$LATEST_WEIGHTS" \
  --metrics-json "$METRICS_PATH"

echo "Training + evaluation + promotion completed for category '$CATEGORY'."
