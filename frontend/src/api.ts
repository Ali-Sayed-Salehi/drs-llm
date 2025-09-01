import type { PredictRequest, PredictResponse, HealthResponse } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers);
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || res.statusText;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
    return data as T;
}

export const api = {
    health: () => http<HealthResponse>("/health"),
    predict: (body: PredictRequest) =>
    http<PredictResponse>("/predict", { method: "POST", body: JSON.stringify(body) }),
    predictBatch: (items: PredictRequest[]) =>
    http<PredictResponse[]>("/predict_batch", {
        method: "POST",
        body: JSON.stringify(items),
    }),
};
