#!/usr/bin/env bash
set -euo pipefail

echo "Running shell script for API startup ..."

uvicorn app.main:app --host 0.0.0.0 --port 8080
