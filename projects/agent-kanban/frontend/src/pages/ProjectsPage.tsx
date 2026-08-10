import { useState, useEffect, useCallback } from "react";
import { api, type Project } from "../api/client.js";

export function ProjectsPage({ workspaceId }: { workspaceId: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setProjects(await api.listProjects(workspaceId));
    } catch { /* ignore */ }
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => { load(); }, [load]);

  const handleSync = async (id: string) => {
    setSyncing(id);
    try {
      await api.syncProject(id);
      setTimeout(() => { load(); setSyncing(null); }, 3000);
    } catch (e) {
      alert(`同步失败: ${(e as Error).message}`);
      setSyncing(null);
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div style={{ padding: "0 24px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 16 }}>项目 ({projects.length})</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ 添加项目</button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <h2>还没有项目</h2>
          <p>添加一个 GitHub Repo 来开始同步 Issues</p>
        </div>
      ) : (
        <div className="card-grid">
          {projects.map(p => (
            <div key={p.id} className="info-card">
              <h3>📁 {p.name}</h3>
              <p>Repo: <a href={`https://github.com/${p.repoOwner}/${p.repoName}`} target="_blank" rel="noopener" style={{ color: "var(--accent-blue)" }}>
                {p.repoOwner}/{p.repoName}
              </a></p>
              <p>同步状态: <span className={`tag tag-${p.syncStatus === "idle" ? "active" : p.syncStatus === "error" ? "paused" : ""}`}>{p.syncStatus}</span></p>
              <p>最后同步: {p.lastSyncedAt ? new Date(p.lastSyncedAt).toLocaleString("zh-CN") : "从未"}</p>
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button className="btn btn-small" onClick={() => handleSync(p.id)} disabled={syncing === p.id}>
                  {syncing === p.id ? "同步中..." : "🔄 同步"}
                </button>
                <button className="btn btn-small btn-danger" onClick={async () => {
                  if (confirm(`移除项目 "${p.name}"?`)) {
                    await fetch(`/api/v1/projects/${p.id}`, { method: "DELETE" });
                    load();
                  }
                }}>
                  移除
                </button>
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-secondary)" }}>
                Webhook: POST /api/v1/webhooks/github
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ProjectForm
          workspaceId={workspaceId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function ProjectForm({ workspaceId, onClose, onSaved }: {
  workspaceId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [repoOwner, setRepoOwner] = useState("");
  const [repoName, setRepoName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name || !repoOwner || !repoName) { alert("所有字段必填"); return; }
    setSaving(true);
    try {
      await api.addProject(workspaceId, name, repoOwner, repoName);
      onSaved();
    } catch (e) {
      alert(`添加失败: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>添加 GitHub 项目</h2>
        <div className="form-group">
          <label className="form-label">项目名称 *</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="前端项目" />
        </div>
        <div className="form-group">
          <label className="form-label">GitHub Owner *</label>
          <input className="form-input" value={repoOwner} onChange={e => setRepoOwner(e.target.value)} placeholder="my-org" />
        </div>
        <div className="form-group">
          <label className="form-label">Repo Name *</label>
          <input className="form-input" value={repoName} onChange={e => setRepoName(e.target.value)} placeholder="frontend-app" />
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "添加中..." : "添加"}
          </button>
        </div>
      </div>
    </div>
  );
}
