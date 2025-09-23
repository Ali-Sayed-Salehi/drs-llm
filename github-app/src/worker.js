// src/worker.js

import { CONFIG } from "./config.js";
import { seqClsPredictBySha, clmPredictBySha } from "./apiClient.js";
import { buildCombinedComment } from "./commentTemplate.js";
import { upsertComment } from "./github.js";

/**
 * Fetch all commit SHAs for a PR (handles pagination).
 */
async function getPullRequestShas(octokit, { owner, repo, number }) {
  const commits = await octokit.paginate(octokit.pulls.listCommits, {
    owner,
    repo,
    pull_number: number,
    per_page: 100,
  });
  return commits.map((c) => c.sha);
}

export function makeWorker(app) {
  return async function processJob(job) {
    const { installationId, owner, repo, number, repoFull, deliveryId } = job;

    const octokit = await app.auth(installationId);

    // 1) Collect SHAs for this PR
    let shas = [];
    try {
      shas = await getPullRequestShas(octokit, { owner, repo, number });
    } catch (err) {
      app.log.error({ deliveryId, err: String(err) }, "Failed to list PR commits");
      return;
    }

    if (!shas.length) {
      app.log.warn({ deliveryId }, "No commits found for PR");
      return;
    }

    // 2) Process commits SEQUENTIALLY
    const results = [];
    for (const sha of shas) {
      let label = "UNKNOWN";
      let confidence = 0;
      let explanation = "";

      // seq-cls
      try {
        const d = await seqClsPredictBySha({ repo: repoFull, sha });
        label = d.label ?? label;
        confidence = Number(d.confidence ?? confidence);
      } catch (err) {
        app.log.warn({ deliveryId, sha, err: String(err) }, "seq-cls failed; using fallback");
      }

      // clm (optional)
      if (CONFIG.withExplanation) {
        try {
          explanation = await clmPredictBySha({ repo: repoFull, sha });
        } catch (err) {
          app.log.warn({ deliveryId, sha, err: String(err) }, "CLM failed; skipping explanation");
        }
      }

      results.push(
        CONFIG.withExplanation
          ? { sha, label, confidence, explanation }
          : { sha, label, confidence }
      );
    }

    // 3) Build a single combined comment for the PR
    const body = buildCombinedComment({
      repoFull,
      number,
      results,
      withExplanation: CONFIG.withExplanation,
    });

    // 4) Upsert the comment on the PR
    await upsertComment(octokit, { owner, repo, issue_number: number, body });
  };
}
