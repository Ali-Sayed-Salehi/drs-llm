# github_client.py
import logging
from typing import Tuple
import requests
from .settings import settings
from fastapi import HTTPException, status

log = logging.getLogger(__name__)

def _session() -> requests.Session:
    s = requests.Session()
    # Base headers for JSON calls
    s.headers.update({
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "drs-llm-api/0.1.0"
    })
    if settings.github_token:
        s.headers["Authorization"] = f"Bearer {settings.github_token}"
    return s

def _split_repo(full: str) -> Tuple[str, str]:
    if "/" not in full:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="repo must be in the form 'owner/repo'"
        )
    owner, repo = full.split("/", 1)
    return owner, repo

def fetch_commit_message_and_diff(repo_full: str, sha: str) -> Tuple[str, str]:
    """
    Returns (commit_message, unified_diff)
    """
    owner, repo = _split_repo(repo_full)
    url = f"{settings.github_api_base}/repos/{owner}/{repo}/commits/{sha}"
    timeout = settings.github_timeout_s

    with _session() as s:
        # 1) JSON for message
        r1 = s.get(url, timeout=timeout)
        if r1.status_code == 404:
            raise HTTPException(status_code=404, detail="Commit not found (check repo/sha visibility and token)")
        if not r1.ok:
            log.error("GitHub JSON error %s: %s", r1.status_code, r1.text[:500])
            raise HTTPException(status_code=502, detail="Failed to fetch commit JSON from GitHub")

        data = r1.json()
        # GitHub returns message under data["commit"]["message"]
        try:
            message = data["commit"]["message"]
        except Exception:
            raise HTTPException(status_code=502, detail="Commit JSON missing 'commit.message'")

        # 2) Diff for unified patch (same endpoint; different Accept header)
        # NOTE: This is a unified diff suitable for your diff parser
        r2 = s.get(url, headers={"Accept": "application/vnd.github.v3.diff"}, timeout=timeout)
        if not r2.ok:
            log.error("GitHub Diff error %s: %s", r2.status_code, r2.text[:500])
            raise HTTPException(status_code=502, detail="Failed to fetch commit diff from GitHub")
        diff_text = r2.text

    return message, diff_text
