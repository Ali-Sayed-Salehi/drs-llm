// src/components/BatchPredict.tsx
import { useState } from "react";
import { usePredictBatch } from "../hooks/usePredictBatch";
import type { PredictRequest } from "../types";
import { PLACEHOLDER_DIFF } from "../constants";

type Item = { id: string; commit_message: string; code_diff: string; };

export default function BatchPredict() {
  const [items, setItems] = useState<Item[]>([
    { id: crypto.randomUUID(), commit_message: "Fix NPE", code_diff: PLACEHOLDER_DIFF },
    { id: crypto.randomUUID(), commit_message: "Refactor: rename", code_diff: `diff --git a/app/a.py b/app/a.py
--- a/app/a.py
+++ b/app/a.py
@@ -1,3 +1,3 @@
-x = 1
+count = 1
 print("ok")` },
  ]);

  const m = usePredictBatch();

  const addItem = () => setItems(xs => [...xs, { id: crypto.randomUUID(), commit_message: "", code_diff: "" }]);
  const removeItem = (id: string) => setItems(xs => xs.filter(x => x.id !== id));
  const update = (id: string, field: keyof PredictRequest, v: string) =>
    setItems(xs => xs.map(x => (x.id === id ? { ...x, [field]: v } : x)));

  const submit = () => m.mutate(items.map(({ commit_message, code_diff }) => ({ commit_message, code_diff })));

  return (
    <div className="card stack">
      <div className="row between">
        <h3>Batch items</h3>
        <button className="secondary" onClick={addItem}>Add item</button>
      </div>

      <div className="stack pad">
        {items.map((it, i) => (
          <div key={it.id} className="card stack">
            <div className="row between">
              <b>Item #{i + 1}</b>
              <button className="ghost" onClick={() => removeItem(it.id)}>Remove</button>
            </div>
            <label>
              <div className="lbl">Commit message</div>
              <textarea rows={2} value={it.commit_message} onChange={(e) => update(it.id, "commit_message", e.target.value)} />
            </label>
            <label>
              <div className="lbl">Code diff (unified)</div>
              <textarea rows={8} className="mono" value={it.code_diff} onChange={(e) => update(it.id, "code_diff", e.target.value)} />
            </label>
          </div>
        ))}
      </div>

      <div className="row gap">
        <button onClick={submit} disabled={m.isPending || items.length === 0}>
          Predict batch ({items.length})
        </button>
        {m.isPending && <span>Running…</span>}
        {m.isError && <span className="err">{(m.error as Error).message}</span>}
      </div>

      {Array.isArray(m.data) && m.data.length > 0 && (
        <>
          <div className="hr" />
          <div className="stack">
            {m.data.map((r, i) => (
              <div key={i} className="card">
                <div><b>Item #{i + 1}</b></div>
                <div><b>Label:</b> {r.label}</div>
                <div><b>Confidence:</b> {(r.confidence * 100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
