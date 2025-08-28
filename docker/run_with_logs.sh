#!/usr/bin/env bash
set -euo pipefail

# ====== CONFIGURATION ======
SCRIPT_NAME="start_api.sh"  # Name of the script to run (inside ./docker/)
# ===========================

LOG_DIR="/workspace/docker_jobs"

mkdir -p "$LOG_DIR"

timestamp=$(date +"%Y-%m-%d_%H-%M-%S")

script_base="${SCRIPT_NAME%.*}"
log_file="$LOG_DIR/${script_base}_${timestamp}.log"

echo "Logging to: $log_file"

exec "./docker/${SCRIPT_NAME}" 2>&1 | tee "$log_file"
