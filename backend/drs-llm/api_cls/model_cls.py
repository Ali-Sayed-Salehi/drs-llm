# /drs-llm/api_cls/model_cls.py

from __future__ import annotations
import logging
from typing import Optional, Tuple, Union

import numpy as np
import torch
from transformers import (
    AutoTokenizer,
    AutoConfig,
    AutoModelForSequenceClassification,
    AutoModelForCausalLM,
    pipeline as hf_pipeline,
)
from transformers.pipelines import Pipeline
from peft import PeftModel, PeftConfig

from core.settings import BaseAppSettings
from core.runtime import SingletonFactory, model_kwargs_from_settings, limited_infer

log = logging.getLogger(__name__)


# ---------------------------
# Helpers: adapter detection & builders
# ---------------------------

def _is_peft_adapter(path: str) -> bool:
    try:
        _ = PeftConfig.from_pretrained(path, local_files_only=True)
        log.info("Model path %s is a PEFT/LoRA adapter.", path)
        return True
    except Exception:
        log.info("Model path %s is a full model (not an adapter).", path)
        return False


def _build_model_and_tokenizer_for_pipeline(
    model_or_adapter_path: str,
    base_model_path: Optional[str],
    model_kwargs: dict,
    *,
    local_files_only: bool = True,
    trust_remote_code: bool = True,
) -> Tuple[Union[str, torch.nn.Module], AutoTokenizer, AutoConfig, bool]:
    """
    Returns (model_for_pipeline, tokenizer, config, used_adapter) for SEQ_CLS pipeline usage.
    If adapter: attaches to base model and returns a model object (ready for pipeline).
    Else: returns the model path (pipeline will lazy-load).
    """
    if _is_peft_adapter(model_or_adapter_path):
        if not base_model_path:
            raise ValueError("base_model_path is required when model_id points to a PEFT/LoRA adapter.")

        tokenizer = AutoTokenizer.from_pretrained(
            model_or_adapter_path, use_fast=True, local_files_only=local_files_only, trust_remote_code=trust_remote_code
        )
        config = AutoConfig.from_pretrained(base_model_path, local_files_only=local_files_only, trust_remote_code=trust_remote_code)
        base_model = AutoModelForSequenceClassification.from_pretrained(base_model_path, **model_kwargs)

        # Resize embeddings if adapter tokenizer expanded vocab
        new_vocab = len(tokenizer)
        if getattr(base_model.config, "vocab_size", None) != new_vocab:
            base_model.resize_token_embeddings(new_vocab, mean_resizing=False, pad_to_multiple_of=8)
            base_model.config.vocab_size = new_vocab

        peft_model = PeftModel.from_pretrained(
            base_model,
            model_id=model_or_adapter_path,
            is_trainable=False,
            local_files_only=local_files_only,
        )
        peft_model.eval()
        return peft_model, tokenizer, base_model.config, True

    # Full model path (pipeline can lazy load the weights)
    tokenizer = AutoTokenizer.from_pretrained(
        model_or_adapter_path, use_fast=True, local_files_only=local_files_only, trust_remote_code=trust_remote_code
    )
    config = AutoConfig.from_pretrained(model_or_adapter_path, local_files_only=local_files_only, trust_remote_code=trust_remote_code)
    return model_or_adapter_path, tokenizer, config, False


