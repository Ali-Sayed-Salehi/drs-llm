# DRS-LLM API


## How to run api
```bash
cd docker
docker compose build
docker compose up -d drs-llm-environment

../test_api.sh

```

## How to run frontend
```bash
cd frontend
npm run dev

```

## Deploy

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now drs-frontend
systemctl status drs-frontend
journalctl -u drs-frontend -f
```