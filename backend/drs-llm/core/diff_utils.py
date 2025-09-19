# app/utils.py

import re
from typing import List, Tuple, Optional

HUNK_RE = re.compile(r'^@@ -(?P<ol>\d+)(?:,(?P<oc>\d+))? \+(?P<nl>\d+)(?:,(?P<nc>\d+))? @@')

def clean_commit_message(raw_message: str) -> str:
    """
    Normalize/clean a commit message:
      - Remove common JIRA-style prefixes (e.g., "ABC-123: ..." or "[ABC-123] ...").
      - Replace ticket references (JIRA, #123) with 'some ticket'.
      - Strip HTML-like tags.
      - Collapse whitespace and blank lines.
    """
    if not raw_message:
        return ""

    lines = raw_message.splitlines()
    # Drop svn noise and blanks; trim spaces
    lines = [ln.strip() for ln in lines if ln.strip() and not ln.strip().startswith("git-svn-id:")]

    cleaned: List[str] = []
    for line in lines:
        # Drop leading ticket prefix like "[ABC-123]; ", "ABC-123 ", etc.
        line = re.sub(r"^(\[?[A-Z]+-\d+\]?;?\s*)", "", line)
        # Replace inline ticket references
        line = re.sub(r"\[[A-Z]+-\d+\]", "some ticket", line)
        line = re.sub(r"#\d+", "some ticket", line)
        line = re.sub(r"\b[A-Z]+-\d+\b", "some ticket", line)
        # Strip HTML-ish tags
        line = re.sub(r"<[^>]+>", "", line)
        cleaned.append(line.strip())

    return " ".join(cleaned).strip()


def validate_unified_diff(diff_string: str) -> Tuple[bool, List[str]]:
    """
    Validate that a diff looks like a unified diff with hunk headers.
    Returns (ok, issues).
    """
    issues = []
    lines = diff_string.strip().splitlines()

    if not lines:
        return False, ["Empty diff input."]

    seen_any_file = False
    in_file = False
    in_hunk = False
    saw_change_in_current_file = False
    file_allows_no_hunks = False  # e.g., pure rename or binary change
    current_file = None

    def end_file():
        nonlocal in_file, in_hunk, saw_change_in_current_file, file_allows_no_hunks, current_file
        if in_file and not (saw_change_in_current_file or file_allows_no_hunks):
            issues.append(f"File '{current_file or '?'}' has no hunks and no binary/rename indication.")
        in_file = False
        in_hunk = False
        saw_change_in_current_file = False
        file_allows_no_hunks = False
        current_file = None

    for i, line in enumerate(lines, 1):
        if line.startswith("diff --git "):
            # Close previous file block (if any)
            end_file()
            seen_any_file = True
            in_file = True
            in_hunk = False
            saw_change_in_current_file = False
            file_allows_no_hunks = False
            # Try to capture filename (best-effort)
            m = re.match(r'diff --git a/(.+?) b/(.+)', line)
            if m:
                current_file = m.group(2)
            continue

        if line.startswith("rename from "):
            in_file = True
            file_allows_no_hunks = True
            continue
        if line.startswith("rename to "):
            in_file = True
            file_allows_no_hunks = True
            continue

        if line.startswith("Binary files "):
            in_file = True
            file_allows_no_hunks = True
            continue

        if line.startswith("--- "):
            in_file = True
            continue
        if line.startswith("+++ "):
            in_file = True
            continue

        if line.startswith("@@"):
            if not in_file:
                issues.append(f"Line {i}: hunk header outside of a file section.")
            else:
                if not HUNK_RE.match(line):
                    issues.append(f"Line {i}: malformed hunk header: '{line}'")
                in_hunk = True
            continue

        if line.startswith("+") or line.startswith("-"):
            if not in_hunk:
                # Some generators omit context but must still include a hunk header
                issues.append(f"Line {i}: change line outside any hunk: '{line[:80]}'")
            else:
                saw_change_in_current_file = True
            continue

        # Blank or context lines inside a hunk are OK; outside they're neutral
        if line.startswith(" ") and not in_hunk and in_file:
            # Context outside hunk is odd but not fatal; ignore.
            continue

    # Close last file if any
    end_file()

    if not seen_any_file:
        # Accept diffs that only use ---/+++ without diff --git
        if not any(l.startswith("--- ") for l in lines) or not any(l.startswith("+++ ") for l in lines):
            issues.append("No file sections detected (missing 'diff --git' and '---/+++' headers).")

    return (len(issues) == 0), issues


