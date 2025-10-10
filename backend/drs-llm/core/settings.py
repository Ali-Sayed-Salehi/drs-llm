# /drs-llm/core/settings.py

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
from typing import Literal, Optional

class BaseAppSettings(BaseSettings):
    # May be: (a) full fine-tuned model dir OR (b) a PEFT/LoRA adapter dir
    model_id: str = "/LLMs/trained/sequence-classification/llama3.1_8B_apachejit_small"
    # If model_id points to an adapter, you MUST set base_model_path to the base HF model
    base_model_path: Optional[str] = "/LLMs/snapshots/meta-llama/Llama-3.1-8B"

    dtype: Literal["float16", "bfloat16", "float32"] = "float16"
    max_length: int = 4096
    load_in_4bit: bool = True
    local_files_only: bool = True
    trust_remote_code: bool = True
    device_map: str = "auto"

    clm_for_seq_cls: bool = False
    zero_token: str = "0"
    one_token: str  = "1"
    drs_token: str  = "[/drs]"
    strict_single_token: bool = True

    # Server
    host: str = "0.0.0.0"
    port: int = 8080

    # Logging
    log_level: str = Field("INFO")
    access_log_level: str = Field("INFO")
    transformers_log_level: str = Field("WARNING")

    # GitHub API
    github_token: Optional[str] = None
    github_api_base: str = "https://api.github.com"
    github_timeout_s: int = 20

    model_config = SettingsConfigDict(
        env_prefix="DRSLLM_",
        env_file=("config/settings.env", "config/secrets.env"),
        env_file_encoding="utf-8",
    )

    @field_validator("log_level", "access_log_level", "transformers_log_level", mode="before")
    @classmethod
    def _upper(cls, v: str) -> str:
        return str(v).upper()

settings = BaseAppSettings()
