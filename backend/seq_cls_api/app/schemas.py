# schemas.py
from pydantic import BaseModel, Field

class PredictRequest(BaseModel):
    commit_message: str = Field(...)
    code_diff: str = Field(...)

class PredictBySHARequest(BaseModel):
    # Accept either "owner/repo" or owner + repo; simplest is one string.
    repo: str = Field(..., example="octocat/Hello-World")
    sha: str = Field(..., example="f9c2a5d...")

class PredictResponse(BaseModel):
    label: str = Field(...)
    confidence: float = Field(..., ge=0.0, le=1.0)
