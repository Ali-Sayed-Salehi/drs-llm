from pydantic import BaseModel, Field

class PredictRequest(BaseModel):
    commit_message: str = Field(...)
    code_diff: str = Field(...)

class PredictResponse(BaseModel):
    label: str = Field(...)
    confidence: float = Field(..., ge=0.0, le=1.0)