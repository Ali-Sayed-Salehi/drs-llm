#!/bin/bash

# Bug Risk Assessment API Startup Script for Linux

set -e

echo "🚀 Starting Bug Risk Assessment API..."

# Check if MODEL_PATH is set
if [ -z "$MODEL_PATH" ]; then
    echo "❌ MODEL_PATH environment variable is not set"
    echo "Please set it to your local Llama model path:"
    echo "export MODEL_PATH=/path/to/your/llama/model"
    exit 1
fi

# Check if model path exists
if [ ! -d "$MODEL_PATH" ]; then
    echo "❌ Model path does not exist: $MODEL_PATH"
    exit 1
fi

# Check if CUDA is available
if ! command -v nvidia-smi &> /dev/null; then
    echo "⚠️  NVIDIA GPU not detected. The API may not work properly without GPU support."
else
    echo "✅ NVIDIA GPU detected"
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits
fi

# Check Python dependencies
echo "🔍 Checking Python dependencies..."
python3 -c "import vllm, fastapi, uvicorn" 2>/dev/null || {
    echo "❌ Missing required Python packages. Installing..."
    pip3 install -r requirements.txt
}

# Validate configuration
echo "🔧 Validating configuration..."
python3 -c "
from config import get_config
config = get_config()
if not config.validate():
    exit(1)
print('✅ Configuration validation passed')
"

if [ $? -ne 0 ]; then
    echo "❌ Configuration validation failed"
    exit 1
fi

# Start the API
echo "🌐 Starting API server..."
echo "📚 API documentation will be available at: http://localhost:8000/docs"
echo "🔍 Health check: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the API
python3 run.py --environment production
