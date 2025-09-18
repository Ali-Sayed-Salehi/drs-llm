# app/model_hf.py
import os
import threading
import torch
from typing import Optional, Tuple
from transformers import AutoTokenizer, pipeline
from transformers import BitsAndBytesConfig
from .settings import settings

import logging
log = logging.getLogger(__name__)

def _dtype(name: str):
    name = (name or "float16").lower()
    if name in ("fp16", "float16", "half"): return torch.float16
    if name in ("bf16", "bfloat16"):        return torch.bfloat16
    return torch.float32

# Global (per-process) init lock + singleton
_classifier = None
_init_lock = threading.Lock()

# Max concurrent inferences per process (default 1)
_MAX_CONCURRENCY = int(os.getenv("DRSLLM_MAX_CONCURRENCY", "1"))

class HFClassifier:
    # Class-level semaphore shared by all instances (we use one singleton anyway)
    _infer_sema = threading.Semaphore(_MAX_CONCURRENCY)

    def __init__(self):
        dtype = _dtype(settings.dtype)
        quant_4bit = settings.load_in_4bit

        tokenizer = AutoTokenizer.from_pretrained(
            settings.model_id, use_fast=True, trust_remote_code=True
        )

        model_kwargs = dict(
            device_map="auto",
            torch_dtype=(
                dtype if not quant_4bit
                else (torch.bfloat16 if dtype == torch.bfloat16 else torch.float32)
            ),
            low_cpu_mem_usage=True,
            local_files_only=True,
        )

        if quant_4bit:
            model_kwargs["quantization_config"] = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=dtype,
            )

        log.info("Setting up pipeline")
        # Build a single pipeline; tokenization & truncation handled there
        self.pipe = pipeline(
            task="text-classification",
            model=settings.model_id,
            tokenizer=tokenizer,
            model_kwargs=model_kwargs,
            # top_k default (1) → returns only best label/score
        )

    def predict(self, text: str, max_length: Optional[int] = None) -> Tuple[str, float]:
        # Limit concurrent inferences (per process)
        with self._infer_sema:
            results = self.pipe(
                text,
                truncation=True,
                max_length=max_length or settings.max_length,
            )
        # results is a list with the top-1 dict
        return results[0]["label"], float(results[0]["score"])

def get_classifier() -> HFClassifier:
    global _classifier
    if _classifier is None:
        with _init_lock:                # thread-safe lazy init
            if _classifier is None:
                _classifier = HFClassifier()
    return _classifier

