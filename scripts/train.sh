#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export UV_HTTP_TIMEOUT="${UV_HTTP_TIMEOUT:-300}"

CATEGORY="${1:-bottle}"
RUN_NAME="${2:-}"
DATA_ROOT="${DATA_RAW_ROOT:-$HOME/Downloads/mvtec_anomaly_detection}"
RUN_ARGS=()
if [[ -n "$RUN_NAME" ]]; then
  RUN_ARGS+=(--run-name "$RUN_NAME")
fi

TRAIN_CMD=(
  uv run python -m src.training.train
  --model patchcore
  --category "$CATEGORY"
  --data-root "$DATA_ROOT"
  --mlflow-uri "file:./mlflow/mlruns"
)
if [[ ${#RUN_ARGS[@]} -gt 0 ]]; then
  TRAIN_CMD+=("${RUN_ARGS[@]}")
fi
"${TRAIN_CMD[@]}"

LATEST_WEIGHTS="models/patchcore_${CATEGORY}.pkl"
METRICS_PATH="models/eval/${CATEGORY}_metrics.json"

uv run python -m src.training.evaluate \
  --model patchcore \
  --category "$CATEGORY" \
  --data-root "$DATA_ROOT" \
  --weights "$LATEST_WEIGHTS" \
  --output-json "$METRICS_PATH"

uv run python -m src.training.promote \
  --category "$CATEGORY" \
  --weights "$LATEST_WEIGHTS" \
  --metrics-json "$METRICS_PATH"

echo "Training + evaluation + promotion completed for category '$CATEGORY'."
