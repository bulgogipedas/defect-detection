#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/data/raw"
cd "$ROOT/data/raw"
echo "Download MVTec AD from: https://www.mvtec.com/company/research/datasets/mvtec-ad"
echo "Place mvtec_anomaly_detection.tar.xz here, then:"
echo "  tar -xJf mvtec_anomaly_detection.tar.xz"
if [[ -f "mvtec_anomaly_detection.tar.xz" ]]; then
  tar -xJf mvtec_anomaly_detection.tar.xz
  echo "Extracted. Sample categories:"
  find . -mindepth 1 -maxdepth 1 -type d | head
fi
