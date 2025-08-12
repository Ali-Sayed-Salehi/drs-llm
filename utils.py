import re
import os
import pandas as pd

REPO_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def diff_to_structured_xml(diff_string):
    """
    Converts a multi-file unified diff string into structured XML-like diff format,
    including full file additions, deletions, renames, and binary file changes.
    """
    lines = diff_string.strip().splitlines()
    output = []

    current_file = None
    current_block_type = None
    current_block_lines = []
    old_line = None
    new_line = None

    is_file_added = False
    is_file_deleted = False
    in_hunk = False
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
            output.append(f"</FILE>")

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
            match = re.match(r'diff --git a/(.+?) b/(.+)', line)
            if match:
                current_file = match.group(2)
                output.append(f'<FILE name="{current_file}">')

        elif line.startswith("rename from "):
            rename_from = line[len("rename from "):].strip()
            pending_rename = True

        elif line.startswith("rename to "):
            rename_to = line[len("rename to "):].strip()
            # We'll print this after both rename_from and rename_to are known
            if not current_file:
                current_file = rename_to
                output.append(f'<FILE name="{current_file}">')

        elif line.startswith("--- "):
            if line.strip() == "--- /dev/null":
                is_file_added = True

        elif line.startswith("+++ "):
            if line.strip() == "+++ /dev/null":
                is_file_deleted = True

        elif line.startswith("index "):
            if "0000000000000000000000000000000000000000" in line:
                if is_file_added:
                    pending_binary_status = "added"
                elif is_file_deleted:
                    pending_binary_status = "removed"
                else:
                    pending_binary_status = "changed"

        elif line.startswith("Binary files "):
            flush_block()
            match = re.match(r'Binary files (.+) and (.+) differ', line)
            if match:
                left = match.group(1).strip()
                right = match.group(2).strip()
                if left == '/dev/null':
                    pending_binary_status = "added"
                elif right == '/dev/null':
                    pending_binary_status = "removed"
                else:
                    pending_binary_status = "changed"
            flush_file()

        elif line.startswith("GIT binary patch"):
            flush_block()
            in_git_binary_patch = True
            continue

        elif in_git_binary_patch:
            if line.strip() == "":
                continue
            if pending_binary_status is None:
                if is_file_added:
                    pending_binary_status = "added"
                elif is_file_deleted:
                    pending_binary_status = "removed"
                else:
                    pending_binary_status = "changed"

        elif line.startswith("@@"):
            flush_block()
            in_hunk = True
            parts = line.split()
            try:
                old_line = int(parts[1].split(',')[0][1:])
                new_line = int(parts[2].split(',')[0][1:])
            except (IndexError, ValueError):
                old_line = new_line = None

        elif line.startswith("-"):
            if not in_hunk and not is_file_deleted:
                continue
            if current_block_type != "REMOVED":
                flush_block()
                current_block_type = "REMOVED"
            current_block_lines.append(line[1:].rstrip())
            if old_line is not None:
                old_line += 1

        elif line.startswith("+"):
            if not in_hunk and not is_file_added:
                continue
            if current_block_type != "ADDED":
                flush_block()
                current_block_type = "ADDED"
            current_block_lines.append(line[1:].rstrip())
            if new_line is not None:
                new_line += 1

        else:
            flush_block()

    flush_file()
    return "\n".join(output)




def main():

    input_data_path = os.path.join(REPO_PATH, "datasets", "mozilla_perf", "perf_bugs_with_diff.jsonl")
    bugs_with_diff_df = pd.read_json(input_data_path, lines=True)
    bugs_list = bugs_with_diff_df.to_dict(orient='records')

    diff_content = bugs_list[160].get('raw_diff')

    with open("raw_output.txt", "w", encoding="utf-8") as f:
        f.write(diff_content)

    structured_output = diff_to_structured_xml(diff_content)
    
    with open("xml_output.xml", "w", encoding="utf-8") as f:
        f.write(structured_output)

if __name__ == "__main__":
    main()