def _build_causal_model_and_tokenizer(
    model_or_adapter_path: str,
    base_model_path: Optional[str],
    model_kwargs: dict,
    *,
    local_files_only: bool = True,
    trust_remote_code: bool = True,
) -> Tuple[torch.nn.Module, AutoTokenizer, AutoConfig, bool]:
    """
    Returns (model, tokenizer, config, used_adapter) for CAUSAL_LM inference.
    If adapter: attaches to base causal LM and returns the model object.
    Else: loads a full causal LM.
    """
    if _is_peft_adapter(model_or_adapter_path):
        if not base_model_path:
            raise ValueError("base_model_path is required when model_id points to a PEFT/LoRA adapter.")

        tokenizer = AutoTokenizer.from_pretrained(
            model_or_adapter_path, use_fast=True, local_files_only=local_files_only, trust_remote_code=trust_remote_code
        )
        config = AutoConfig.from_pretrained(base_model_path, local_files_only=local_files_only, trust_remote_code=trust_remote_code)
        base_model = AutoModelForCausalLM.from_pretrained(base_model_path, **model_kwargs)

        new_vocab = len(tokenizer)
        if getattr(base_model.config, "vocab_size", None) != new_vocab:
            base_model.resize_token_embeddings(new_vocab, mean_resizing=False, pad_to_multiple_of=8)
            base_model.config.vocab_size = new_vocab

        peft_model = PeftModel.from_pretrained(
            base_model,
            model_id=model_or_adapter_path,
            is_trainable=False,
            local_files_only=local_files_only,
        )
        peft_model.eval()
        return peft_model, tokenizer, base_model.config, True

    tokenizer = AutoTokenizer.from_pretrained(
        model_or_adapter_path, use_fast=True, local_files_only=local_files_only, trust_remote_code=trust_remote_code
    )
    config = AutoConfig.from_pretrained(model_or_adapter_path, local_files_only=local_files_only, trust_remote_code=trust_remote_code)
    model = AutoModelForCausalLM.from_pretrained(model_or_adapter_path, **model_kwargs)
    model.eval()

    new_vocab = len(tokenizer)
    if getattr(model.config, "vocab_size", None) != new_vocab:
        model.resize_token_embeddings(new_vocab, mean_resizing=False, pad_to_multiple_of=8)
        model.config.vocab_size = new_vocab

    return model, tokenizer, config, False


# ---------------------------
# CLM→Seq-Cls custom pipeline
# ---------------------------

class CLMSeqClsPipeline(Pipeline):
    def __init__(
        self, *args,
        drs_token="[/drs]",
        zero_token="0",
        one_token="1",
        strict_single_token=True,
        truncation=True,
        max_length=None,
        **kwargs
    ):
        super().__init__(*args, **kwargs)
        self.drs_token  = drs_token
        self.truncation = truncation
        self.max_length = max_length

        ids0 = self.tokenizer.encode(zero_token, add_special_tokens=False)
        ids1 = self.tokenizer.encode(one_token,  add_special_tokens=False)
        if strict_single_token and not (len(ids0) == 1 and len(ids1) == 1):
            raise ValueError(
                f"Expected single-token labels for {zero_token!r}/{one_token!r}. "
                f"Add dedicated tokens or disable strict_single_token."
            )
        self.ID0 = ids0[-1] if len(ids0) >= 1 else self.tokenizer.unk_token_id
        self.ID1 = ids1[-1] if len(ids1) >= 1 else self.tokenizer.unk_token_id

        drs_id = self.tokenizer.convert_tokens_to_ids(drs_token)
        if drs_id == self.tokenizer.unk_token_id:
            raise ValueError(
                f"{drs_token!r} not in tokenizer vocab. Add it (tokenizer.add_tokens(['{drs_token}'])) "
                "and resize embeddings before using this pipeline."
            )

    def _sanitize_parameters(self, **kwargs):
        return {}, {}, {}

    def preprocess(self, inputs):
        text = inputs.get("text", "") if isinstance(inputs, dict) else str(inputs)
        enc = self.tokenizer(
            text + self.drs_token,
            return_tensors="pt",
            padding=False,
            truncation=self.truncation,
            max_length=self.max_length,
            add_special_tokens=True,
        )
        return enc

    def _forward(self, model_inputs):
        if not hasattr(self.model, "hf_device_map"):
            model_inputs = {k: v.to(self.model.device) for k, v in model_inputs.items()}
        out = self.model.generate(
            **model_inputs,
            max_new_tokens=1,
            do_sample=False,
            return_dict_in_generate=True,
            output_scores=True,
            pad_token_id=self.tokenizer.pad_token_id,
            eos_token_id=self.tokenizer.eos_token_id
        )
        scores = out.scores[0]  # [B, V]
        return {"scores": scores}

    def postprocess(self, model_outputs):
        scores = model_outputs["scores"]             # [B, V]
        logits_2 = torch.stack([scores[:, self.ID0], scores[:, self.ID1]], dim=1)  # [B,2]
        top_ids = scores.argmax(dim=1)
        top_in_set = (top_ids == self.ID0) | (top_ids == self.ID1)
        return [
            {
                "logits": (float(logits_2[i, 0]), float(logits_2[i, 1])),
                "top_in_set": bool(top_in_set[i].item()),
            }
            for i in range(scores.shape[0])
        ]


# ---------------------------
# Classifiers (Seq-Cls & CLM→Seq-Cls) with a common API
# ---------------------------

