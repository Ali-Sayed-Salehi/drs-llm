"""
Model service for bug risk assessment using vLLM and Llama sequence classification.
"""

import os
import sys
import time
import logging
from typing import Dict, Any, List, Optional, Tuple
import torch
import numpy as np

# Add the llama directory to the path to import sequence classification utilities
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "llama"))

try:
    from vllm import LLM, SamplingParams
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
except ImportError as e:
    logging.error(f"Failed to import required libraries: {e}")
    logging.error("Please install vLLM and transformers: pip install vllm transformers")

from diff_processor import DiffProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BugRiskModelService:
    """Service for serving the bug risk assessment model using vLLM"""
    
    def __init__(self, model_path: str, max_model_len: int = 4096):
        """
        Initialize the model service
        
        Args:
            model_path: Path to the local Llama sequence classification model
            max_model_len: Maximum sequence length for the model
        """
        self.model_path = model_path
        self.max_model_len = max_model_len
        self.model = None
        self.tokenizer = None
        self.diff_processor = DiffProcessor()
        self.is_initialized = False
        
        # Risk level thresholds
        self.risk_thresholds = {
            "Low": 25.0,
            "Medium": 50.0,
            "High": 75.0,
            "Critical": 100.0
        }
        
        logger.info(f"Initializing BugRiskModelService with model: {model_path}")
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the vLLM model and tokenizer"""
        try:
            # Initialize vLLM model
            self.model = LLM(
                model=self.model_path,
                trust_remote_code=True,
                max_model_len=self.max_model_len,
                gpu_memory_utilization=0.9,
                tensor_parallel_size=1,  # Adjust based on your GPU setup
                dtype="bfloat16"  # Adjust based on your model and GPU
            )
            
            # Load tokenizer separately for preprocessing
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_path,
                trust_remote_code=True
            )
            
            # Set padding token if not present
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            self.is_initialized = True
            logger.info("✅ Model and tokenizer initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize model: {e}")
            raise RuntimeError(f"Model initialization failed: {e}")
    
    def _preprocess_diff(self, raw_diff: str) -> str:
        """
        Preprocess the diff for model input
        
        Args:
            raw_diff: Raw git diff string
            
        Returns:
            Preprocessed diff string
        """
        # Convert to structured format
        structured_diff = self.diff_processor.process_diff(raw_diff)
        
        # Truncate if too long (leave room for special tokens)
        max_tokens = self.max_model_len - 10
        if len(structured_diff) > max_tokens * 4:  # Rough estimate: 4 chars per token
            structured_diff = structured_diff[:max_tokens * 4] + "..."
        
        return structured_diff
    
    def _postprocess_output(self, model_output: str) -> Tuple[float, float]:
        """
        Postprocess model output to extract risk score and confidence
        
        Args:
            model_output: Raw model output string
            
        Returns:
            Tuple of (risk_score, confidence)
        """
        try:
            # Try to extract numerical values from the output
            # This assumes the model outputs a risk score between 0-100
            import re
            
            # Look for percentage or decimal numbers
            numbers = re.findall(r'(\d+(?:\.\d+)?)', model_output)
            
            if numbers:
                # Convert to float and ensure it's in valid range
                risk_score = float(numbers[0])
                risk_score = max(0.0, min(100.0, risk_score))
                
                # For now, use a simple confidence based on output quality
                # In a real implementation, you might want the model to output confidence
                confidence = 0.8 if len(model_output.strip()) > 10 else 0.5
                
                return risk_score, confidence
            else:
                # Fallback: parse text-based output
                risk_score = self._parse_text_risk(model_output)
                confidence = 0.6
                return risk_score, confidence
                
        except Exception as e:
            logger.warning(f"Failed to parse model output: {e}")
            # Return default values
            return 50.0, 0.5
    
    def _parse_text_risk(self, text: str) -> float:
        """
        Parse text-based risk assessment
        
        Args:
            text: Model output text
            
        Returns:
            Risk score as float
        """
        text_lower = text.lower()
        
        if any(word in text_lower for word in ["low", "minimal", "safe"]):
            return 25.0
        elif any(word in text_lower for word in ["medium", "moderate", "some"]):
            return 50.0
        elif any(word in text_lower for word in ["high", "significant", "risky"]):
            return 75.0
        elif any(word in text_lower for word in ["critical", "severe", "dangerous"]):
            return 90.0
        else:
            return 50.0
    
    def _get_risk_level(self, risk_score: float) -> str:
        """
        Convert numerical risk score to categorical level
        
        Args:
            risk_score: Risk score (0-100)
            
        Returns:
            Risk level string
        """
        if risk_score <= self.risk_thresholds["Low"]:
            return "Low"
        elif risk_score <= self.risk_thresholds["Medium"]:
            return "Medium"
        elif risk_score <= self.risk_thresholds["High"]:
            return "High"
        else:
            return "Critical"
    
    def assess_risk(self, raw_diff: str, file_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Assess the risk of a bug in the given diff
        
        Args:
            raw_diff: Raw git diff string
            file_path: Optional file path for context
            
        Returns:
            Dictionary containing risk assessment results
        """
        if not self.is_initialized:
            raise RuntimeError("Model not initialized")
        
        start_time = time.time()
        
        try:
            # Validate input
            if not self.diff_processor.validate_diff(raw_diff):
                raise ValueError("Invalid diff format")
            
            # Preprocess diff
            structured_diff = self._preprocess_diff(raw_diff)
            
            # Prepare input for the model
            # Format: "Analyze this code diff for potential bugs and provide a risk score (0-100):\n\n{diff}"
            prompt = f"Analyze this code diff for potential bugs and provide a risk score (0-100):\n\n{structured_diff}"
            
            # Generate response using vLLM
            sampling_params = SamplingParams(
                temperature=0.1,  # Low temperature for more deterministic output
                max_tokens=100,
                top_p=0.9,
                stop=["\n\n", "---", "```"]
            )
            
            outputs = self.model.generate([prompt], sampling_params)
            model_output = outputs[0].outputs[0].text.strip()
            
            # Postprocess output
            risk_score, confidence = self._postprocess_output(model_output)
            risk_level = self._get_risk_level(risk_score)
            
            processing_time = time.time() - start_time
            
            result = {
                "risk_score": risk_score,
                "confidence": confidence,
                "structured_diff": structured_diff,
                "risk_level": risk_level,
                "processing_time": processing_time,
                "model_output": model_output
            }
            
            logger.info(f"Risk assessment completed: {risk_score:.1f}% ({risk_level}) in {processing_time:.3f}s")
            return result
            
        except Exception as e:
            logger.error(f"Error during risk assessment: {e}")
            raise RuntimeError(f"Risk assessment failed: {e}")
    
    def batch_assess_risk(self, diffs: List[str], file_paths: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Assess risk for multiple diffs in batch
        
        Args:
            diffs: List of raw git diff strings
            file_paths: Optional list of file paths
            
        Returns:
            List of risk assessment results
        """
        if not self.is_initialized:
            raise RuntimeError("Model not initialized")
        
        if file_paths is None:
            file_paths = [None] * len(diffs)
        
        if len(diffs) != len(file_paths):
            raise ValueError("Number of diffs must match number of file paths")
        
        results = []
        for i, (diff, file_path) in enumerate(zip(diffs, file_paths)):
            try:
                result = self.assess_risk(diff, file_path)
                results.append(result)
            except Exception as e:
                logger.error(f"Failed to assess diff {i}: {e}")
                # Add error result
                results.append({
                    "risk_score": 0.0,
                    "confidence": 0.0,
                    "structured_diff": "",
                    "risk_level": "Error",
                    "processing_time": 0.0,
                    "error": str(e)
                })
        
        return results
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model"""
        return {
            "model_path": self.model_path,
            "is_initialized": self.is_initialized,
            "max_model_len": self.max_model_len,
            "model_type": "Llama Sequence Classification",
            "framework": "vLLM"
        }
    
    def health_check(self) -> bool:
        """Check if the model service is healthy"""
        return self.is_initialized and self.model is not None
