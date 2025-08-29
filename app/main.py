from .logging_setup import setup_logging
setup_logging()

from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from .schemas import PredictRequest, PredictResponse
from .inference import score_commit
from .settings import settings
from .model_hf import get_classifier

log = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Block here until the model is fully initialized
    log.info("Initializing model (blocking startup)...")
    try:
        # get_classifier() is sync and heavy → run in a thread to avoid freezing the loop
        await asyncio.to_thread(get_classifier)
        log.info("Model and pipeline initialized.")
    except Exception:
        log.exception("Model initialization failed; aborting startup.")
        raise  # re-raise to stop the server from starting
    yield
    # (Optional) teardown goes here

app = FastAPI(title="DRS-LLM API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "model_id": settings.model_id}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    label, confidence = score_commit(req.commit_message, req.code_diff)
    log.info("label: %s, confidence: %f", label, confidence)
    return PredictResponse(label=label, confidence=confidence)
