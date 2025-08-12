#!/usr/bin/env python3
"""
Simple run script for the Bug Risk Assessment API.
"""

import os
import sys
import argparse
from pathlib import Path

# Add the current directory to the path
sys.path.append(str(Path(__file__).parent))

from config import get_config, Config


def main():
    """Main entry point for the API"""
    parser = argparse.ArgumentParser(description="Bug Risk Assessment API")
    parser.add_argument(
        "--environment", 
        choices=["development", "production", "testing"],
        default=os.getenv("ENVIRONMENT", "development"),
        help="Environment to run in"
    )
    parser.add_argument(
        "--host",
        default=os.getenv("HOST", "0.0.0.0"),
        help="Host to bind to"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.getenv("PORT", "8000")),
        help="Port to bind to"
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Enable auto-reload (development only)"
    )
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Only validate configuration, don't start server"
    )
    
    args = parser.parse_args()
    
    # Set environment
    os.environ["ENVIRONMENT"] = args.environment
    
    # Get configuration
    config = get_config(args.environment)
    
    # Override config with command line args
    config.HOST = args.host
    config.PORT = args.port
    if args.reload:
        config.RELOAD = True
    
    # Print configuration
    print("🚀 Starting Bug Risk Assessment API")
    print(f"📁 Environment: {args.environment}")
    config.print_config()
    
    # Validate configuration
    if not config.validate():
        print("❌ Configuration validation failed")
        sys.exit(1)
    
    if args.validate_only:
        print("✅ Configuration validation passed")
        return
    
    # Start the API
    try:
        import uvicorn
        print(f"🌐 Starting server on {config.HOST}:{config.PORT}")
        print(f"📚 API documentation: http://{config.HOST}:{config.PORT}/docs")
        print(f"🔍 Health check: http://{config.HOST}:{config.PORT}/health")
        
        uvicorn.run(
            "main:app",
            host=config.HOST,
            port=config.PORT,
            reload=config.RELOAD,
            log_level=config.LOG_LEVEL
        )
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
