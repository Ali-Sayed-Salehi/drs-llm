# DRS-LLM


## Architecture
```mermaid
flowchart TB
  %% ==== Client ====
  Browser[User Browser]

  %% ==== Project on Host (Compose) ====
  subgraph Host["Host (Docker Compose project; network_mode: host)"]
    direction TB

    %% Frontend
    FE["drs-frontend<br/>— Vite/Node (prod)<br/>PORT = ${FRONTEND_PORT:-3173}"]

    %% Gateway
    GW["drs-gateway-api<br/>— FastAPI reverse-proxy<br/>Routes:<br/>&nbsp;&nbsp;/seq-cls/** → Seq-Cls API<br/>&nbsp;&nbsp;/clm/** → CLM API<br/>PORT = ${GATEWAY_PORT:-8083}<br/>LOG_DIR = /workspace/logs  ⇐  ./logs"]

    %% Backends
    subgraph LLMs["LLM APIs (GPU containers)"]
      direction LR
      SEQ["drs-seq-cls-api<br/>— FastAPI + HF seq-classification<br/>PORT = ${SEQCLS_PORT:-8081}<br/>GPU  = ${SEQCLS_GPU:-2}<br/>HF_HOME = /workspace/.cache/seqcls<br/>MODEL_ID = ${SEQCLS_DRSLLM_MODEL_ID}"]
      CLM["drs-clm-api<br/>— FastAPI (CLM raw text)<br/>PORT = ${CLM_PORT:-8082}<br/>GPU  = ${CLM_GPU:-3}<br/>HF_HOME = /workspace/.cache/clm<br/>MODEL_ID = ${CLM_DRSLLM_MODEL_ID}"]
    end

    %% Shared storage mapped on host
    subgraph Vols["Host-mapped volumes"]
      direction TB
      LOGS[/"./logs ↔ /workspace/logs"/]
      MODELS[/"../../../perf-pilot/LLMs (ro) ↔ /LLMs"/]
      CACHES[/" /workspace/.cache/* (inside containers) "/]
    end
  end

  %% ==== Edges ====
  Browser -->|"HTTP"| FE
  FE -->|"HTTP → http://localhost:${GATEWAY_PORT:-8083}"| GW
  GW -->|"/seq-cls/**"| SEQ
  GW -->|"/clm/**"| CLM

  %% Volumes wiring
  GW --- LOGS
  SEQ --- LOGS
  CLM --- LOGS
  SEQ --- MODELS
  CLM --- MODELS

```


## Testing and Deployment
First modify the env variables in the prod.env and test.env. 
The system needs at least two GPUs the cuda device numbers of which have to be given in the env files.

All the services have compose files. You can build and start them just how you would do with docke compose. When using the compose.sh script, it's the same but all the compose files are passed in by default so you just have to name services and the environment you want.

```bash
cd deploy

# Bring up only the backend and also build the images in case of new changes
./compose.sh test up -d --build drs-gateway-api

# Bring up the whole stack and also build the images in case of new changes
./compose.sh test up -d --build

# See the merged services
./compose.sh test config --services

# Bring up the whole stack in TEST
./compose.sh test up -d

# Bring up only the backend and remove orphan ocntainers
./compose.sh test up -d drs-gateway-api --remove-orphans

# frontend only
./compose.sh test up -d drs-frontend --no-deps

# Bring up only the llm apis
./compose.sh test up -d drs-seq-cls-api drs-clm-api

# Bring up PROD
./compose.sh prod up -d

# See the fully-resolved config for TEST (great for debugging)
./compose.sh test config

# Tail gateway logs for only gateway api in TEST
./compose.sh test logs -f drs-gateway-api --no-deps

```
