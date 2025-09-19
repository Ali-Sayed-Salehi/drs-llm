from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from core.settings import BaseAppSettings
from core.logging_setup import setup_logging
from core.github_client import fetch_commit_message_and_diff
from core.diff_utils import diff_to_structured_xml
from core.runtime import preload_singleton

from .schemas import PredictRequest, PredictBySHARequest
from .prompts import SYSTEM_PROMPT, USER_TEMPLATE
from .model_clm import make_singleton

settings = BaseAppSettings()
setup_logging()
log = logging.getLogger(__name__)

gen_singleton = make_singleton(settings)

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Initializing CLM generator (raw text)...")
    await preload_singleton(gen_singleton)
    log.info("CLM generator ready.")
    yield

app = FastAPI(title="DRS-LLM API (CLM Raw Text)", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health():
    return {"status": "ok", "model_id": settings.model_id}


def build_prompt(commit_message: str, diff: str) -> str:
    structured = diff_to_structured_xml(diff, commit_message, strict=False)
    user = USER_TEMPLATE.format(structured_diff=structured)
    return SYSTEM_PROMPT + "\n\n" + user

@app.post("/predict", response_class=PlainTextResponse)
def predict(req: PredictRequest):
    prompt = build_prompt(req.commit_message, req.code_diff)
    text = gen_singleton.get().infer_text(prompt)
    return text

@app.post("/predict_by_sha", response_class=PlainTextResponse)
def predict_by_sha(req: PredictBySHARequest):
    msg, diff = fetch_commit_message_and_diff(req.repo, req.sha)
    try:
        prompt = build_prompt(msg, diff)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    text = gen_singleton.get().infer_text(prompt)
    return text