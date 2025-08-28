# app/model_hf.py
import torch
from typing import Optional, Tuple
from transformers import AutoTokenizer, pipeline
from .settings import settings
from transformers import BitsAndBytesConfig


def _dtype(name: str):
    name = (name or "float16").lower()
    if name in ("fp16", "float16", "half"): return torch.float16
    if name in ("bf16", "bfloat16"):        return torch.bfloat16
    return torch.float32

class HFClassifier:
    def __init__(self):
        dtype = _dtype(settings.dtype)
        quant_4bit = settings.load_in_4bit

        tokenizer = AutoTokenizer.from_pretrained(
            settings.model_id, use_fast=True, trust_remote_code=True
        )

        model_kwargs = dict(
            device_map="auto",
            torch_dtype=dtype if not quant_4bit else (torch.bfloat16 if dtype == torch.bfloat16 else torch.float32),
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

        self.pipe = pipeline(
            task="text-classification",
            model=settings.model_id,
            tokenizer=tokenizer,
            model_kwargs=model_kwargs
        )

    def predict(self, text: str, max_length: Optional[int] = None) -> Tuple[str, float]:
        results = self.pipe(
            text,
            truncation=True,
            max_length=max_length or settings.max_length,
        )

        return results[0]["label"], float(results[0]["score"])

_classifier: HFClassifier | None = None
def get_classifier() -> HFClassifier:
    global _classifier
    if _classifier is None:
        _classifier = HFClassifier()
    return _classifier
