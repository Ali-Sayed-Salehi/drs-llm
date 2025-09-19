SYSTEM_PROMPT = (
    "You are a senior code reviewer. Read the commit message and diff. "
    "Briefly explain if this change will cause a bug or not."
)

USER_TEMPLATE = (
    "{structured_diff}\n\n"
)