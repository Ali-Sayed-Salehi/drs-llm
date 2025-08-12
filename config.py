"""
Configuration settings for the Bug Risk Assessment API.
"""

import os
from typing import Optional


class Config:
    """Configuration class for the API"""
    
    # API Configuration
    API_VERSION: str = "1.0.0"
    API_TITLE: str = "Bug Risk Assessment API"
    API_DESCRIPTION: str = "API for assessing bug risk in code diffs using Llama sequence classification"
    
    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    RELOAD: bool = os.getenv("RELOAD", "false").lower() == "true"
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")
    
    # Model Configuration
    MODEL_PATH: str = os.getenv("MODEL_PATH", "/path/to/your/llama/model")
    MAX_MODEL_LEN: int = int(os.getenv("MAX_MODEL_LEN", "4096"))
    
    # vLLM Configuration
    VLLM_GPU_MEMORY_UTILIZATION: float = float(os.getenv("VLLM_GPU_MEMORY_UTILIZATION", "0.9"))
    VLLM_TENSOR_PARALLEL_SIZE: int = int(os.getenv("VLLM_TENSOR_PARALLEL_SIZE", "1"))
    VLLM_DTYPE: str = os.getenv("VLLM_DTYPE", "bfloat16")
    
    # Processing Configuration
    MAX_BATCH_SIZE: int = int(os.getenv("MAX_BATCH_SIZE", "10"))
    MAX_DIFF_LENGTH: int = int(os.getenv("MAX_DIFF_LENGTH", "10000"))
    
    # Risk Assessment Configuration
    RISK_THRESHOLDS: dict = {
        "Low": 25.0,
        "Medium": 50.0,
        "High": 75.0,
        "Critical": 100.0
    }
    
    # CORS Configuration
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "*").split(",")
    CORS_ALLOW_CREDENTIALS: bool = os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true"
    
    # Logging Configuration
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_FILE: Optional[str] = os.getenv("LOG_FILE")
    
    # Security Configuration
    API_KEY_HEADER: str = os.getenv("API_KEY_HEADER", "X-API-Key")
    API_KEY: Optional[str] = os.getenv("API_KEY")
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "100"))
    
    @classmethod
    def validate(cls) -> bool:
        """Validate configuration settings"""
        
        if not os.path.exists(cls.MODEL_PATH):
            print(f"❌ Model path does not exist: {cls.MODEL_PATH}")
            return False
        
        if cls.MAX_MODEL_LEN <= 0:
            print("❌ MAX_MODEL_LEN must be positive")
            return False
        
        if cls.MAX_BATCH_SIZE <= 0:
            print("❌ MAX_BATCH_SIZE must be positive")
            return False
        
        print("✅ Configuration validation passed")
        return True
    
    @classmethod
    def print_config(cls):
        """Print current configuration"""
        print("🔧 API Configuration:")
        print(f"  Version: {cls.API_VERSION}")
        print(f"  Host: {cls.HOST}")
        print(f"  Port: {cls.PORT}")
        print(f"  Model Path: {cls.MODEL_PATH}")
        print(f"  Max Model Length: {cls.MAX_MODEL_LEN}")
        print(f"  Max Batch Size: {cls.MAX_BATCH_SIZE}")
        print(f"  vLLM GPU Memory: {cls.VLLM_GPU_MEMORY_UTILIZATION}")
        print(f"  vLLM Tensor Parallel: {cls.VLLM_TENSOR_PARALLEL_SIZE}")
        print(f"  vLLM Data Type: {cls.VLLM_DTYPE}")


# Environment-specific configurations
class DevelopmentConfig(Config):
    """Development configuration"""
    RELOAD = True
    LOG_LEVEL = "debug"
    CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]


class ProductionConfig(Config):
    """Production configuration"""
    RELOAD = False
    LOG_LEVEL = "warning"
    CORS_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else []


class TestingConfig(Config):
    """Testing configuration"""
    RELOAD = False
    LOG_LEVEL = "debug"
    MODEL_PATH = "/tmp/test_model"


# Configuration factory
def get_config(environment: str = None) -> Config:
    """Get configuration based on environment"""
    if environment is None:
        environment = os.getenv("ENVIRONMENT", "development").lower()
    
    configs = {
        "development": DevelopmentConfig,
        "production": ProductionConfig,
        "testing": TestingConfig
    }
    
    return configs.get(environment, DevelopmentConfig)
