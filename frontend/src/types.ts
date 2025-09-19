// src/types.ts
export interface PredictRequest {
  commit_message: string;
  code_diff: string;
}

export interface PredictBySHARequest {
  repo: string; // "owner/repo"
  sha: string;  // commit SHA
}

export interface PredictResponse {
  label: string;
  confidence: number;
}

export interface HealthResponse {
  status: string;
  model_id: string;
}
