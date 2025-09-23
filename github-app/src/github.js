//src/github.js

// Upsert a single comment (edit if marker is found)
import { MARKER } from "./commentTemplate.js";

export async function upsertComment(octokit, { owner, repo, issue_number, body }) {
  const comments = await octokit.issues.listComments({
    owner,
    repo,
    issue_number,
    per_page: 100,
  });
  const mine = comments.data.find(c => typeof c.body === "string" && c.body.includes(MARKER));

  if (mine) {
    await octokit.issues.updateComment({ owner, repo, comment_id: mine.id, body });
  } else {
    await octokit.issues.createComment({ owner, repo, issue_number, body });
  }
}
