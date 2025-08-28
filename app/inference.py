from .model_hf import get_classifier
from .settings import settings
from .utils import *

def build_text(commit_message: str, code_diff: str) -> str:
    structured_diff = diff_to_structured_xml(code_diff)
    lines = [
        "<COMMIT_MESSAGE>",
        commit_message
        "</COMMIT_MESSAGE>",
        structured_diff,
    ]
    text = "\n".join(lines)

    return text.strip()

def score_commit(commit_message: str, code_diff: str):
    text = build_text(commit_message, code_diff)
    clf = get_classifier()
    label, bug_prob = clf.predict(text, settings.max_length)
    return label, bug_prob
