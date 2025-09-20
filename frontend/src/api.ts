// src/api.ts
import type { PredictRequest, PredictResponse, HealthResponse, PredictBySHARequest } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8083";
const SEQ_CLS_API_PATH = import.meta.env.VITE_SEQ_CLS_API_PATH ?? "/seq-cls";
const CLM_API_PATH = import.meta.env.VITE_CLM_API_PATH ?? "/clm";

// ---- Types ----
export type Upstream = { base?: string; ok?: boolean; status?: number; error?: string; model_id?: string };
export type GatewayAggregate = { gateway?: string; upstreams?: { seq_cls?: Upstream; clm?: Upstream } };
export type GatewayHealth = GatewayAggregate | HealthResponse;


// ---- Helpers ----
function pickErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const d = data as { detail?: unknown; message?: unknown };
    if (typeof d.detail === "string") return d.detail;
    if (typeof d.message === "string") return d.message;
  }
  return fallback;
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(pickErrorMessage(data, res.statusText));
  }
  return data as T;
}

// CLM returns raw text (no JSON)
async function httpText(path: string, init?: RequestInit): Promise<string> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const text = await res.text();
  if (!res.ok) throw new Error(text || res.statusText);
  return text;
}

export const api = {
  // Gateway /health (aggregated or old single-model)
  health: (signal?: AbortSignal) => http<GatewayHealth>(`/health`, { signal }),

  // seq-cls (JSON)
  predict: (body: PredictRequest) =>
    http<PredictResponse>(`${SEQ_CLS_API_PATH}/predict`, { method: "POST", body: JSON.stringify(body) }),
  predictBatch: (items: PredictRequest[]) =>
    http<PredictResponse[]>(`${SEQ_CLS_API_PATH}/predict_batch`, { method: "POST", body: JSON.stringify(items) }),
  predictBySha: (body: PredictBySHARequest) =>
    http<PredictResponse>(`${SEQ_CLS_API_PATH}/predict_by_sha`, { method: "POST", body: JSON.stringify(body) }),

  // clm (raw text)
  clmPredict: (body: PredictRequest) =>
    httpText(`${CLM_API_PATH}/predict`, { method: "POST", body: JSON.stringify(body) }),
  clmPredictBySha: (body: PredictBySHARequest) =>
    httpText(`${CLM_API_PATH}/predict_by_sha`, { method: "POST", body: JSON.stringify(body) }),
};