def diff_to_structured_xml(diff_string: str,
                           commit_message: Optional[str] = None,
                           *,
                           strict: bool = True) -> str:
    """
    Converts a multi-file unified diff string + optional commit message into structured XML-like format.

    - Requires proper unified diff hunks (@@ ... @@) unless the change is a rename/binary.
    - When strict=True, raises ValueError on malformed inputs (recommended).
      When strict=False, emits issues at the top of the output inside <WARN>.
    - If commit_message is provided, it is cleaned and emitted as <COMMIT_MESSAGE>...</COMMIT_MESSAGE>
      at the top of the output.
    """
    ok, issues = validate_unified_diff(diff_string)
    if strict and not ok:
        raise ValueError("Malformed diff:\n- " + "\n- ".join(issues))

    lines = diff_string.strip().splitlines()
    output: List[str] = []

    # 1) Commit message, if any
    if commit_message is not None:
        output.append(f"<COMMIT_MESSAGE>{clean_commit_message(commit_message)}</COMMIT_MESSAGE>\n")

    # 2) Warnings (non-strict mode)
    if not ok and not strict:
        output.append("<WARN>")
        output.extend(f"  {msg}" for msg in issues)
        output.append("</WARN>")

    # 3) Per-file parsing (unchanged logic with light refactors)
    current_file = None
    current_block_type = None
    current_block_lines: List[str] = []
    in_hunk = False
    is_file_added = False
    is_file_deleted = False
    in_git_binary_patch = False
    pending_binary_status = None
    rename_from = None
    rename_to = None
    pending_rename = False

    def flush_block():
        nonlocal current_block_type, current_block_lines
        if current_block_type and current_block_lines:
            output.append(f"  <{current_block_type.upper()}>")
            for l in current_block_lines:
                output.append(f"      {l}")
            output.append(f"  </{current_block_type.upper()}>")
        current_block_type = None
        current_block_lines = []

    def flush_file():
        nonlocal current_file, is_file_added, is_file_deleted, in_hunk
        nonlocal in_git_binary_patch, pending_binary_status
        nonlocal rename_from, rename_to, pending_rename
        if current_file:
            flush_block()
            if pending_rename and rename_from and rename_to:
                output.append(f"  File renamed from {rename_from}.")
            elif pending_binary_status:
                output.append(f"  Binary file {pending_binary_status}.")
            output.append("</FILE>\n")
        # reset state
        current_file = None
        is_file_added = False
        is_file_deleted = False
        in_hunk = False
        in_git_binary_patch = False
        pending_binary_status = None
        rename_from = None
        rename_to = None
        pending_rename = False

    for line in lines:
        if line.startswith("diff --git"):
            flush_file()
            m = re.match(r'diff --git a/(.+?) b/(.+)', line)
            if m:
                current_file = m.group(2)
            else:
                current_file = None
            output.append("<FILE>")
            output.append(f"  {current_file or '?'}")
            continue

        if line.startswith("rename from "):
            rename_from = line[len("rename from "):].strip()
            pending_rename = True
            continue

        if line.startswith("rename to "):
            rename_to = line[len("rename to "):].strip()
            pending_rename = True
            if not current_file:
                current_file = rename_to
                output.append("<FILE>")
                output.append(f"  {current_file}")
            continue

        if line.startswith("--- "):
            if line.strip() == "--- /dev/null":
                is_file_added = True
            continue

        if line.startswith("+++ "):
            if line.strip() == "+++ /dev/null":
                is_file_deleted = True
            continue

        if line.startswith("Binary files "):
            flush_block()
            # Mark as a binary change; actual status resolved below
            left_right = re.match(r'Binary files (.+) and (.+) differ', line)
            if left_right:
                left = left_right.group(1).strip()
                right = left_right.group(2).strip()
                if left == '/dev/null':
                    pending_binary_status = "added"
                elif right == '/dev/null':
                    pending_binary_status = "removed"
                else:
                    pending_binary_status = "changed"
            flush_file()
            continue

        if line.startswith("GIT binary patch"):
            flush_block()
            in_git_binary_patch = True
            continue

        if in_git_binary_patch:
            # Ignore patch contents; the status was already set from headers
            continue

        if line.startswith("@@"):
            flush_block()
            in_hunk = True
            # we already validated the header; no need to parse numbers unless you want to track line numbers
            continue

        if line.startswith("-"):
            if not in_hunk and not is_file_deleted:
                # With strict validation, we wouldn't be here; still, ignore politely
                continue
            if current_block_type != "REMOVED":
                flush_block()
                current_block_type = "REMOVED"
            current_block_lines.append(line[1:].rstrip())
            continue

        if line.startswith("+"):
            if not in_hunk and not is_file_added:
                continue
            if current_block_type != "ADDED":
                flush_block()
                current_block_type = "ADDED"
            current_block_lines.append(line[1:].rstrip())
            continue

        # Context or blank lines:
        if in_hunk and (line.startswith(" ") or line == ""):
            # We ignore context lines to keep blocks lean; add them if you want
            continue

        # Any other line: end current block but keep within file
        flush_block()

    flush_file()
    return "\n".join(output)
