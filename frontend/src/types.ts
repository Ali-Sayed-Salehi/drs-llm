export interface PredictRequest {
    commit_message: string;
    code_diff: string;
}

export interface PredictResponse {
    label: string;
    confidence: number;
}

export interface HealthResponse {
    status: string;
    model_id: string;
}
  