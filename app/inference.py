from .model_hf import get_classifier
from .settings import settings

def build_text(commit_message: str, code_diff: str) -> str:
    return commit_message.strip() + "\n\n" + code_diff.strip()

def score_commit(commit_message: str, code_diff: str):
    text = build_text(commit_message, code_diff)
    clf = get_classifier()
    label, bug_prob = clf.predict(text, settings.max_length)
    return label, prob
