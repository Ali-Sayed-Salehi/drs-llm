from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .schemas import PredictRequest, PredictResponse
from .inference import score_commit
from .settings import settings

app = FastAPI(title="DRS-LLM API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "model_id": settings.model_id}

@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    label, bug_prob = await score_commit(req.commit_message, req.code_diff)
    return PredictResponse(label=label, bug_probability=bug_prob)