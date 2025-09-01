#!/usr/bin/env python3
"""
Test script for DRS-LLM logging functionality.
Run this script to verify that logging is working correctly.
"""

import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_basic_logging():
    """Test basic logging functionality"""
    print("Testing basic logging...")
    
    try:
        from app.logging_config import get_logger, app_logger, model_logger, inference_logger, api_logger
        
        # Test getting loggers
        logger = get_logger("test.basic")
        logger.info("Basic logging test - INFO level")
        logger.debug("Basic logging test - DEBUG level")
        logger.warning("Basic logging test - WARNING level")
        logger.error("Basic logging test - ERROR level")
        
        # Test default loggers
        app_logger.info("App logger test")
        model_logger.info("Model logger test")
        inference_logger.info("Inference logger test")
        api_logger.info("API logger test")
        
        print("✓ Basic logging test passed")
        return True
        
    except Exception as e:
        print(f"✗ Basic logging test failed: {e}")
        return False

def test_logging_utilities():
    """Test logging utility decorators"""
    print("Testing logging utilities...")
    
    try:
        from app.log_utils import log_function_call, log_execution_time, example_function, example_timed_function
        
        # Test decorators
        result1 = example_function("test message")
        result2 = example_timed_function()
        
        print(f"✓ Logging utilities test passed - Results: {result1}, {result2}")
        return True
        
    except Exception as e:
        print(f"✗ Logging utilities test failed: {e}")
        return False

def test_settings_integration():
    """Test logging integration with settings"""
    print("Testing settings integration...")
    
    try:
        from app.settings import settings
        
        print(f"Log level: {settings.log_level}")
        print(f"Log to file: {settings.log_to_file}")
        print(f"Log to console: {settings.log_to_console}")
        print(f"Log JSON format: {settings.log_json_format}")
        
        print("✓ Settings integration test passed")
        return True
        
    except Exception as e:
        print(f"✗ Settings integration test failed: {e}")
        return False

def test_file_logging():
    """Test file logging functionality"""
    print("Testing file logging...")
    
    try:
        from app.logging_config import get_logger
        
        # Create a test logger that writes to file
        test_logger = get_logger("test.file")
        test_logger.info("This message should appear in the log file")
        
        # Check if logs directory was created
        if os.path.exists("logs"):
            print("✓ Logs directory created")
            
            # List log files
            log_files = [f for f in os.listdir("logs") if f.endswith(".log")]
            print(f"Log files found: {log_files}")
            
            if log_files:
                print("✓ File logging test passed")
                return True
            else:
                print("✗ No log files found")
                return False
        else:
            print("✗ Logs directory not created")
            return False
            
    except Exception as e:
        print(f"✗ File logging test failed: {e}")
        return False

def test_different_log_levels():
    """Test different log levels"""
    print("Testing different log levels...")
    
    try:
        from app.logging_config import get_logger
        
        logger = get_logger("test.levels")
        
        # Test all log levels
        logger.debug("DEBUG message")
        logger.info("INFO message")
        logger.warning("WARNING message")
        logger.error("ERROR message")
        logger.critical("CRITICAL message")
        
        print("✓ Log levels test passed")
        return True
        
    except Exception as e:
        print(f"✗ Log levels test failed: {e}")
        return False

def main():
    """Run all logging tests"""
    print("=" * 50)
    print("DRS-LLM Logging Test Suite")
    print("=" * 50)
    
    tests = [
        test_basic_logging,
        test_logging_utilities,
        test_settings_integration,
        test_file_logging,
        test_different_log_levels,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"✗ Test {test.__name__} failed with exception: {e}")
    
    print("\n" + "=" * 50)
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All logging tests passed!")
        return 0
    else:
        print("❌ Some logging tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())





