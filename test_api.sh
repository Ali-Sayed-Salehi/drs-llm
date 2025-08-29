#!/usr/bin/env bash
# Usage: ./test_api.sh [URL]
# Default URL is http://localhost:8080/predict

set -euo pipefail

URL="${1:-http://localhost:18080/predict}"

curl -sS -X POST "$URL" \
  -H 'Content-Type: application/json' \
  -d @- <<'JSON' | { command -v jq >/dev/null 2>&1 && jq || cat; }
{
  "commit_message": "Fix NPE when user is null",
  "code_diff": "diff --git a/U.java b/U.java\n- return u.getId().toString();\n+ return u != null ? String.valueOf(u.getId()) : \"\";"
}
JSON
