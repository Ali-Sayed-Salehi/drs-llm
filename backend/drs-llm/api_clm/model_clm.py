import logging
from transformers import AutoTokenizer, pipeline
from core.settings import BaseAppSettings
from core.runtime import SingletonFactory, model_kwargs_from_settings, limited_infer

log = logging.getLogger(__name__)

class HFGenerator:
    def __init__(self, settings: BaseAppSettings):
        tok = AutoTokenizer.from_pretrained(
            settings.model_id, use_fast=True, trust_remote_code=True
        )

        tok.truncation_side = "right"
        tok.model_max_length = settings.max_length

        gen_kwargs = model_kwargs_from_settings(settings, for_4bit_quant=True)
        log.info("Setting up text-generation pipeline (raw text mode)")
        self.pipe = pipeline(
            task="text-generation",
            model=settings.model_id,
            tokenizer=tok,
            model_kwargs=gen_kwargs,
        )
        self.tok = tok
        self.generate_params = dict(
            max_new_tokens=100,
            # temperature=0.3,
            # top_p=0.9,
            do_sample=False,
            eos_token_id=tok.eos_token_id,
            pad_token_id=tok.eos_token_id,
            truncation=True,
            return_full_text=False
        )

    @limited_infer
    def infer_text(self, prompt: str) -> str:
        out = self.pipe(prompt, **self.generate_params)
        text = out[0].get("generated_text", "")
        # Remove the prompt prefix if present
        if text.startswith(prompt):
            text = text[len(prompt):]
        # Strip out <ANSWER> and </ANSWER> tags if they exist
        text = text.replace("<ANSWER>", "").replace("</ANSWER>", "")
        return text.strip()

def make_singleton(settings: BaseAppSettings):
    return SingletonFactory(lambda: HFGenerator(settings))