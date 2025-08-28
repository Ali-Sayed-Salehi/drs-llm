from pydantic import BaseModel, Field

class PredictRequest(BaseModel):
    commit_message: str = Field(...)
    code_diff: str = Field(...)

class PredictResponse(BaseModel):
    label: str = Field(...)
    bug_probability: float = Field(..., ge=0.0, le=1.0)