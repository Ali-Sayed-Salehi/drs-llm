# backend/drs-llm/core/logging_setup.py

import logging
from .settings import settings

def setup_logging():
    logging.basicConfig(
        level=settings.log_level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        force=True,
    )
    logging.getLogger("uvicorn.error").setLevel(settings.log_level)
    logging.getLogger("uvicorn.access").setLevel(settings.access_log_level)
    logging.getLogger("transformers").setLevel(settings.transformers_log_level)
