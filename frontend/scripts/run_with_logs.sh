# frontend/scripts/run_with_logs.sh

#!/usr/bin/env bash
set -euo pipefail

: "${SCRIPT_NAME:=start_frontend.sh}"
: "${LOG_PREFIX:=frontend}"
: "${LOG_DIR:=/workspace/logs}"   # <-- NEW: override with env

mkdir -p "$LOG_DIR"

timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
log_file="$LOG_DIR/${LOG_PREFIX}_${timestamp}.log"

echo "Logging to: $log_file"

exec "/workspace/scripts/${SCRIPT_NAME}" 2>&1 | tee -a "$log_file"
