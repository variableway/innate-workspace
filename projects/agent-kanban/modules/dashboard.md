# PRD: 统一看板 (Dashboard)

## 一、模块定位

| 属性 | 值 |
|------|-----|
| **层级** | 展现层 |
| **职责** | 提供跨项目、跨 Agent 的统一 Kanban 视图，支持筛选、排序、手动操作 |
| **输入** | API 聚合的任务数据 |
| **输出** | 可视化看板界面 |

## 二、用户故事

### US-1: 跨项目 Kanban
When 用户打开看板，Then 应看到所有项目的任务按状态分列（待处理 | 进行中 | 已完成）。

### US-2: 按 Agent 筛选
When 用户选择特定 Agent，Then 看板应只展示该 Agent 正在处理或已处理的任务。

### US-3: 按项目筛选
When 用户选择特定项目，Then 看板应只展示该 GitHub Repo 的任务。

### US-4: 未分配任务高亮
When 有任务的标签无法匹配 Agent，Then 该任务在看板上应用醒目样式提示。

### US-5: 手动分配
When 用户点击未分配任务的"分配"按钮，Then 应弹出 Agent 选择器，手动完成分配。

### US-6: 任务详情
When 用户点击任务卡片，Then 应展开详情面板，显示 Issue body、分配历史、Agent 执行日志。

### US-7: 统计概览
When 用户查看顶部统计栏，Then 应看到总任务数、各状态计数、Agent 负载。

## 三、功能清单

| ID | 功能 | 优先级 | 说明 |
|----|------|--------|------|
| F1 | Kanban 三列视图 | P0 | 待处理 / 进行中 / 已完成 |
| F2 | 任务卡片 | P0 | 显示 title、project、labels、agent、priority |
| F3 | 多维度筛选 | P0 | 按 project、agent、label、status 筛选 |
| F4 | 统计概览栏 | P0 | 总数、各状态计数、Agent 活跃数 |
| F5 | 任务详情面板 | P1 | 展开显示 body、分配历史、日志 |
| F6 | 手动分配 | P1 | 未匹配任务的分配按钮 + Agent 选择器 |
| F7 | 实时更新 | P1 | WebSocket 或轮询驱动看板自动刷新 |
| F8 | 工作空间切换 | P1 | 支持多个 Workspace |
| F9 | Agent 负载视图 | P2 | 展示每个 Agent 的 running/pending/done 数量 |
| F10 | 暗色模式 | P2 | 支持 light/dark 切换 |

## 四、页面布局

```
┌─────────────────────────────────────────────────────────┐
│  Agent Kanban                        [Workspace 选择器]  │
├─────────────────────────────────────────────────────────┤
│  ● 总任务: 42  ○ 待处理: 15  ◉ 进行中: 8  ◎ 完成: 19  │
│  Agents 在线: 3/4                                      │
├─────────────┬─────────────┬──────────────┬──────────────┤
│ [All Projects] [All Agents] [All Labels] │  🔍 搜索     │
├─────────────┴─────────────┴──────────────┴──────────────┤
│  待处理 (15)  │  进行中 (8)  │  已完成 (19)              │
│ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐              │
│ │ [frontend]│ │ │ [backend]│ │ │ [data]   │              │
│ │ 登录页面  │ │ │ API 设计 │ │ │ 月报表   │              │
│ │ front-app │ │ │ back-svc │ │ │ data-pipe│              │
│ │ ⚠ 未分配  │ │ │ GLM      │ │ │ ✅ Hunyuan│            │
│ │ [分配]    │ │ │ ● running│ │ │ 2h ago   │              │
│ └──────────┘ │ └──────────┘ │ └──────────┘              │
│ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐              │
│ │ [frontend]│ │ │ [frontend]│ │ │ [backend]│              │
│ │ 导航重构  │ │ │ 表单校验  │ │ │ 数据库迁移│             │
│ │ front-app │ │ │ front-app │ │ │ back-svc │              │
│ │ Kimi      │ │ │ Kimi      │ │ │ ✅ GLM   │              │
│ │ ◉ pending │ │ │ ● running │ │ │ 1d ago   │              │
│ └──────────┘ │ └──────────┘ │ └──────────┘              │
└─────────────┴─────────────┴──────────────────────────────┘
```

## 五、任务卡片规格

```
┌─────────────────────────────┐
│ [label badges: frontend ui] │  ← GitHub Labels
│                             │
│ 实现用户登录页面             │  ← task.title
│ my-org/frontend-app #42     │  ← project_name + issue_number
│                             │
│ Kimi ● running              │  ← agent_name + status indicator
│ 创建于 2 小时前             │  ← relative time
└─────────────────────────────┘

状态颜色编码:
  pending    → 灰色边框
  running    → 蓝色边框 + 呼吸动画
  done       → 绿色边框 + 半透明
  failed     → 红色边框
  unassigned → 橙色虚线边框 + ⚠ 图标
```

