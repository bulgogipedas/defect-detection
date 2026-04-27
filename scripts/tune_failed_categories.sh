#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DATA_ROOT="${DATA_RAW_ROOT:-$HOME/Downloads/mvtec_anomaly_detection}"
REPORT_DIR="reports/model-eval/tuning"
mkdir -p "$REPORT_DIR"

FAILED=(grid metal_nut screw)

for cat in "${FAILED[@]}"; do
  echo "============================================================"
  echo "[tuning] $cat"
  DATA_RAW_ROOT="$DATA_ROOT" uv run python scripts/tune_patchcore_category.py \
    --category "$cat" \
    --data-root "$DATA_ROOT" \
    --output-json "$REPORT_DIR/${cat}_tuning.json"
done

DATA_RAW_ROOT="$DATA_ROOT" uv run python scripts/report_model_metrics.py \
  --data-root "$DATA_ROOT" \
  --metrics-dir "models/eval" \
  --output-json "reports/model-eval/all_categories_metrics.json" \
  --output-md "reports/model-eval/all_categories_metrics.md"

echo "Tuning done. Reports updated in reports/model-eval/ and $REPORT_DIR."
