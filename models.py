from pydantic import BaseModel, Field
from typing import Optional, List


class DiffRequest(BaseModel):
    """Request model for diff analysis"""
    raw_diff: str = Field(..., description="Raw git diff string to analyze")
    file_path: Optional[str] = Field(None, description="Optional file path for context")


class RiskAssessment(BaseModel):
    """Response model for risk assessment"""
    risk_score: float = Field(..., description="Risk score as percentage (0-100)")
    confidence: float = Field(..., description="Model confidence in the prediction (0-1)")
    structured_diff: str = Field(..., description="Structured XML format of the diff")
    risk_level: str = Field(..., description="Categorical risk level (Low/Medium/High/Critical)")
    explanation: Optional[str] = Field(None, description="Optional explanation of the risk assessment")


class HealthCheck(BaseModel):
    """Health check response model"""
    status: str = Field(..., description="Service status")
    model_loaded: bool = Field(..., description="Whether the model is loaded and ready")
    model_name: Optional[str] = Field(None, description="Name of the loaded model")
    version: str = Field(..., description="API version")


class BatchDiffRequest(BaseModel):
    """Request model for batch diff analysis"""
    diffs: List[DiffRequest] = Field(..., description="List of diffs to analyze")


class BatchRiskAssessment(BaseModel):
    """Response model for batch risk assessment"""
    assessments: List[RiskAssessment] = Field(..., description="List of risk assessments")
    total_processed: int = Field(..., description="Total number of diffs processed")
    processing_time: float = Field(..., description="Total processing time in seconds")
