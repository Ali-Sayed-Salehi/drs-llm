"""
FastAPI application for bug risk assessment using vLLM and Llama sequence classification.
"""

import os
import sys
import time
import logging
from typing import List
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Add the current directory to the path for imports
sys.path.append(os.path.dirname(__file__))

from models import (
    DiffRequest, 
    RiskAssessment, 
    HealthCheck, 
    BatchDiffRequest, 
    BatchRiskAssessment
)
from model_service import BugRiskModelService
from diff_processor import DiffProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables
model_service = None
diff_processor = DiffProcessor()

# Configuration
MODEL_PATH = os.getenv("MODEL_PATH", "/path/to/your/llama/model")  # Set your model path
MAX_MODEL_LEN = int(os.getenv("MAX_MODEL_LEN", "4096"))
API_VERSION = "1.0.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan"""
    # Startup
    global model_service
    logger.info("🚀 Starting Bug Risk Assessment API...")
    
    try:
        # Initialize model service
        model_service = BugRiskModelService(MODEL_PATH, MAX_MODEL_LEN)
        logger.info("✅ Model service initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize model service: {e}")
        model_service = None
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Bug Risk Assessment API...")
    if model_service:
        del model_service


# Create FastAPI app
app = FastAPI(
    title="Bug Risk Assessment API",
    description="API for assessing bug risk in code diffs using Llama sequence classification",
    version=API_VERSION,
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure as needed for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_model=dict)
async def root():
    """Root endpoint"""
    return {
        "message": "Bug Risk Assessment API",
        "version": API_VERSION,
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint"""
    if not model_service:
        return HealthCheck(
            status="unhealthy",
            model_loaded=False,
            model_name=None,
            version=API_VERSION
        )
    
    model_info = model_service.get_model_info()
    return HealthCheck(
        status="healthy" if model_service.health_check() else "unhealthy",
        model_loaded=model_service.health_check(),
        model_name=model_info.get("model_path"),
        version=API_VERSION
    )


@app.post("/assess-risk", response_model=RiskAssessment)
async def assess_risk(request: DiffRequest):
    """
    Assess the risk of a bug in a single diff
    
    Args:
        request: DiffRequest containing the raw diff to analyze
        
    Returns:
        RiskAssessment with risk score and analysis
    """
    if not model_service:
        raise HTTPException(status_code=503, detail="Model service not available")
    
    try:
        # Validate diff format
        if not diff_processor.validate_diff(request.raw_diff):
            raise HTTPException(status_code=400, detail="Invalid diff format")
        
        # Assess risk
        result = model_service.assess_risk(request.raw_diff, request.file_path)
        
        # Convert to response model
        return RiskAssessment(
            risk_score=result["risk_score"],
            confidence=result["confidence"],
            structured_diff=result["structured_diff"],
            risk_level=result["risk_level"],
            explanation=f"Risk assessment completed in {result['processing_time']:.3f}s"
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in assess_risk: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/assess-risk-batch", response_model=BatchRiskAssessment)
async def assess_risk_batch(request: BatchDiffRequest):
    """
    Assess the risk of bugs in multiple diffs (batch processing)
    
    Args:
        request: BatchDiffRequest containing multiple diffs to analyze
        
    Returns:
        BatchRiskAssessment with results for all diffs
    """
    if not model_service:
        raise HTTPException(status_code=503, detail="Model service not available")
    
    if not request.diffs:
        raise HTTPException(status_code=400, detail="No diffs provided")
    
    if len(request.diffs) > 10:  # Limit batch size
        raise HTTPException(status_code=400, detail="Batch size too large (max 10)")
    
    start_time = time.time()
    
    try:
        # Extract diffs and file paths
        diffs = [diff.raw_diff for diff in request.diffs]
        file_paths = [diff.file_path for diff in request.diffs]
        
        # Validate all diffs
        for i, diff in enumerate(diffs):
            if not diff_processor.validate_diff(diff):
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid diff format at index {i}"
                )
        
        # Batch assess risk
        results = model_service.batch_assess_risk(diffs, file_paths)
        
        # Convert to response models
        assessments = []
        for result in results:
            if "error" in result:
                # Handle error case
                assessments.append(RiskAssessment(
                    risk_score=0.0,
                    confidence=0.0,
                    structured_diff="",
                    risk_level="Error",
                    explanation=f"Error: {result['error']}"
                ))
            else:
                assessments.append(RiskAssessment(
                    risk_score=result["risk_score"],
                    confidence=result["confidence"],
                    structured_diff=result["structured_diff"],
                    risk_level=result["risk_level"],
                    explanation=f"Risk assessment completed in {result['processing_time']:.3f}s"
                ))
        
        processing_time = time.time() - start_time
        
        return BatchRiskAssessment(
            assessments=assessments,
            total_processed=len(assessments),
            processing_time=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in assess_risk_batch: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/model-info")
async def get_model_info():
    """Get information about the loaded model"""
    if not model_service:
        raise HTTPException(status_code=503, detail="Model service not available")
    
    return model_service.get_model_info()


@app.post("/validate-diff")
async def validate_diff(request: DiffRequest):
    """
    Validate a diff format without running risk assessment
    
    Args:
        request: DiffRequest containing the diff to validate
        
    Returns:
        Validation result
    """
    try:
        is_valid = diff_processor.validate_diff(request.raw_diff)
        file_info = diff_processor.extract_file_info(request.raw_diff) if is_valid else {}
        
        return {
            "is_valid": is_valid,
            "file_info": file_info,
            "message": "Diff is valid" if is_valid else "Invalid diff format"
        }
        
    except Exception as e:
        logger.error(f"Error in validate_diff: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


if __name__ == "__main__":
    # Check if model path is set
    if MODEL_PATH == "/path/to/your/llama/model":
        logger.error("❌ Please set MODEL_PATH environment variable to your local Llama model path")
        logger.error("Example: export MODEL_PATH=/path/to/your/finetuned/llama/model")
        sys.exit(1)
    
    # Run the API
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Set to True for development
        log_level="info"
    )
