#!/usr/bin/env bash
set -euo pipefail

echo "Starting the API ..."

uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
