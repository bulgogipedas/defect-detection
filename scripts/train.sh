#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export UV_HTTP_TIMEOUT="${UV_HTTP_TIMEOUT:-300}"
uv run python -m src.training.train --model patchcore --category "${1:-bottle}"
