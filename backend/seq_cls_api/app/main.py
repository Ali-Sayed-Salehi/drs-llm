from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import logging
from .schemas import PredictRequest, PredictResponse, PredictBySHARequest
from .inference import score_commit
from .settings import settings
from .model_hf import get_classifier
from .github_client import fetch_commit_message_and_diff

from .logging_setup import setup_logging
setup_logging()

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


@app.post("/predict_batch", response_model=List[PredictResponse])
def predict_batch(reqs: List[PredictRequest]):
    results: List[PredictResponse] = []
    for r in reqs:
        label, confidence = score_commit(r.commit_message, r.code_diff)
        results.append(PredictResponse(label=label, confidence=confidence))
    return results

@app.post("/predict_by_sha", response_model=PredictResponse)
def predict_by_sha(req: PredictBySHARequest):
    """
    Resolve repo + sha from GitHub → fetch message + unified diff → reuse score_commit(...)
    """
    commit_message, code_diff = fetch_commit_message_and_diff(req.repo, req.sha)

    try:
        # This will raise on malformed diffs
        label, confidence = score_commit(commit_message, code_diff)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Malformed diff: {e}") from e

    log.info("label: %s, confidence: %f (repo=%s sha=%s)", label, confidence, req.repo, req.sha)
    return PredictResponse(label=label, confidence=confidence)