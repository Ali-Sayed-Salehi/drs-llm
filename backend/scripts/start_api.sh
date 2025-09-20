# backend/scripts/start_api.sh

#!/usr/bin/env bash
set -euo pipefail

: "${APP_MODULE:=app.main:app}"   # override per-service (api_cls.app:app / api_clm.app:app)
: "${HOST:=0.0.0.0}"
: "${PORT:=8080}"
: "${UVICORN_WORKERS:=1}"         # adjust if you want workers (GPU models often prefer 1)

echo "Starting Uvicorn → module=${APP_MODULE} host=${HOST} port=${PORT} workers=${UVICORN_WORKERS}"

exec uvicorn "${APP_MODULE}" \
  --host "${HOST}" \
  --port "${PORT}" \
  --workers "${UVICORN_WORKERS}"
