# DRS-LLM: Bug Risk Assessment API

A high-performance FastAPI service that uses vLLM to serve a Llama sequence classification model for assessing bug risk in code diffs.

## 🚀 Features

- **Diff Processing**: Converts raw git diffs to structured XML format using existing utilities
- **Risk Assessment**: Analyzes code diffs and returns a percentage risk score (0-100%)
- **Batch Processing**: Process multiple diffs simultaneously (up to 10)
- **vLLM Integration**: High-performance model serving with GPU acceleration
- **RESTful API**: Clean, documented endpoints with automatic OpenAPI documentation
- **Docker Support**: Containerized deployment with GPU support

## 🏗️ Architecture

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

## 📋 Prerequisites

- Python 3.8+
- CUDA-compatible GPU (for vLLM)
- Local Llama sequence classification model
- Required Python packages (see `requirements.txt`)

## 🛠️ Installation

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

## 🚀 Quick Start

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

## 📚 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information and links |
| `/health` | GET | Health check and model status |
| `/assess-risk` | POST | Single diff risk assessment |
| `/assess-risk-batch` | POST | Batch diff processing |
| `/validate-diff` | POST | Diff format validation |
| `/model-info` | GET | Model information |
| `/docs` | GET | Interactive API documentation |

## 🔧 Configuration

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

## 📖 Usage Examples

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

## 🧪 Testing

Run the comprehensive test suite:
```bash
# Test all endpoints
python test_api.py

# Test specific endpoint
python test_api.py --test health
python test_api.py --test single
```

## 📁 Project Structure

```
drs-llm/
├── __init__.py              # Package initialization
├── main.py                  # FastAPI application
├── models.py                # Pydantic data models
├── model_service.py         # vLLM model service
├── diff_processor.py        # Diff processing utilities
├── config.py                # Configuration management
├── run.py                   # CLI runner script
├── start.sh                 # Linux startup script
├── test_api.py              # API testing suite
├── requirements.txt         # Python dependencies
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Docker Compose setup
└── README.md               # This file
```

## 🐳 Docker Deployment

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

## 🔍 Troubleshooting

### Common Issues

1. **Model Not Loading**:
   - Check `MODEL_PATH` environment variable
   - Verify model directory exists
   - Check GPU memory availability

2. **CUDA Errors**:
   - Ensure CUDA is properly installed
   - Check GPU driver compatibility
   - Reduce `VLLM_GPU_MEMORY_UTILIZATION`

3. **Import Errors**:
   - Verify all dependencies are installed
   - Check Python path configuration
   - Ensure vLLM is compatible with your CUDA version

### Logs and Debugging

The API provides detailed logging:
- Model initialization status
- Request processing details
- Error information
- Performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- Powered by [vLLM](https://github.com/vllm-project/vllm)
- Uses [Llama](https://github.com/facebookresearch/llama) models
- Diff processing utilities from the perf-pilot project

## 📞 Support

For questions and support:
- Open an issue on GitHub
- Check the API documentation at `/docs` when running
- Review the test examples in `test_api.py`
