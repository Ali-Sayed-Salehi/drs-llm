#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=".env.dev"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Env file not found: ${ENV_FILE}" >&2
  exit 1
fi

# Add or remove compose files
COMPOSE_FILES=(
  -f ../backend/drs-llm/docker-compose.yml
  -f ../backend/gateway/docker-compose.yml
  -f ../frontend/docker-compose.yml
  -f ../github-app/docker-compose.yaml
)

exec docker compose --env-file "${ENV_FILE}" "${COMPOSE_FILES[@]}" "$@"
