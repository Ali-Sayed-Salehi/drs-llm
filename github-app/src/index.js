import { CONFIG } from "./config.js";
import { InMemoryQueue } from "./queue.js";
import { makeWorker } from "./worker.js";

export default (app) => {
  const worker = makeWorker(app);
  const queue = new InMemoryQueue({ concurrency: CONFIG.queueConcurrency, worker, app });

  // run on PR lifecycle events
  app.on(["pull_request.opened", "pull_request.reopened", "pull_request.synchronize"], async (context) => {
    const deliveryId = context.id;
    if (!deliveryId) {
      context.log.warn("Missing delivery id");
    }

    const pr = context.payload.pull_request;
    const repoFull = context.payload.repository.full_name; // "owner/repo"
    const [owner, repo] = repoFull.split("/");
    const number = pr.number;
    const installationId = context.payload.installation?.id;

    if (!installationId) {
      context.log.error("No installation id on webhook payload");
      return;
    }

    queue.enqueue({ installationId, owner, repo, number, repoFull, deliveryId });
  });

  // run when someone triggers via a PR comment ("/drs", by default)
  app.on(["issue_comment.created", "issue_comment.edited"], async (context) => {
    const deliveryId = context.id;
    const installationId = context.payload.installation?.id;
    const repoFull = context.payload.repository.full_name; // "owner/repo"
    const [owner, repo] = repoFull.split("/");
    const issue = context.payload.issue;
    const comment = context.payload.comment;

    // Ignore if no installation (safety)
    if (!installationId) {
      context.log.error("No installation id on webhook payload (issue_comment)");
      return;
    }

    // Only act on PR comments (issue_comment fires for issues AND PRs)
    if (!issue?.pull_request) {
      context.log.debug({ deliveryId }, "Comment is on an issue, not a PR — ignoring");
      return;
    }

    // Ignore bot/self comments to avoid loops
    if (comment?.user?.type === "Bot") {
      context.log.debug({ deliveryId }, "Comment author is a bot — ignoring");
      return;
    }

    const body = (comment?.body || "").trim().toLowerCase();
    const trigger = CONFIG.commentTrigger; // e.g., "/drs"

    // Simple trigger: comment must start with the trigger word
    if (!body.startsWith(trigger)) {
      context.log.debug({ deliveryId }, "Comment does not match trigger — ignoring");
      return;
    }

    const number = issue.number; // PR number
    queue.enqueue({ installationId, owner, repo, number, repoFull, deliveryId });

  });

  app.log.info("DRS Risk Bot ready — PR lifecycle + comment-trigger (/drs) enabled");
};
