import { useState, useEffect, useCallback } from "react";
import { api, type Agent } from "../api/client.js";

export function AgentsPage({ workspaceId }: { workspaceId: string }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);

  const load = useCallback(async () => {
    try {
      setAgents(await api.listAgents(workspaceId));
    } catch { /* ignore */ }
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div style={{ padding: "0 24px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 16 }}>AI Agents ({agents.length})</h2>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          + 注册 Agent
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="empty-state">
          <h2>还没有 Agent</h2>
          <p>注册一个 AI Agent 来开始处理任务</p>
        </div>
      ) : (
        <div className="card-grid">
          {agents.map(a => (
            <div key={a.id} className="info-card">
              <h3>🤖 {a.name}</h3>
              <p>角色: {a.role}</p>
              <p>模型: {a.modelName}</p>
              <p>状态: <span className={`tag tag-${a.status}`}>{a.status}</span></p>
              <p>并发上限: {a.maxConcurrency}</p>
              <div style={{ marginTop: 8 }}>
                {a.capabilityTags.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
              {a.skills.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Skills:</span>
                  {a.skills.map(s => <span key={s} className="tag">{s}</span>)}
                </div>
              )}
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button className="btn btn-small" onClick={() => { setEditing(a); setShowForm(true); }}>
                  编辑
                </button>
                <button className="btn btn-small" onClick={async () => {
                  await api.updateAgent(a.id, { status: a.status === "active" ? "paused" : "active" });
                  load();
                }}>
                  {a.status === "active" ? "暂停" : "激活"}
                </button>
                <button className="btn btn-small btn-danger" onClick={async () => {
                  if (confirm(`删除 Agent "${a.name}"?`)) { await api.deleteAgent(a.id); load(); }
                }}>
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AgentForm
          workspaceId={workspaceId}
          agent={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function AgentForm({ workspaceId, agent, onClose, onSaved }: {
  workspaceId: string;
  agent: Agent | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(agent?.name || "");
  const [role, setRole] = useState(agent?.role || "frontend");
  const [modelName, setModelName] = useState(agent?.modelName || "kimi-long-v1");
  const [tags, setTags] = useState(agent?.capabilityTags.join(", ") || "");
  const [skills, setSkills] = useState(agent?.skills.join(", ") || "");
  const [maxConcurrency, setMaxConcurrency] = useState(agent?.maxConcurrency || 3);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name || !role || !modelName) { alert("name, role, modelName 必填"); return; }
    setSaving(true);
    try {
      const data = {
        name, role, modelName, maxConcurrency,
        capabilityTags: tags.split(",").map(s => s.trim()).filter(Boolean),
        skills: skills.split(",").map(s => s.trim()).filter(Boolean),
      };
      if (agent) {
        await api.updateAgent(agent.id, data);
      } else {
        await api.createAgent(workspaceId, data);
      }
      onSaved();
    } catch (e) {
      alert(`保存失败: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{agent ? "编辑 Agent" : "注册新 Agent"}</h2>
        <div className="form-group">
          <label className="form-label">名称 *</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="前端开发专家" />
        </div>
        <div className="form-group">
          <label className="form-label">角色 *</label>
          <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
            <option value="frontend">frontend</option>
            <option value="backend">backend</option>
            <option value="data">data</option>
            <option value="devops">devops</option>
            <option value="docs">docs</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">模型 *</label>
          <select className="form-input" value={modelName} onChange={e => setModelName(e.target.value)}>
            <option value="kimi-long-v1">Kimi (kimi-long-v1)</option>
            <option value="glm-4-flash">GLM-4-Flash</option>
            <option value="glm-4-plus">GLM-4-Plus</option>
            <option value="hunyuan-pro">Hunyuan Pro</option>
            <option value="claude-sonnet-4">Claude Sonnet 4</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">能力标签 (逗号分隔，匹配 GitHub Labels)</label>
          <input className="form-input" value={tags} onChange={e => setTags(e.target.value)} placeholder="frontend, ui, component" />
        </div>
        <div className="form-group">
          <label className="form-label">Skills (逗号分隔)</label>
          <input className="form-input" value={skills} onChange={e => setSkills(e.target.value)} placeholder="react-component, tailwind-css" />
        </div>
        <div className="form-group">
          <label className="form-label">最大并发数</label>
          <input className="form-input" type="number" value={maxConcurrency} onChange={e => setMaxConcurrency(Number(e.target.value))} />
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