## 六、详情面板

```
┌──────────────────────────────────────┐
│  实现用户登录页面                  ✕  │
│  ──────────────────────────────────  │
│  my-org/frontend-app #42             │
│  Labels: frontend, ui                │
│  Status: in_progress                 │
│  Agent: 前端开发专家 (Kimi)          │
│                                      │
│  Issue Body:                         │
│  需要实现一个支持邮箱+密码登录的...   │
│                                      │
│  ── 分配历史 ──                      │
│  ● 2026-08-02 14:00 Agent 开始执行   │
│  ● 2026-08-02 13:55 自动分配         │
│                                      │
│  [在 GitHub 查看] [重新分配]         │
└──────────────────────────────────────┘
```

## 七、状态筛选交互

| 筛选器 | 类型 | 选项 |
|--------|------|------|
| 项目 | Dropdown | All / 项目列表 |
| Agent | Dropdown | All / 活跃 Agent 列表 |
| Label | Multi-select | frontend / backend / data / bug / feature |
| 状态 | Tab | All / 待处理 / 进行中 / 已完成 |
| 搜索 | Input | 标题模糊搜索 |

## 八、数据刷新策略

| 模式 | 机制 | 适用 |
|------|------|------|
| 初始加载 | GET /workspaces/{id}/tasks | 页面首次打开 |
| 自动刷新 | 每 30 秒轮询 | MVP 方案 |
| 实时推送 | WebSocket / SSE | V2 方案 |
| 手动刷新 | 刷新按钮 | 用户随时可用 |

## 九、技术选型

| 层 | 选择 |
|----|------|
| 框架 | React 18 + TypeScript |
| 状态管理 | TanStack Query (缓存 + 轮询) |
| UI 组件 | Tailwind CSS + Radix UI |
| Kanban 拖拽 | @dnd-kit/core |
| 时间格式化 | date-fns |
| 构建 | Vite |

## 十、文件结构建议

```
src/
├── components/
│   ├── Dashboard/
│   │   ├── DashboardPage.tsx        # 主页面
│   │   ├── KanbanBoard.tsx          # 看板容器
│   │   ├── KanbanColumn.tsx         # 单列 (待处理/进行中/已完成)
│   │   ├── TaskCard.tsx             # 任务卡片
│   │   ├── TaskDetailPanel.tsx      # 详情滑出面板
│   │   ├── StatsBar.tsx             # 顶部统计
│   │   ├── FilterBar.tsx            # 筛选器
│   │   └── AssignDialog.tsx         # 手动分配对话框
│   ├── Agent/
│   │   ├── AgentPoolView.tsx        # Agent 负载视图
│   │   └── AgentCard.tsx            # Agent 信息卡片
│   └── common/
│       ├── StatusBadge.tsx
│       ├── LabelBadge.tsx
│       └── RelativeTime.tsx
├── hooks/
│   ├── useTasks.ts                  # TanStack Query: tasks
│   ├── useAgents.ts                 # TanStack Query: agents
│   ├── useAssignments.ts            # TanStack Query: assignments
│   └── useWorkspaceStats.ts         # TanStack Query: stats
├── api/
│   └── client.ts                    # API 客户端 (基于 openapi.yaml)
└── types/
    └── index.ts                     # 从 spec/types.ts 同步
```

## 十一、边界场景

| 场景 | 处理方式 |
|------|---------|
| 任务列表为空 | 显示引导提示: "暂无任务，请先在 GitHub 创建 Issue" |
| 项目列表为空 | 显示引导提示 + 添加项目按钮 |
| Agent 列表为空 | 显示引导提示 + 注册 Agent 按钮 |
| API 请求失败 | Toast 错误提示 + 重试按钮 |
| 大量任务 (500+) | 虚拟滚动 / 分页加载 |
| 网络断开 | 显示离线状态标记，恢复后自动重连 |
| 多 Workspace | 顶部选择器切换，URL 参数传递 workspaceId |

## 十二、验收标准

- [ ] 所有项目的任务聚合在三个 Kanban 列中
- [ ] 支持按项目/Agent/Label 多维度筛选
- [ ] 未分配任务有明显视觉区分
- [ ] 点击任务卡片展示详情面板
- [ ] 手动分配功能可用
- [ ] 统计数据实时准确
- [ ] 移动端响应式布局基本可用
- [ ] 页面初始加载 < 2 秒

## 十三、依赖

- 上游：所有 API (Workspace/Project/Task/Agent/Assignment)
- 运行环境：现代浏览器 (Chrome/Edge/Firefox/Safari 最新两个版本)
