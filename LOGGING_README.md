# DRS-LLM Logging System

This document describes the comprehensive logging system implemented for the DRS-LLM project.

## Overview

The logging system provides structured logging throughout the application with the following features:

- **Multiple log levels**: DEBUG, INFO, WARNING, ERROR, CRITICAL
- **Dual output**: Console and file logging
- **Log rotation**: Automatic log file rotation with configurable size limits
- **Structured logging**: Optional JSON format for production environments
- **Performance monitoring**: Built-in timing and memory usage logging
- **Environment-specific configuration**: Different logging profiles for dev/prod/test

## Quick Start

### Basic Usage

```python
from app.logging_config import get_logger

# Get a logger for your module
logger = get_logger(__name__)

# Use different log levels
logger.debug("Debug information")
logger.info("General information")
logger.warning("Warning message")
logger.error("Error message")
logger.critical("Critical error")
```

### Pre-configured Loggers

The system provides several pre-configured loggers:

```python
from app.logging_config import app_logger, model_logger, inference_logger, api_logger

app_logger.info("Application-level message")
model_logger.debug("Model loading details")
inference_logger.info("Prediction completed")
api_logger.warning("Rate limit exceeded")
```

## Configuration

### Environment Variables

Configure logging behavior using environment variables:

```bash
# Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
export DRSLLM_LOG_LEVEL=DEBUG

# Enable/disable file logging
export DRSLLM_LOG_TO_FILE=true

# Enable/disable console logging
export DRSLLM_LOG_TO_CONSOLE=true

# Enable JSON format (useful for production)
export DRSLLM_LOG_JSON_FORMAT=false

# Log file size limit (default: 10MB)
export DRSLLM_LOG_MAX_FILE_SIZE=10485760

# Number of backup log files (default: 5)
export DRSLLM_LOG_BACKUP_COUNT=5
```

### Configuration File

You can also use the `logging_config.yaml` file for more detailed configuration:

```yaml
# Example: Development environment
development:
  level: DEBUG
  handlers:
    console:
      enabled: true
      level: DEBUG
      colorize: true
    file:
      enabled: true
      level: DEBUG
```

## Advanced Features

### Logging Decorators

Use decorators to automatically log function calls, execution time, and more:

```python
from app.log_utils import log_function_call, log_execution_time, log_memory_usage

@log_function_call()
def my_function(param1, param2):
    # Function body
    pass

@log_execution_time()
def timed_function():
    # Function body
    pass

@log_memory_usage()
def memory_intensive_function():
    # Function body
    pass
```

### Performance Logging

Log performance metrics with standardized format:

```python
from app.log_utils import log_performance_metric

log_performance_metric("prediction_time", 0.125, "seconds")
log_performance_metric("memory_usage", 512.5, "MB")
```

### Custom Logger Configuration

Create loggers with custom settings:

```python
from app.logging_config import setup_logger

# Custom logger with specific settings
custom_logger = setup_logger(
    name="my_module",
    level="DEBUG",
    log_to_file=True,
    log_to_console=False,
    json_format=True
)
```

## Log Files

Logs are stored in the `logs/` directory with the following structure:

```
logs/
├── drs_llm_app.log          # Application-level logs
├── drs_llm_model.log        # Model-related logs
├── drs_llm_inference.log    # Inference process logs
├── drs_llm_api.log          # API request/response logs
├── drs_llm_performance.log  # Performance metrics
└── drs_llm_errors.log       # Error logs
```

### Log Rotation

Log files are automatically rotated when they reach the configured size limit:
- Default max size: 10MB
- Default backup count: 5 files
- Old logs are compressed and archived

## Testing

Run the logging test suite to verify functionality:

```bash
python test_logging.py
```

This will test:
- Basic logging functionality
- Logging utilities and decorators
- Settings integration
- File logging
- Different log levels

## Best Practices

### 1. Use Appropriate Log Levels

```python
# DEBUG: Detailed information for debugging
logger.debug(f"Processing file: {filename}, size: {file_size}")

# INFO: General information about program execution
logger.info(f"User {user_id} logged in successfully")

# WARNING: Something unexpected happened but the program can continue
logger.warning(f"Rate limit approaching for user {user_id}")

# ERROR: A serious problem occurred
logger.error(f"Failed to connect to database: {str(e)}")

# CRITICAL: Program may not be able to continue
logger.critical(f"System out of memory, shutting down")
```

### 2. Include Context in Log Messages

```python
# Good: Include relevant context
logger.info(f"Prediction completed for commit {commit_hash} in {execution_time:.3f}s")

# Bad: Missing context
logger.info("Prediction completed")
```

### 3. Use Structured Logging for Production

```python
# Enable JSON format for production
export DRSLLM_LOG_JSON_FORMAT=true

# JSON logs are easier to parse and analyze
{
  "timestamp": "2024-01-15 10:30:45",
  "logger": "drs_llm.api",
  "level": "INFO",
  "message": "Request processed successfully"
}
```

### 4. Avoid Logging Sensitive Information

```python
# Good: Log metadata, not sensitive data
logger.info(f"Authentication attempt for user {user_id}")

# Bad: Logging sensitive information
logger.info(f"User {user_id} logged in with password {password}")
```

## Troubleshooting

### Common Issues

1. **Logs not appearing in files**
   - Check if `DRSLLM_LOG_TO_FILE=true`
   - Verify write permissions to the `logs/` directory
   - Check disk space

2. **Too many log messages**
   - Increase log level: `DRSLLM_LOG_LEVEL=WARNING`
   - Disable debug logging in production

3. **Log files too large**
   - Reduce `DRSLLM_LOG_MAX_FILE_SIZE`
   - Increase `DRSLLM_LOG_BACKUP_COUNT`

4. **Performance impact**
   - Use appropriate log levels
   - Consider disabling file logging for high-frequency operations
   - Use async logging for I/O intensive operations

### Debug Mode

Enable debug logging to see detailed information:

```bash
export DRSLLM_LOG_LEVEL=DEBUG
export DRSLLM_LOG_TO_CONSOLE=true
```

### Log Analysis

Use standard tools to analyze logs:

```bash
# View recent logs
tail -f logs/drs_llm_api.log

# Search for errors
grep "ERROR" logs/*.log

# Count log entries by level
grep -c "INFO" logs/drs_llm_app.log
```

## Integration with Monitoring

The logging system can be integrated with external monitoring tools:

- **ELK Stack**: Use JSON format for easy parsing
- **Prometheus**: Extract metrics from log messages
- **Splunk**: Parse structured logs for analysis
- **CloudWatch**: Send logs to AWS CloudWatch

## Performance Considerations

- **Async logging**: Consider using async loggers for high-frequency operations
- **Buffering**: Log messages are buffered for better performance
- **Level filtering**: Early level checks prevent unnecessary string formatting
- **File rotation**: Automatic rotation prevents disk space issues

## Security

- **No sensitive data**: Never log passwords, tokens, or personal information
- **Access control**: Ensure log files have appropriate permissions
- **Audit trail**: Log security-relevant events (login attempts, access violations)
- **Data retention**: Configure appropriate log retention policies

## Support

For logging-related issues:

1. Check this documentation
2. Run the test suite: `python test_logging.py`
3. Review log files for error messages
4. Check environment variable configuration
5. Verify file permissions and disk space