class HFSeqClassifier:
    def __init__(self, settings: BaseAppSettings):
        tok = AutoTokenizer.from_pretrained(
            settings.model_id, use_fast=True, local_files_only=settings.local_files_only, trust_remote_code=settings.trust_remote_code
        )
        # Build adapter/full model for pipeline
        kwargs = model_kwargs_from_settings(settings, for_4bit_quant=settings.load_in_4bit)
        kwargs["device_map"] = settings.device_map
        model_for_pipeline, tok, _config, used_adapter = _build_model_and_tokenizer_for_pipeline(
            model_or_adapter_path=settings.model_id,
            base_model_path=settings.base_model_path,
            model_kwargs=kwargs,
            local_files_only=settings.local_files_only,
            trust_remote_code=settings.trust_remote_code,
        )
        log.info("Setting up text-classification pipeline (used_adapter=%s)", used_adapter)
        self.pipe = hf_pipeline(
            task="text-classification",
            model=model_for_pipeline,
            tokenizer=tok,
            model_kwargs=(kwargs if isinstance(model_for_pipeline, str) else {}),
        )
        self._tokenizer = tok

        # If no pad token, use eos (LLaMA-like)
        if self._tokenizer.pad_token_id is None and self._tokenizer.eos_token_id is not None:
            self._tokenizer.pad_token_id = self._tokenizer.eos_token_id
            self._tokenizer.pad_token = self._tokenizer.eos_token

    @limited_infer
    def predict(self, text: str, max_length: int) -> tuple[str, float]:
        """
        Returns (label, confidence) using top-1 from the HF pipeline.
        """
        out = self.pipe(text, truncation=True, max_length=max_length)
        # HF may return dict or [dict]; normalize
        item = out[0] if isinstance(out, list) else out
        return item["label"], float(item["score"])


class HFCLMSeqClsClassifier:
    """
    Causal LM used as a binary classifier via one-token generation ([/drs] + max_new_tokens=1),
    reducing full-vocab scores to {zero_token, one_token}.
    """
    def __init__(self, settings: BaseAppSettings):
        kwargs = model_kwargs_from_settings(settings, for_4bit_quant=settings.load_in_4bit)
        kwargs["device_map"] = settings.device_map

        model, tok, _config, used_adapter = _build_causal_model_and_tokenizer(
            model_or_adapter_path=settings.model_id,
            base_model_path=settings.base_model_path,
            model_kwargs=kwargs,
            local_files_only=settings.local_files_only,
            trust_remote_code=settings.trust_remote_code,
        )
        # LLaMA-like padding
        if tok.pad_token_id is None and tok.eos_token_id is not None:
            tok.pad_token_id = tok.eos_token_id
            tok.pad_token = tok.eos_token

        self.pipe = CLMSeqClsPipeline(
            model=model,
            tokenizer=tok,
            task="text-generation",  # label only
            drs_token=settings.drs_token,
            zero_token=settings.zero_token,
            one_token=settings.one_token,
            strict_single_token=settings.strict_single_token,
            truncation=True,
            max_length=settings.max_length,
        )
        self._zero = settings.zero_token
        self._one  = settings.one_token

        log.info("CLM→Seq-Cls pipeline ready (used_adapter=%s).", used_adapter)

    @limited_infer
    def predict(self, text: str, max_length: int) -> tuple[str, float]:
        out = self.pipe(text)  # returns [{"logits": (logit0, logit1), "top_in_set": bool}]
        item = out[0]
        logit0, logit1 = item["logits"]
        # Convert 2-class logits → probability for class 1
        a = np.array([logit0, logit1], dtype=np.float32)
        # softmax for stability
        e = np.exp(a - a.max())
        probs = e / e.sum()
        p1 = float(probs[1])

        label = self._one if p1 >= 0.5 else self._zero
        conf  = p1 if p1 >= 0.5 else float(1.0 - p1)
        return label, conf


# ---------------------------
# Factory
# ---------------------------

def _make_classifier(settings: BaseAppSettings):
    if settings.clm_for_seq_cls:
        return HFCLMSeqClsClassifier(settings)
    return HFSeqClassifier(settings)

def get_classifier(settings: BaseAppSettings) -> Union[HFSeqClassifier, HFCLMSeqClsClassifier]:
    """
    Public entrypoint for the API layer. Singleton-ized to reuse loaded weights.
    """
    return SingletonFactory(lambda: _make_classifier(settings))()
