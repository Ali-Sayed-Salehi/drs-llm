# DRS-LLM API


## How to run
```bash
# Build once (or when deps change)
docker compose build

# Start with GPUs and hot reload
docker compose up -d

# Tail logs
docker compose logs -f api

# Test
curl -s -X POST http://localhost:8080/predict \
  -H 'Content-Type: application/json' \
  -d @- <<'JSON'
{
  "commit_message": "Fix NPE when user is null",
  "code_diff": "diff --git a/U.java b/U.java\n- return u.getId().toString();\n+ return u != null ? String.valueOf(u.getId()) : \"\";"
}
JSON

```