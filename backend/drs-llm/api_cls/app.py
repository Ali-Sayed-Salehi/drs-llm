from contextlib import asynccontextmanager
import asyncio, logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from core.settings import BaseAppSettings
from core.logging_setup import setup_logging
from core.github_client import fetch_commit_message_and_diff
from core.diff_utils import diff_to_structured_xml
from core.runtime import preload_singleton

from .schemas import PredictRequest, PredictResponse, PredictBySHARequest
from .model_cls import get_classifier

settings = BaseAppSettings()
setup_logging()
log = logging.getLogger(__name__)

clf_singleton = get_classifier(settings)

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Initializing classifier (blocking startup)...")
    await preload_singleton(clf_singleton)
    log.info("Classifier ready.")
    yield

app = FastAPI(title="DRS-LLM API (SeqCls)", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health():
    return {"status": "ok", "model_id": settings.model_id}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    text = diff_to_structured_xml(req.code_diff, req.commit_message, strict=False)
    label, conf = clf_singleton.get().predict(text)
    log.info("label=%s conf=%.3f", label, conf)
    return PredictResponse(label=label, confidence=conf)

@app.post("/predict_by_sha", response_model=PredictResponse)
def predict_by_sha(req: PredictBySHARequest):
    msg, diff = fetch_commit_message_and_diff(req.repo, req.sha)
    text = msg + "\n\n" + diff_to_structured_xml(diff, strict=False)
    try:
        label, conf = clf_singleton.get().predict(text)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    log.info("label=%s conf=%.3f repo=%s sha=%s", label, conf, req.repo, req.sha)
    return PredictResponse(label=label, confidence=conf)


@app.post("/predict_batch", response_model=List[PredictResponse])
def predict_batch(reqs: List[PredictRequest]):
    results: List[PredictResponse] = []
    for r in reqs:
        text = r.commit_message + "\n\n" + diff_to_structured_xml(r.code_diff, strict=False)
        label, conf = clf_singleton.get().predict(text)
        results.append(PredictResponse(label=label, confidence=conf))
    return results