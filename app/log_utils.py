"""
Logging utilities for DRS-LLM project.
Provides additional logging functions and monitoring capabilities.
"""

import time
import functools
from typing import Any, Callable, Optional
from .logging_config import get_logger

def log_function_call(logger_name: str = None, level: str = "DEBUG"):
    """
    Decorator to log function calls with timing information.
    
    Args:
        logger_name: Name of the logger to use (defaults to module name)
        level: Log level for the function call (DEBUG, INFO, WARNING, ERROR)
    
    Usage:
        @log_function_call()
        def my_function():
            pass
    """
    def decorator(func: Callable) -> Callable:
        logger = get_logger(logger_name or func.__module__)
        
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            func_name = func.__name__
            start_time = time.time()
            
            # Log function entry
            log_func = getattr(logger, level.lower(), logger.debug)
            log_func(f"Calling {func_name} with args={args}, kwargs={kwargs}")
            
            try:
                result = func(*args, **kwargs)
                execution_time = time.time() - start_time
                log_func(f"{func_name} completed successfully in {execution_time:.3f}s")
                return result
            except Exception as e:
                execution_time = time.time() - start_time
                logger.error(f"{func_name} failed after {execution_time:.3f}s with error: {str(e)}", exc_info=True)
                raise
        
        return wrapper
    return decorator

def log_execution_time(logger_name: str = None, level: str = "INFO"):
    """
    Decorator to log only execution time of functions.
    
    Args:
        logger_name: Name of the logger to use (defaults to module name)
        level: Log level for the timing information
    
    Usage:
        @log_execution_time()
        def my_function():
            pass
    """
    def decorator(func: Callable) -> Callable:
        logger = get_logger(logger_name or func.__module__)
        
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            
            log_func = getattr(logger, level.lower(), logger.info)
            log_func(f"{func.__name__} executed in {execution_time:.3f}s")
            
            return result
        
        return wrapper
    return decorator

def log_memory_usage(logger_name: str = None):
    """
    Decorator to log memory usage before and after function execution.
    Requires psutil package.
    
    Usage:
        @log_memory_usage()
        def my_function():
            pass
    """
    def decorator(func: Callable) -> Callable:
        logger = get_logger(logger_name or func.__module__)
        
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            try:
                import psutil
                process = psutil.Process()
                memory_before = process.memory_info().rss / 1024 / 1024  # MB
                
                logger.debug(f"Memory before {func.__name__}: {memory_before:.2f} MB")
                
                result = func(*args, **kwargs)
                
                memory_after = process.memory_info().rss / 1024 / 1024  # MB
                memory_diff = memory_after - memory_before
                
                logger.debug(f"Memory after {func.__name__}: {memory_after:.2f} MB (diff: {memory_diff:+.2f} MB)")
                
                return result
            except ImportError:
                logger.warning("psutil not available, skipping memory logging")
                return func(*args, **kwargs)
            except Exception as e:
                logger.warning(f"Error logging memory usage: {str(e)}")
                return func(*args, **kwargs)
        
        return wrapper
    return decorator

def log_input_output(logger_name: str = None, log_input: bool = True, log_output: bool = True, max_length: int = 1000):
    """
    Decorator to log function input and output.
    
    Args:
        logger_name: Name of the logger to use (defaults to module name)
        log_input: Whether to log function input
        log_output: Whether to log function output
        max_length: Maximum length of logged strings
    
    Usage:
        @log_input_output()
        def my_function(text):
            return text.upper()
    """
    def decorator(func: Callable) -> Callable:
        logger = get_logger(logger_name or func.__module__)
        
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            func_name = func.__name__
            
            if log_input:
                # Log input arguments
                args_str = str(args)[:max_length]
                kwargs_str = str(kwargs)[:max_length]
                logger.debug(f"{func_name} input - args: {args_str}, kwargs: {kwargs_str}")
            
            result = func(*args, **kwargs)
            
            if log_output:
                # Log output
                result_str = str(result)[:max_length]
                logger.debug(f"{func_name} output: {result_str}")
            
            return result
        
        return wrapper
    return decorator

def create_performance_logger(name: str = "performance"):
    """
    Create a dedicated logger for performance monitoring.
    
    Args:
        name: Name of the performance logger
    
    Returns:
        Logger instance configured for performance logging
    """
    return get_logger(f"drs_llm.{name}")

def log_performance_metric(metric_name: str, value: float, unit: str = "", logger_name: str = "performance"):
    """
    Log a performance metric with standardized format.
    
    Args:
        metric_name: Name of the metric
        value: Metric value
        unit: Unit of measurement
        logger_name: Name of the performance logger
    """
    logger = get_logger(f"drs_llm.{logger_name}")
    unit_str = f" {unit}" if unit else ""
    logger.info(f"PERFORMANCE: {metric_name} = {value:.4f}{unit_str}")

# Example usage functions
@log_function_call()
def example_function(text: str) -> str:
    """Example function demonstrating logging decorators."""
    time.sleep(0.1)  # Simulate work
    return text.upper()

@log_execution_time()
def example_timed_function():
    """Example function demonstrating execution time logging."""
    time.sleep(0.2)  # Simulate work
    return "done"

if __name__ == "__main__":
    # Test the logging utilities
    logger = get_logger("test")
    logger.info("Testing logging utilities")
    
    result1 = example_function("hello world")
    result2 = example_timed_function()
    
    logger.info(f"Test completed: {result1}, {result2}")

