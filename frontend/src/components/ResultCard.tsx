import type { PredictResponse } from "../types";

export default function ResultCard({ result }: { result: PredictResponse }) {
  return (
    <div className="card stack soft">
      <div><b>Label:</b> {result.label}</div>
      <div><b>Confidence:</b> {(result.confidence * 100).toFixed(1)}%</div>
    </div>
  );
}
