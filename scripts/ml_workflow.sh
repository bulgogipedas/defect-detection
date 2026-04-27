#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DATA_ROOT="${DATA_RAW_ROOT:-$HOME/Downloads/mvtec_anomaly_detection}"
CATEGORY="${1:-all}"

echo "[1/7] Data collection"
echo "Using dataset root: $DATA_ROOT"
[[ -d "$DATA_ROOT" ]] || { echo "Dataset not found: $DATA_ROOT"; exit 1; }

echo "[2/7] EDA"
uv run jupyter nbconvert --to notebook --execute "notebooks/01_mvtec_eda.ipynb" --output "01_mvtec_eda.ipynb" --output-dir "notebooks"

echo "[3/7] Data preprocessing"
echo "Preprocessing is embedded in dataset transforms + model pipeline (train/eval modules)."

if [[ "$CATEGORY" == "all" ]]; then
  echo "[4/7] Model train (all categories)"
  DATA_RAW_ROOT="$DATA_ROOT" ./scripts/train_all_categories.sh
else
  echo "[4/7] Model train ($CATEGORY)"
  DATA_RAW_ROOT="$DATA_ROOT" ./scripts/train.sh "$CATEGORY"
fi

echo "[5/7] Model eval"
echo "Evaluation artifacts are written to models/eval and reports/model-eval."

echo "[6/7] Deploy"
echo "Run: cd backend && PYTHONPATH=.. uv run uvicorn main:app --reload --port 8000"

echo "[7/7] Monitoring"
echo "Use endpoints: /health, /api/v1/stats, /api/v1/telemetry"
