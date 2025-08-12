# DRS-LLM: Bug Risk Assessment API

A high-performance FastAPI service that uses vLLM to serve a Llama sequence classification model for assessing bug risk in code diffs.

## Features

- **Diff Processing**: Converts raw git diffs to structured XML format using existing utilities
- **Risk Assessment**: Analyzes code diffs and returns a percentage risk score (0-100%)
- **Batch Processing**: Process multiple diffs simultaneously (up to 10)
- **vLLM Integration**: High-performance model serving with GPU acceleration
- **RESTful API**: Clean, documented endpoints with automatic OpenAPI documentation
- **Docker Support**: Containerized deployment with GPU support

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   FastAPI App  │───▶│  Model Service   │───▶│  vLLM Engine    │
│                 │    │                  │    │                 │
│  - REST API    │    │  - Risk Logic    │    │  - Llama Model  │
│  - Validation  │    │  - Preprocessing │    │  - GPU Serving  │
│  - Error Hand. │    │  - Postprocessing│    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │              ┌──────────────────┐
         └──────────────▶│ Diff Processor  │
                         │                  │
                         │  - Git Diff     │
                         │  - XML Struct.  │
                         │  - Validation   │
                         └──────────────────┘
```

## Prerequisites

- Python 3.8+
- CUDA-compatible GPU (for vLLM)
- Local Llama sequence classification model
- Required Python packages (see `requirements.txt`)

## Installation

1. **Clone the repository**:
   ```bash
   git clone git@github.com:Ali-Sayed-Salehi/drs-llm.git
   cd drs-llm
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set environment variables**:
   ```bash
   export MODEL_PATH="/path/to/your/llama/model"
   export MAX_MODEL_LEN="4096"
   export HOST="0.0.0.0"
   export PORT="8000"
   ```

## Quick Start

### Using the Start Script (Linux)
```bash
# Make script executable
chmod +x start.sh

# Set your model path
export MODEL_PATH="/path/to/your/llama/model"

# Start the API
./start.sh
```

### Using Python Directly
```bash
# Start with default settings
python run.py

# Start in production mode
python run.py --environment production

# Start with custom host/port
python run.py --host 0.0.0.0 --port 8000
```

### Using Docker
```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build manually
docker build -t drs-llm .
docker run -p 8000:8000 -e MODEL_PATH=/models/llama-model drs-llm
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information and links |
| `/health` | GET | Health check and model status |
| `/assess-risk` | POST | Single diff risk assessment |
| `/assess-risk-batch` | POST | Batch diff processing |
| `/validate-diff` | POST | Diff format validation |
| `/model-info` | GET | Model information |
| `/docs` | GET | Interactive API documentation |

## Configuration

The API can be configured using environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `MODEL_PATH` | Required | Path to your local Llama model |
| `MAX_MODEL_LEN` | 4096 | Maximum sequence length for the model |
| `HOST` | 0.0.0.0 | API server host |
| `PORT` | 8000 | API server port |
| `VLLM_GPU_MEMORY_UTILIZATION` | 0.9 | GPU memory usage (0.0-1.0) |
| `VLLM_TENSOR_PARALLEL_SIZE` | 1 | Number of GPUs for tensor parallelism |
| `VLLM_DTYPE` | bfloat16 | Model data type |
| `MAX_BATCH_SIZE` | 10 | Maximum batch size for processing |
| `ENVIRONMENT` | development | Environment (development/production/testing) |

##  Usage Examples

### Python Client
```python
import requests

# Single diff assessment
response = requests.post("http://localhost:8000/assess-risk", json={
    "raw_diff": "diff --git a/test.py b/test.py\n...",
    "file_path": "test.py"
})

result = response.json()
print(f"Risk Score: {result['risk_score']}%")
print(f"Risk Level: {result['risk_level']}")
```

### cURL Examples
```bash
# Health check
curl http://localhost:8000/health

# Single diff assessment
curl -X POST "http://localhost:8000/assess-risk" \
  -H "Content-Type: application/json" \
  -d '{
    "raw_diff": "diff --git a/test.py b/test.py\n...",
    "file_path": "test.py"
  }'
```

## Testing

Run the comprehensive test suite:
```bash
# Test all endpoints
python test_api.py

# Test specific endpoint
python test_api.py --test health
python test_api.py --test single
```


## Docker Deployment

### Single Container
```bash
docker build -t drs-llm .
docker run -d \
  -p 8000:8000 \
  -e MODEL_PATH=/models/llama-model \
  -v /path/to/your/model:/models/llama-model:ro \
  --gpus all \
  drs-llm
```

### Docker Compose
```bash
# Create models directory and copy your model
mkdir -p models
cp -r /path/to/your/llama/model models/llama-model

# Start services
docker-compose up -d
```
