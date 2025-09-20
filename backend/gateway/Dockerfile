FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
      bash ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Copy code + scripts
COPY . .

RUN python -m pip install --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# Default envs
ENV PYTHONPATH=/workspace \
    APP_MODULE=app:app \
    HOST=0.0.0.0 \
    PORT=8083 \
    LOG_PREFIX=gateway \
    LOG_DIR=/workspace/logs

# Ensure default log dir exists (will be overlain by host mount if present)
RUN mkdir -p /workspace/logs

EXPOSE 8080
ENTRYPOINT ["/bin/bash"]