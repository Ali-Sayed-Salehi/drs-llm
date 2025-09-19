import logging
from transformers import AutoTokenizer, pipeline
from core.settings import BaseAppSettings
from core.runtime import SingletonFactory, model_kwargs_from_settings, limited_infer

settings = BaseAppSettings()
log = logging.getLogger(__name__)

class HFClassifier:
    def __init__(self, settings: BaseAppSettings):
        tok = AutoTokenizer.from_pretrained(settings.model_id, use_fast=True, trust_remote_code=True)
        kwargs = model_kwargs_from_settings(settings, for_4bit_quant=True)
        log.info("Setting up classification pipeline")
        self.pipe = pipeline(
            task="text-classification",
            model=settings.model_id,
            tokenizer=tok,
            model_kwargs=kwargs,
        )

    @limited_infer
    def predict(self, text: str) -> tuple[str, float]:
        out = self.pipe(text, truncation=True, max_length=settings.max_length)
        return out[0]["label"], float(out[0]["score"])  # top-1


def make_singleton(settings: BaseAppSettings):
    return SingletonFactory(lambda: HFClassifier(settings))