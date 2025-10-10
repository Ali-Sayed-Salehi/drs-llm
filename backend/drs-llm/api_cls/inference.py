# /drs-llm/api_cls/inference.py

from .model_hf import get_classifier
from .settings import settings
from .utils import diff_to_structured_xml

import textwrap

import logging
log = logging.getLogger(__name__)

def build_text(commit_message: str, code_diff: str, clm_for_seqcls: bool = False) -> str:
    structured_diff = diff_to_structured_xml(code_diff)
    lines = [
        "<COMMIT_MESSAGE>",
        commit_message,
        "</COMMIT_MESSAGE>",
        structured_diff,
    ]
    diff = "\n".join(lines).strip()

    if clm_for_seqcls:
        system_prompt = textwrap.dedent("""\
                Consider the code changes and commit messages, 
                Is this commit likely to cause a bug? If the commit is risky give 1. If not give 0. 
                Give a single digit and nothing more, only 0 or 1.
            """)
        
        lines = [
            system_prompt,
            "[drs]",
            diff
        ]

        return "\n".join(lines).strip()
    
    return diff
    

def score_commit(commit_message: str, code_diff: str):
    text = build_text(commit_message, code_diff, clm_for_seqcls=getattr(settings, "clm_for_seq_cls", False))

    clf = get_classifier(settings)
    raw_label, confidence = clf.predict(text, settings.max_length)

    # Normalize to NEGATIVE/POSITIVE
    s = str(raw_label).strip().upper()
    if s in {"0", "LABEL_0", "NEGATIVE"}:
        norm = "NEGATIVE"
    elif s in {"1", "LABEL_1", "POSITIVE"}:
        norm = "POSITIVE"
    else:
        try:
            norm = "POSITIVE" if int(s) == 1 else "NEGATIVE"
        except Exception:
            norm = raw_label  # unknown label; return as-is

    return norm, confidence

