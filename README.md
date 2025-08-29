# DRS-LLM API


## How to run
```bash
cd docker
docker compose build
docker compose up -d drs-llm-environment

# Health
curl http://localhost:8080/health

# Test: from root of the repo
./test_api.sh

```