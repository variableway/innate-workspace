import { Hono } from "hono";
import { one, run, uuid } from "../lib/db.js";
import { verifyGitHubSignature } from "../lib/github/verify-signature.js";
import { syncIssue } from "../lib/github/sync.js";

export const webhookRoutes = new Hono();

// POST /webhooks/github — receive GitHub webhook
webhookRoutes.post("/github", async (c) => {
  const event = c.req.header("X-GitHub-Event") || "";
  const signature = c.req.header("X-Hub-Signature-256") || "";

  if (!signature) {
    return c.json({ code: "UNAUTHORIZED", message: "missing signature" }, 401);
  }

  const rawBody = await c.req.text();
  const body = JSON.parse(rawBody);
  const repoFullName = body.repository?.full_name;

  if (!repoFullName) {
    return c.json({ code: "VALIDATION_ERROR", message: "missing repository info" }, 400);
  }

  const [owner, name] = repoFullName.split("/");
  const project = one<{ id: string; webhook_secret: string | null }>(
    "SELECT id, webhook_secret FROM kanban_project WHERE repo_owner = ? AND repo_name = ?",
    owner, name
  );

  if (!project) {
    return c.json({ code: "NOT_FOUND", message: "project not registered" }, 404);
  }

  // Verify HMAC signature
  if (project.webhook_secret) {
    if (!verifyGitHubSignature(rawBody, signature, project.webhook_secret)) {
      console.warn(`[webhook] invalid signature for ${repoFullName}`);
      return c.json({ code: "UNAUTHORIZED", message: "invalid signature" }, 401);
    }
  }

  // Handle issues events
  if (event === "issues" && body.issue) {
    console.log(`[webhook] event=issues action=${body.action} issue=#${body.issue.number} repo=${repoFullName}`);
    syncIssue(project.id, body.action, body.issue);
  } else {
    console.log(`[webhook] event=${event} repo=${repoFullName} (ignored)`);
  }

  return c.json({ status: "ok" });
});
