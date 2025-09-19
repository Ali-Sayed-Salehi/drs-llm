#!/usr/bin/env bash
set -euo pipefail

# ====== CONFIGURATION ======
: "${SCRIPT_NAME:=start_api.sh}"      # default script
: "${LOG_PREFIX:=app}"                # set per-service via env (seq-cls / clm)
# ===========================

LOG_DIR="/workspace/docker_jobs"
mkdir -p "$LOG_DIR"

timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
log_file="$LOG_DIR/${LOG_PREFIX}_${timestamp}.log"

echo "Logging to: $log_file"

# Forward all output to tee so we always capture logs to a file
exec "./${SCRIPT_NAME}" 2>&1 | tee -a "$log_file"
