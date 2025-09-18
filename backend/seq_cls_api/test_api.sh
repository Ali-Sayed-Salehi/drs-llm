#!/usr/bin/env bash
# Usage: ./test_api.sh [BASE_URL]
# Default BASE_URL is http://localhost:8080
# Examples:
#   ./test_api.sh
#   ./test_api.sh http://localhost:18080

set -euo pipefail

BASE="${1:-http://localhost:8080}"

jq_or_cat() {
  if command -v jq >/dev/null 2>&1; then jq; else cat; fi
}

echo "==> 1) Health check: ${BASE}/health"
curl -sS "${BASE}/health" | jq_or_cat
echo

echo "==> 2) Single /predict (bug fix example, Java)"
curl -sS -X POST "${BASE}/predict" \
  -H 'Content-Type: application/json' \
  -d @- <<'JSON' | jq_or_cat
{
  "commit_message": "Fix NPE when user is null",
  "code_diff": "diff --git a/src/U.java b/src/U.java\nindex e69de29..4b825dc 100644\n--- a/src/U.java\n+++ b/src/U.java\n@@ -1 +1 @@\n-return u.getId().toString();\n+return u != null ? String.valueOf(u.getId()) : \"\";"
}
JSON
echo

echo "==> 3) Single /predict (benign refactor, Python)"
curl -sS -X POST "${BASE}/predict" \
  -H 'Content-Type: application/json' \
  -d @- <<'JSON' | jq_or_cat
{
  "commit_message": "Refactor: rename variable (no behavior change)",
  "code_diff": "diff --git a/app/a.py b/app/a.py\nindex 1111111..2222222 100644\n--- a/app/a.py\n+++ b/app/a.py\n@@ -1,3 +1,3 @@\n-x = 1\n+count = 1\n print(\"ok\")"
}
JSON
echo

echo "==> 4) /predict_batch (three sequential items)"
curl -sS -X POST "${BASE}/predict_batch" \
  -H 'Content-Type: application/json' \
  -d @- <<'JSON' | jq_or_cat
[
  {
    "commit_message": "Fix NPE when user is null",
    "code_diff": "diff --git a/src/U.java b/src/U.java\nindex e69de29..4b825dc 100644\n--- a/src/U.java\n+++ b/src/U.java\n@@ -1 +1 @@\n-return u.getId().toString();\n+return u != null ? String.valueOf(u.getId()) : \"\";"
  },
  {
    "commit_message": "Refactor only",
    "code_diff": "diff --git a/app/a.py b/app/a.py\nindex 1111111..2222222 100644\n--- a/app/a.py\n+++ b/app/a.py\n@@ -1,3 +1,3 @@\n-x = 1\n+count = 1\n print(\"ok\")"
  },
  {
    "commit_message": "Add README (new file)",
    "code_diff": "diff --git a/README.md b/README.md\nnew file mode 100644\nindex 0000000..e69de29\n--- /dev/null\n+++ b/README.md\n@@ -0,0 +1,3 @@\n+# Project\n+Initial commit\n+"
  }
]
JSON
echo "==> Done."
