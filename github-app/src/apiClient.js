//src/apiClient.js

import { CONFIG } from "./config.js";

function withTimeout(ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, cancel: () => clearTimeout(t) };
}

export async function seqClsPredictBySha({ repo, sha }) {
  const url = `${CONFIG.apiBase}/seq-cls/predict_by_sha`;
  const { signal, cancel } = withTimeout(CONFIG.fetchTimeoutMs);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ repo, sha }),
      signal,
    });
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      throw new Error(`seq-cls ${r.status}: ${txt || r.statusText}`);
    }
    return await r.json(); // { label, confidence }
  } finally {
    cancel();
  }
}

export async function clmPredictBySha({ repo, sha }) {
  if (!CONFIG.withExplanation) return "";
  const url = `${CONFIG.apiBase}/clm/predict_by_sha`;
  const { signal, cancel } = withTimeout(CONFIG.fetchTimeoutMs);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "text/plain" },
      body: JSON.stringify({ repo, sha }),
      signal,
    });
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      throw new Error(`clm ${r.status}: ${txt || r.statusText}`);
    }
    return await r.text();
  } finally {
    cancel();
  }
}
