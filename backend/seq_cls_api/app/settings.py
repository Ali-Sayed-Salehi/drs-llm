from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
from typing import Literal, Optional

class Settings(BaseSettings):
    # Model / inference
    model_id: str = "/LLMs/trained/sequence-classification/llama3.1_8B_apachejit_small"
    dtype: Literal["float16", "bfloat16", "float32"] = "float16"
    max_length: int = 4096
    load_in_4bit: bool = True

    # FastAPI server
    host: str = "0.0.0.0"
    port: int = 8080

    log_level: str = Field("INFO", description="App/base log level")
    access_log_level: str = Field("INFO", description="uvicorn.access log level")
    transformers_log_level: str = Field("WARNING", description="transformers log level")

    # GitHub API
    github_token: Optional[str] = None
    github_api_base: str = "https://api.github.com"
    github_timeout_s: int = 20

    # Pydantic v2 config
    model_config = SettingsConfigDict(
        env_prefix="DRSLLM_",
        env_file=("config/settings.env", "config/secrets.env"),
        env_file_encoding="utf-8",
    )

    # normalize to UPPERCASE so users can set 'info', 'Info', etc.
    @field_validator("log_level", "access_log_level", "transformers_log_level", mode="before")
    @classmethod
    def _upper(cls, v: str) -> str:
        return str(v).upper()


settings = Settings()
