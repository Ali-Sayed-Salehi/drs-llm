// src/components/SinglePredict.tsx
import { useState } from "react";
import { usePredict } from "../hooks/usePredict";
import ResultCard from "./ResultCard";
import { DEFAULT_COMMIT, PLACEHOLDER_DIFF } from "../constants";

export default function SinglePredict() {
  const [commit, setCommit] = useState(DEFAULT_COMMIT);
  const [diff, setDiff] = useState(PLACEHOLDER_DIFF);
  const predict = usePredict();

  return (
    <div className="card stack">
      <label>
        <div className="lbl">Commit message</div>
        <textarea rows={2} value={commit} onChange={(e) => setCommit(e.target.value)} />
      </label>

      <label>
        <div className="lbl">Code diff (unified)</div>
        <textarea rows={10} className="mono" value={diff} onChange={(e) => setDiff(e.target.value)} />
      </label>

      <div className="row gap">
        <button
          onClick={() => predict.mutate({ commit_message: commit, code_diff: diff })}
          disabled={predict.isPending || !commit || !diff}
        >
          Predict
        </button>
        {predict.isPending && <span>Running…</span>}
        {predict.isError && <span className="err">{(predict.error as Error).message}</span>}
      </div>

      {predict.data && (
        <>
          <div className="hr" />
          <ResultCard result={predict.data} />
        </>
      )}
    </div>
  );
}
