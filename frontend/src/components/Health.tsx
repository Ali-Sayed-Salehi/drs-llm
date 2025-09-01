// src/components/Health.tsx
import { useHealth } from "../hooks/useHealth";

export default function Health() {
  const { data, isLoading, isError, refetch } = useHealth();
  return (
    <div className="row between">
      <div className="row gap">
        <span className="badge">{isLoading ? "Checking..." : isError ? "Unreachable" : "OK"}</span>
        {!isLoading && !isError && <span>Model: <b>{data?.model_id}</b></span>}
      </div>
      <button className="ghost" onClick={refetch}>Refresh</button>
    </div>
  );
}
