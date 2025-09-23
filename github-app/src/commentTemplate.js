// src/commentTemplate.js

export const MARKER = "<!-- drs-risk-bot -->";

export function verdictFromLabel(label) {
  if (label === "POSITIVE") return "⚠️ **High Risk**";
  if (label === "NEGATIVE") return "✅ **Low Risk**";
  return "❔ **Unknown**";
}

export function formatConfidence(conf) {
  const n = Number(conf || 0);
  return `${(n * 100).toFixed(1)}%`;
}

// ---- internal helpers ----
function shortSha(sha) {
  return `\`${String(sha || "").slice(0, 7)}\``;
}

function summarize(results = []) {
  let high = 0, low = 0, unknown = 0;
  for (const r of results) {
    if (r?.label === "POSITIVE") high++;
    else if (r?.label === "NEGATIVE") low++;
    else unknown++;
  }
  return { high, low, unknown, total: results.length };
}

/**
 * Combined PR comment with repo/PR header + summary + table + details.
 * results: Array<{ sha: string, label: "POSITIVE"|"NEGATIVE"|string, confidence: number, explanation?: string }>
 */
export function buildCombinedComment({ repoFull, number, results, withExplanation }) {
  if (!Array.isArray(results) || results.length === 0) {
    return `${MARKER}

### DRS Risk Check for ${repoFull}#${number}

_No commits found to analyze._
`;
  }

  const { high, low, unknown, total } = summarize(results);

  // Header + summary
  let body = `${MARKER}

### DRS Risk Check for ${repoFull}#${number}
Analyzed **${total}** commit${total === 1 ? "" : "s"} — ${high} high-risk, ${low} low-risk, ${unknown} unknown.

| Commit | Verdict | Confidence |
|:------:|:-------:|:----------:|
`;

  // Table
  for (const r of results) {
    const verdict = verdictFromLabel(r.label);
    const confPct = formatConfidence(r.confidence);
    body += `| ${shortSha(r.sha)} | ${verdict} | ${confPct} |\n`;
  }

  // Details with optional explanations
  for (const r of results) {
    const verdict = verdictFromLabel(r.label);
    const confPct = formatConfidence(r.confidence);

    body += `

<details><summary><strong>\`${r.sha}\`</strong> — ${verdict} (${confPct})</summary>
`;

    if (withExplanation) {
      if (r.explanation && String(r.explanation).trim()) {
        body += `**Explanation (CLM):**

\`\`\`
${r.explanation}
\`\`\`
`;
      } else {
        body += `_No explanation available._\n`;
      }
    }

    body += `</details>\n`;
  }

  return body;
}
