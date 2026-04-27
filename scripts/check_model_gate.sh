#!/usr/bin/env bash
set -euo pipefail

BASE_REF="${1:-origin/main}"
HEAD_REF="${2:-HEAD}"

CHANGED="$(git diff --name-only "$BASE_REF" "$HEAD_REF" || true)"
if [[ -z "$CHANGED" ]]; then
  echo "No changed files to check."
  exit 0
fi

NEEDS_EVAL=0
# Require fresh evaluation evidence only when model/training code changes.
# Inference service or UI orchestration updates can happen without retraining.
if echo "$CHANGED" | rg -q "^(src/models/|src/training/)"; then
  NEEDS_EVAL=1
fi

if [[ "$NEEDS_EVAL" -eq 0 ]]; then
  echo "No model/inference critical changes. Gate passed."
  exit 0
fi

if echo "$CHANGED" | rg -q "^reports/model-eval/"; then
  echo "Model/inference changes detected with evaluation report update. Gate passed."
  exit 0
fi

echo "Model/inference changes detected but no reports/model-eval/* evidence updated."
echo "Run training/evaluation and commit report evidence in reports/model-eval/."
exit 1
