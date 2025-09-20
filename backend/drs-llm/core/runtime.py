import os
import threading
import asyncio
import logging
import torch
from transformers import BitsAndBytesConfig

_MAX_CONCURRENCY = int(os.getenv("DRSLLM_MAX_CONCURRENCY", "1"))
_init_lock = threading.Lock()
log = logging.getLogger(__name__)

class _InferLimiter:
    sema = threading.Semaphore(_MAX_CONCURRENCY)


def torch_dtype(name: str):
    name = (name or "float16").lower()
    if name in ("fp16", "float16", "half"): return torch.float16
    if name in ("bf16", "bfloat16"): return torch.bfloat16
    return torch.float32


def model_kwargs_from_settings(settings, *, for_4bit_quant: bool):
    dtype = torch_dtype(settings.dtype)
    kwargs = dict(
        device_map="auto",
        torch_dtype=(dtype if not settings.load_in_4bit else (torch.bfloat16 if dtype == torch.bfloat16 else torch.float32)),
        low_cpu_mem_usage=True,
        local_files_only=True,
    )
    if for_4bit_quant and settings.load_in_4bit:
        kwargs["quantization_config"] = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=dtype,
        )
    return kwargs


class SingletonFactory:
    """Thread-safe lazy singleton factory for heavy model objects."""
    def __init__(self, builder):
        self._builder = builder
        self._obj = None

    def get(self):
        if self._obj is None:
            with _init_lock:
                if self._obj is None:
                    self._obj = self._builder()
        return self._obj


async def preload_singleton(singleton_factory):
    """Run blocking singleton init off the event loop."""
    await asyncio.to_thread(singleton_factory.get)


def limited_infer(fn):
    """Decorator to gate concurrent inference across the process."""
    def _wrap(*args, **kw):
        with _InferLimiter.sema:
            return fn(*args, **kw)
    return _wrap