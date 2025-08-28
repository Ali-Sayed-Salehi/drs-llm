from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    model_id: str = Field(default="/LLMs/pretrained/sequence-classification/test")
    dtype: str = Field(default="float16")     # "float16" | "bfloat16" | "float32"
    max_length: int = 4096
    load_in_4bit: bool = True

    # FastAPI server
    host: str = "0.0.0.0"
    port: int = 8080

    class Config:
        env_prefix = "DRSLLM_"
        env_file = ".env"

settings = Settings()
