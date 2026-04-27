#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DATA_ROOT="${DATA_RAW_ROOT:-$HOME/Downloads/mvtec_anomaly_detection}"
REPORT_DIR="reports/model-eval"
mkdir -p "$REPORT_DIR"

if [[ ! -d "$DATA_ROOT" ]]; then
  echo "DATA_ROOT not found: $DATA_ROOT"
  exit 1
fi

CATEGORIES=()
while IFS= read -r line; do
  [[ -n "$line" ]] && CATEGORIES+=("$line")
done < <(
  DATA_RAW_ROOT="$DATA_ROOT" uv run python - <<'PY'
from pathlib import Path
import os
root = Path(os.environ.get("DATA_RAW_ROOT", str(Path("~/Downloads/mvtec_anomaly_detection").expanduser()))).expanduser()
for p in sorted([x for x in root.iterdir() if x.is_dir()]):
    print(p.name)
PY
)

if [[ ${#CATEGORIES[@]} -eq 0 ]]; then
  echo "No categories found in $DATA_ROOT"
  exit 1
fi

echo "Training categories (${#CATEGORIES[@]}): ${CATEGORIES[*]}"

SUCCESS=()
FAILED=()
START_TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

for cat in "${CATEGORIES[@]}"; do
  echo "============================================================"
  echo "[$cat] train+eval+promote starting"
  if DATA_RAW_ROOT="$DATA_ROOT" ./scripts/train.sh "$cat"; then
    SUCCESS+=("$cat")
    echo "[$cat] OK"
  else
    FAILED+=("$cat")
    echo "[$cat] FAILED"
  fi
done

END_TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
SUMMARY_JSON="$REPORT_DIR/all_categories_summary.json"
SUCCESS_JOINED="$(IFS=$'\x1f'; echo "${SUCCESS[*]-}")"
FAILED_JOINED="$(IFS=$'\x1f'; echo "${FAILED[*]-}")"
SUCCESS_JOINED="$SUCCESS_JOINED" FAILED_JOINED="$FAILED_JOINED" uv run python - <<PY
import json
import os
from pathlib import Path

def split_list(val: str) -> list[str]:
    if not val:
        return []
    return [x for x in val.split("\x1f") if x]

summary = {
    "started_at_utc": "$START_TS",
    "ended_at_utc": "$END_TS",
    "data_root": "$DATA_ROOT",
    "success_categories": split_list(os.environ.get("SUCCESS_JOINED", "")),
    "failed_categories": split_list(os.environ.get("FAILED_JOINED", "")),
}
Path("$SUMMARY_JSON").write_text(json.dumps(summary, indent=2), encoding="utf-8")
print(Path("$SUMMARY_JSON"))
PY

echo "============================================================"
echo "SUCCESS: ${SUCCESS[*]:-none}"
echo "FAILED : ${FAILED[*]:-none}"
echo "Summary: $SUMMARY_JSON"

DATA_RAW_ROOT="$DATA_ROOT" uv run python scripts/report_model_metrics.py \
  --data-root "$DATA_ROOT" \
  --metrics-dir "models/eval" \
  --output-json "$REPORT_DIR/all_categories_metrics.json" \
  --output-md "$REPORT_DIR/all_categories_metrics.md"

if [[ ${#FAILED[@]} -gt 0 ]]; then
  exit 2
fi
