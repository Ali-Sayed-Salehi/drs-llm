export const CONFIG = {
  apiBase: (process.env.DRS_API_BASE || "http://localhost:8083").replace(/\/$/, ""),
  withExplanation: (process.env.WITH_EXPLANATION || "true").toLowerCase() === "true",

  // Webhook / processing knobs
  queueConcurrency: Number(process.env.QUEUE_CONCURRENCY || 2),
  fetchTimeoutMs: Number(process.env.FETCH_TIMEOUT_MS || 55_000),

  // Comment-trigger (e.g., "/drs" or "/risk")
  commentTrigger: (process.env.COMMENT_TRIGGER || "/drs").toLowerCase(),
};
