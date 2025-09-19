from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class PredictRequest(BaseModel):
    commit_message: str = Field(...)
    code_diff: str = Field(...)

class PredictBySHARequest(BaseModel):
    repo: str = Field(..., example="octocat/Hello-World")
    sha: str = Field(..., example="f9c2a5d...")
