import type { Stats } from "../api/client.js";

export function StatsBar({ stats }: { stats: Stats }) {
  return (
    <div className="stats-bar">
      <div className="stat-item">
        <span className="stat-value">{stats.totalTasks}</span>
        <span className="stat-label">总任务</span>
      </div>
      <div className="stat-item">
        <span className="stat-value open">{stats.backlogTasks}</span>
        <span className="stat-label">待规划</span>
      </div>
      <div className="stat-item">
        <span className="stat-value progress">{stats.inProgressTasks}</span>
        <span className="stat-label">进行中</span>
      </div>
      <div className="stat-item">
        <span className="stat-value progress">{stats.inReviewTasks}</span>
        <span className="stat-label">待审核</span>
      </div>
      <div className="stat-item">
        <span className="stat-value closed">{stats.doneTasks}</span>
        <span className="stat-label">已完成</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{stats.activeAgents}</span>
        <span className="stat-label">活跃 Agent</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{stats.totalProjects}</span>
        <span className="stat-label">项目</span>
      </div>
    </div>
  );
}
