import { useState, useEffect, useCallback } from "react";
import { api, type Workspace, type Stats } from "./api/client.js";
import { KanbanBoard } from "./components/KanbanBoard.js";
import { StatsBar } from "./components/StatsBar.js";
import { AgentsPage } from "./pages/AgentsPage.js";
import { ProjectsPage } from "./pages/ProjectsPage.js";

type Tab = "dashboard" | "agents" | "projects";

export default function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Init: create default workspace if none exists
  const initWorkspace = useCallback(async () => {
    try {
      const ws = await api.listWorkspaces();
      if (ws.length > 0) {
        setWorkspace(ws[0]);
      } else {
        const created = await api.createWorkspace("默认工作空间", "Agent Kanban 默认工作空间");
        setWorkspace(created);
      }
    } catch (e) {
      setError(`无法连接后端: ${(e as Error).message}。请确保后端已启动 (Go:8080 或 Node:4001)`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initWorkspace();
  }, [initWorkspace]);

  // Refresh stats
  const refreshStats = useCallback(async () => {
    if (!workspace) return;
    try {
      const s = await api.getStats(workspace.id);
      setStats(s);
    } catch { /* ignore */ }
  }, [workspace]);

  useEffect(() => {
    refreshStats();
    const timer = setInterval(refreshStats, 30000); // refresh every 30s
    return () => clearInterval(timer);
  }, [refreshStats]);

  if (loading) return <div className="loading">正在连接后端...</div>;
  if (error) return <div className="error-msg">{error}</div>;
  if (!workspace) return <div className="empty-state"><h2>未找到工作空间</h2></div>;

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <h1>🦞 Agent Kanban</h1>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {workspace.name}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a
            href={workspace ? `${import.meta.env.VITE_API_BASE || "/api/v1"}/health` : "#"}
            target="_blank"
            rel="noopener"
            style={{ fontSize: 11, color: "var(--text-secondary)" }}
          >
            API Health
          </a>
        </div>
      </header>

      <nav className="nav-tabs">
        <button className={`nav-tab ${tab === "dashboard" ? "active" : ""}`} onClick={() => setTab("dashboard")}>
          📋 看板
        </button>
        <button className={`nav-tab ${tab === "agents" ? "active" : ""}`} onClick={() => setTab("agents")}>
          🤖 Agents
        </button>
        <button className={`nav-tab ${tab === "projects" ? "active" : ""}`} onClick={() => setTab("projects")}>
          📁 项目
        </button>
      </nav>

      {tab === "dashboard" && (
        <>
          {stats && <StatsBar stats={stats} />}
          <KanbanBoard workspaceId={workspace.id} onStatsRefresh={refreshStats} />
        </>
      )}
      {tab === "agents" && <AgentsPage workspaceId={workspace.id} />}
      {tab === "projects" && <ProjectsPage workspaceId={workspace.id} />}
    </div>
  );
}
