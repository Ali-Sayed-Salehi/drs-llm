#!/usr/bin/env bash
# Usage:
#   ./test_api.sh [SEQ_BASE] [CLM_BASE]
# Defaults:
#   SEQ_BASE = http://localhost:8084
#   CLM_BASE = http://localhost:8085
#
# Optional env vars (used by both flows' /predict_by_sha):
#   GH_REPO="owner/repo"      # default: apache/flink
#   GH_SHA="<commit-sha>"     # default: flink public commit

set -euo pipefail

SEQ_BASE="${1:-${BASE:-http://localhost:8084/seq-cls}}"
CLM_BASE="${2:-${CLM_BASE:-http://localhost:8085/clm}}"

GH_REPO="${GH_REPO:-apache/flink}"
GH_SHA="${GH_SHA:-d7b5213f1fd2910ce0fd111027608fb452c1f733}"

jq_or_cat() {
  if command -v jq >/dev/null 2>&1; then jq; else cat; fi
}

hr() { printf '%*s\n' "${1:-80}" '' | tr ' ' '='; }

payload_bugfix_java='{
  "commit_message": "Fix NPE when user is null",
  "code_diff": "diff --git a/src/U.java b/src/U.java\nindex e69de29..4b825dc 100644\n--- a/src/U.java\n+++ b/src/U.java\n@@ -1 +1 @@\n-return u.getId().toString();\n+return u != null ? String.valueOf(u.getId()) : \"\";"
}'

payload_refactor_py='{
  "commit_message": "Refactor: rename variable (no behavior change)",
  "code_diff": "diff --git a/app/a.py b/app/a.py\nindex 1111111..2222222 100644\n--- a/app/a.py\n+++ b/app/a.py\n@@ -1,3 +1,3 @@\n-x = 1\n+count = 1\n print(\"ok\")"
}'

payload_readme='{
  "commit_message": "Add README (new file)",
  "code_diff": "diff --git a/README.md b/README.md\nnew file mode 100644\nindex 0000000..e69de29\n--- /dev/null\n+++ b/README.md\n@@ -0,0 +1,3 @@\n# Project\nInitial commit\n"
}'

test_seq_cls() {
  echo
  hr
  echo "SEQ-CLS API tests @ ${SEQ_BASE}"
  hr

  echo "==> [SEQ] 1) Health: ${SEQ_BASE}/health"
  curl -sS "${SEQ_BASE}/health" | jq_or_cat
  echo

  echo "==> [SEQ] 2) /predict (bug fix example, Java)"
  echo "${payload_bugfix_java}" | \
    curl -sS -X POST "${SEQ_BASE}/predict" -H 'Content-Type: application/json' -d @- | jq_or_cat
  echo

  echo "==> [SEQ] 3) /predict (benign refactor, Python)"
  echo "${payload_refactor_py}" | \
    curl -sS -X POST "${SEQ_BASE}/predict" -H 'Content-Type: application/json' -d @- | jq_or_cat
  echo

  echo "==> [SEQ] 4) /predict_batch (three sequential items)"
  printf '[%s,%s,%s]\n' \
    "${payload_bugfix_java}" \
    "${payload_refactor_py}" \
    "${payload_readme}" | \
    curl -sS -X POST "${SEQ_BASE}/predict_batch" -H 'Content-Type: application/json' -d @- | jq_or_cat
  echo

  echo "==> [SEQ] 5) /predict_by_sha (GitHub API flow)"
  echo "    Using GH_REPO=${GH_REPO}  GH_SHA=${GH_SHA}"
  printf '{ "repo":"%s", "sha":"%s" }\n' "${GH_REPO}" "${GH_SHA}" | \
    curl -sS -X POST "${SEQ_BASE}/predict_by_sha" -H 'Content-Type: application/json' -d @- | jq_or_cat
}

test_clm() {
  echo
  hr
  echo "CLM API tests @ ${CLM_BASE}"
  hr

  echo "==> [CLM] 1) Health: ${CLM_BASE}/health"
  curl -sS "${CLM_BASE}/health" | jq_or_cat
  echo

  echo "==> [CLM] 2) /predict (bug fix example, Java) — returns plain text"
  echo "${payload_bugfix_java}" | \
    curl -sS -X POST "${CLM_BASE}/predict" \
      -H 'Content-Type: application/json' \
      -H 'Accept: text/plain' \
      -d @- \
    | cat
  echo

  echo "==> [CLM] 3) /predict (benign refactor, Python) — returns plain text"
  echo "${payload_refactor_py}" | \
    curl -sS -X POST "${CLM_BASE}/predict" \
      -H 'Content-Type: application/json' \
      -H 'Accept: text/plain' \
      -d @- \
    | cat
  echo

  echo "==> [CLM] 4) /predict_by_sha (GitHub API flow) — returns plain text"
  echo "    Using GH_REPO=${GH_REPO}  GH_SHA=${GH_SHA}"
  printf '{ "repo":"%s", "sha":"%s" }\n' "${GH_REPO}" "${GH_SHA}" | \
    curl -sS -X POST "${CLM_BASE}/predict_by_sha" \
      -H 'Content-Type: application/json' \
      -H 'Accept: text/plain' \
      -d @- \
    | cat
}

# ---- Run both suites ----
test_seq_cls
# test_clm

echo
hr
echo "All tests finished."
hr
