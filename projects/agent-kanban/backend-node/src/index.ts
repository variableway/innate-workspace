import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { getDB } from "./lib/db.js";
import { workspaceRoutes } from "./routes/workspaces.js";
import { projectRoutes } from "./routes/projects.js";
import { taskRoutes } from "./routes/tasks.js";
import { agentRoutes } from "./routes/agents.js";
import { assignmentRoutes } from "./routes/assignments.js";
import { webhookRoutes } from "./routes/webhooks.js";

// Initialize database
getDB();

// Create Hono app
const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:4002", "http://localhost:5173"],
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Accept",
      "Authorization",
      "Content-Type",
      "X-API-Key",
      "X-Hub-Signature-256",
      "X-GitHub-Event",
    ],
  })
);

// Health check
app.get("/api/v1/health", (c) =>
  c.json({ status: "ok", backend: "node", timestamp: new Date().toISOString() })
);

// Register routes
app.route("/api/v1", workspaceRoutes);
app.route("/api/v1", projectRoutes);
app.route("/api/v1", taskRoutes);
app.route("/api/v1", agentRoutes);
app.route("/api/v1", assignmentRoutes);
app.route("/api/v1", webhookRoutes);

// Start server
const port = Number(process.env.PORT) || 4001;
console.log(`🚀 Agent Kanban Node.js backend starting on port ${port}`);
console.log(`   Health: http://localhost:${port}/api/v1/health`);

serve({ fetch: app.fetch, port });

export default app;
