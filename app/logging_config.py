import logging
import logging.handlers
import sys
import os
from pathlib import Path
from typing import Optional
from .settings import settings

# Logging configuration
LOG_LEVEL = settings.log_level.upper()
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
LOG_FORMAT_JSON = '{"timestamp": "%(asctime)s", "logger": "%(name)s", "level": "%(levelname)s", "message": "%(message)s"}'

# Create logs directory if it doesn't exist
LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)

def setup_logger(
    name: str,
    level: Optional[str] = None,
    log_to_file: Optional[bool] = None,
    log_to_console: Optional[bool] = None,
    json_format: Optional[bool] = None
) -> logging.Logger:
    """
    Set up a logger with the specified configuration.
    
    Args:
        name: Logger name (usually __name__)
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_to_file: Whether to log to file (defaults to settings)
        log_to_console: Whether to log to console (defaults to settings)
        json_format: Whether to use JSON format for structured logging (defaults to settings)
    
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    
    # Use settings defaults if not specified
    log_level = getattr(logging, level or LOG_LEVEL, logging.INFO)
    log_to_file = log_to_file if log_to_file is not None else settings.log_to_file
    log_to_console = log_to_console if log_to_console is not None else settings.log_to_console
    json_format = json_format if json_format is not None else settings.log_json_format
    
    logger.setLevel(log_level)
    
    # Clear existing handlers to avoid duplicates
    logger.handlers.clear()
    
    # Choose format
    formatter = logging.Formatter(
        LOG_FORMAT_JSON if json_format else LOG_FORMAT,
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    # Console handler
    if log_to_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(log_level)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
    
    # File handler with rotation
    if log_to_file:
        log_file = LOGS_DIR / f"{name.replace('.', '_')}.log"
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=settings.log_max_file_size,
            backupCount=settings.log_backup_count,
            encoding='utf-8'
        )
        file_handler.setLevel(log_level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    # Prevent propagation to root logger to avoid duplicate logs
    logger.propagate = False
    
    return logger

def get_logger(name: str = None) -> logging.Logger:
    """
    Get a logger instance with default configuration.
    
    Args:
        name: Logger name (defaults to calling module's __name__)
    
    Returns:
        Configured logger instance
    """
    if name is None:
        # Get the calling module's name
        import inspect
        frame = inspect.currentframe()
        try:
            name = frame.f_back.f_globals['__name__']
        except (AttributeError, KeyError):
            name = "drs_llm"
        finally:
            del frame
    
    return setup_logger(name)

# Create default loggers
app_logger = get_logger("drs_llm.app")
model_logger = get_logger("drs_llm.model")
inference_logger = get_logger("drs_llm.inference")
api_logger = get_logger("drs_llm.api")
