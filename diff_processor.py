"""
Diff processing module that converts raw git diffs to structured format
using the existing utils.py from data_extraction.
"""

import sys
import os
from typing import Dict, Any

# Add the data_extraction directory to the path to import utils
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "data_extraction"))

from utils import diff_to_structured_xml


class DiffProcessor:
    """Processes raw git diffs into structured format"""
    
    def __init__(self):
        """Initialize the diff processor"""
        pass
    
    def process_diff(self, raw_diff: str) -> str:
        """
        Convert a raw git diff to structured XML format
        
        Args:
            raw_diff: Raw git diff string
            
        Returns:
            Structured XML representation of the diff
        """
        try:
            structured_diff = diff_to_structured_xml(raw_diff)
            return structured_diff
        except Exception as e:
            raise ValueError(f"Failed to process diff: {str(e)}")
    
    def validate_diff(self, raw_diff: str) -> bool:
        """
        Validate that the input is a valid git diff
        
        Args:
            raw_diff: Raw git diff string to validate
            
        Returns:
            True if valid, False otherwise
        """
        if not raw_diff or not isinstance(raw_diff, str):
            return False
        
        # Basic validation - check for common git diff patterns
        lines = raw_diff.strip().splitlines()
        if not lines:
            return False
            
        # Check for git diff header
        if not any(line.startswith("diff --git") for line in lines[:10]):
            return False
            
        return True
    
    def extract_file_info(self, raw_diff: str) -> Dict[str, Any]:
        """
        Extract basic file information from a diff
        
        Args:
            raw_diff: Raw git diff string
            
        Returns:
            Dictionary containing file information
        """
        if not self.validate_diff(raw_diff):
            return {}
            
        lines = raw_diff.strip().splitlines()
        file_info = {
            "files_changed": [],
            "additions": 0,
            "deletions": 0,
            "is_binary": False
        }
        
        current_file = None
        for line in lines:
            if line.startswith("diff --git"):
                match = re.match(r'diff --git a/(.+?) b/(.+)', line)
                if match:
                    current_file = match.group(2)
                    file_info["files_changed"].append(current_file)
            elif line.startswith("Binary files"):
                file_info["is_binary"] = True
            elif line.startswith("+"):
                file_info["additions"] += 1
            elif line.startswith("-"):
                file_info["deletions"] += 1
                
        return file_info


# Import re at the top level for the regex operations
import re
