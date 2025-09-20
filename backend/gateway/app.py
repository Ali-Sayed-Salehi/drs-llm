# gateway/app.py
import os
import asyncio
from typing import Dict, Iterable

import httpx
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

SEQ_BASE = os.getenv("SEQ_BASE", "http://localhost:8081").rstrip("/")
CLM_BASE = os.getenv("CLM_BASE", "http://localhost:8082").rstrip("/")
TIMEOUT_S = float(os.getenv("GATEWAY_TIMEOUT_S", "60"))

HOP_BY_HOP = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
}

ALL_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]

app = FastAPI(title="DRS-LLM Gateway", version="0.1.0")

# CORS at the gateway (tweak as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _startup():
    app.state.client = httpx.AsyncClient(timeout=TIMEOUT_S, follow_redirects=False)


@app.on_event("shutdown")
async def _shutdown():
    await app.state.client.aclose()


def _forwardable_request_headers(headers: Iterable[tuple[str, str]]) -> Dict[str, str]:
    out: Dict[str, str] = {}
    for k, v in headers:
        lk = k.lower()
        if lk == "host":
            continue
        if lk in HOP_BY_HOP:
            continue
        out[k] = v
    return out


def _forwardable_response_headers(headers: httpx.Headers) -> Dict[str, str]:
    out: Dict[str, str] = {}
    for k, v in headers.items():
        lk = k.lower()
        if lk in HOP_BY_HOP:
            continue
        out[k] = v
    # Optional: mark which upstream served the request
    # (Set in handlers below via .update({"X-DRS-Upstream": ...}))
    return out


async def _proxy(request: Request, base: str, tail_path: str) -> Response:
    """
    Generic reverse proxy: forwards method/headers/body/query to the target base.
    tail_path: remainder after prefix (/seq-cls or /clm) has been stripped.
    """
    client: httpx.AsyncClient = app.state.client
    method = request.method
    query = request.url.query
    upstream_url = f"{base}/{tail_path.lstrip('/')}"
    if query:
        upstream_url = f"{upstream_url}?{query}"

    body = await request.body()
    headers = _forwardable_request_headers(request.headers.items())

    upstream = await client.request(method, upstream_url, content=body, headers=headers)
    resp_headers = _forwardable_response_headers(upstream.headers)
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=resp_headers,
        media_type=upstream.headers.get("content-type"),
    )


@app.get("/health")
async def health():
    """Gateway health + upstream checks."""
    client: httpx.AsyncClient = app.state.client

    async def check(url: str):
        try:
            r = await client.get(url, timeout=TIMEOUT_S)
            return {"ok": r.status_code == 200, "status": r.status_code}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    seq_fut = check(f"{SEQ_BASE}/health")
    clm_fut = check(f"{CLM_BASE}/health")
    seq, clm = await asyncio.gather(seq_fut, clm_fut)

    return {
        "gateway": "ok",
        "upstreams": {
            "seq_cls": {"base": SEQ_BASE, **seq},
            "clm": {"base": CLM_BASE, **clm},
        },
    }


# ---- Route groups ----

@app.api_route("/seq-cls", methods=ALL_METHODS)
async def seq_root(request: Request):
    resp = await _proxy(request, SEQ_BASE, "")
    resp.headers["X-DRS-Upstream"] = SEQ_BASE
    return resp

@app.api_route("/seq-cls/{path:path}", methods=ALL_METHODS)
async def seq_proxy(path: str, request: Request):
    resp = await _proxy(request, SEQ_BASE, path)
    resp.headers["X-DRS-Upstream"] = SEQ_BASE
    return resp


@app.api_route("/clm", methods=ALL_METHODS)
async def clm_root(request: Request):
    resp = await _proxy(request, CLM_BASE, "")
    resp.headers["X-DRS-Upstream"] = CLM_BASE
    return resp

@app.api_route("/clm/{path:path}", methods=ALL_METHODS)
async def clm_proxy(path: str, request: Request):
    resp = await _proxy(request, CLM_BASE, path)
    resp.headers["X-DRS-Upstream"] = CLM_BASE
    return resp
