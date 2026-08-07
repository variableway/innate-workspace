# PRD: 任务编排引擎 (Task Orchestrator)

## 一、模块定位

| 属性 | 值 |
|------|-----|
| **层级** | 业务逻辑层 |
| **职责** | 聚合多项目任务、管理任务状态机、根据标签匹配 Agent |
| **输入** | Sync Engine 写入的 Task 变更事件 |
| **输出** | 匹配结果 → Dispatch Scheduler |

## 二、用户故事

### US-1: 跨项目聚合
When 用户打开看板，Then 系统应展示所有项目（跨 GitHub Repo）的任务，按状态分列。

### US-2: 标签路由
When 任务被创建且带有标签（如 `frontend`），Then 系统应自动匹配对应 Agent（capability_tags 含 `frontend`），并触发分配。

### US-3: 状态流转
While 任务从 open → in_progress → closed，Then 看板应实时反映状态变化，无需手动刷新。

### US-4: 优先级队列
When 多个任务匹配到同一个 Agent，Then 系统应按优先级（urgent > high > medium > low）和创建时间排序。

### US-5: 未匹配任务提醒
If 任务的标签无法匹配到任何 Agent，Then 系统应在看板上高亮标记，提示人工介入。

## 三、功能清单

| ID | 功能 | 优先级 | 说明 |
|----|------|--------|------|
| F1 | 任务聚合查询 | P0 | 跨项目获取所有 Task，支持筛选 |
| F2 | 标签匹配引擎 | P0 | 解析 task.labels → 匹配 agent.capability_tags |
| F3 | 状态机管理 | P0 | 控制 open → in_progress → closed 的合法流转 |
| F4 | 优先级排序 | P1 | 按 priority + created_at 对匹配任务排序 |
| F5 | 未匹配检测 | P1 | 标记无 Agent 匹配的任务，在看板高亮 |
| F6 | 变更通知 | P1 | 新任务 / 状态变更时推送通知到 Dashboard |
| F7 | 批量路由 | P2 | 一次匹配并分配所有 pending 状态的任务 |

## 四、核心算法

### 4.1 标签匹配引擎

```
function matchAgent(task, agents):
  taskLabels = parseLabels(task.labels)  // ["frontend", "bug"]

  for agent in agents (status = active):
    agentTags = parseTags(agent.capability_tags)  // ["frontend", "ui"]
    matched = taskLabels ∩ agentTags               // 交集
    if matched.length > 0:
      candidates.push({
        agent: agent,
        score: matched.length,        // 匹配标签越多分数越高
        matchedLabels: matched
      })

  // 按分数降序排列，取最高分
  candidates.sort(by score DESC)

  if candidates.length == 0:
    return { matched: false }

  winner = candidates[0]
  return { matched: true, agentId: winner.agent.id, label: winner.matchedLabels[0] }
```

### 4.2 状态机

```
                  ┌─────────┐
                  │  open   │  ← Issue 新建 / reopened
                  └────┬────┘
                       │ Agent 匹配 + 分配
                       ▼
                  ┌──────────┐
                  │ in_progress │
                  └────┬─────┘
                       │
              ┌────────┼────────┐
              │                 │
          Agent 成功        Agent 失败
              │                 │
              ▼                 ▼
         ┌────────┐      ┌──────────┐
         │ closed │      │ in_progress│ (保持，等下一轮或人工处理)
         └────────┘      └──────────┘

合法流转:
  open        → in_progress (Assign)
  in_progress → closed      (Agent done)
  in_progress → open        (Agent failed, 人工重置)
  closed      → open        (GitHub reopened)
```

### 4.3 优先级排序

```
Priority 映射:
  urgent → 4 (最高)
  high   → 3
  medium → 2
  low    → 1

排序规则:
  1. priority DESC (urgent 优先)
  2. created_at ASC (先到先处理)
```

## 五、触发机制

| 触发源 | 时机 | 动作 |
|--------|------|------|
| Webhook: issue.opened | 新 Issue 创建 | 写入 Task → 执行标签匹配 → 触发 Dispatch |
| Webhook: issue.labeled | 新增标签 | 重新执行标签匹配 → 可能触发 Dispatch |
| Webhook: issue.reopened | Issue 重新打开 | task.status = open → 执行标签匹配 |
| Webhook: issue.closed | Issue 关闭 | task.status = closed（不触发 Dispatch） |
| Polling: 定时 | 每 5 分钟 | 检测未匹配任务，重试匹配 |

## 六、数据输出

匹配成功后产出 `MatchResult`，传递给 Dispatch Scheduler：

```typescript
{
  taskId: "uuid",
  agentId: "uuid",
  matchedLabel: "frontend",
  priority: 3,
  timestamp: "2026-08-02T08:00:00Z"
}
```

## 七、边界场景

| 场景 | 处理方式 |
|------|---------|
| 任务有多个标签匹配多个 Agent | 取分数最高的（匹配标签最多的 Agent） |
| 任务标签变更（从 frontend 改为 backend） | 当前运行的 Assignment 不变，新分配用新 Agent |
| Agent 全部处于 paused 状态 | 任务标记未匹配，看板高亮 |
| 任务没有标签 | 标记未匹配，提示人工添加标签 |
| 同一任务被多次匹配 | Assignment 幂等检查：已有 pending/running 的不再创建 |

## 八、验收标准

- [ ] 新任务的标签能在 3 秒内匹配到 Agent
- [ ] 跨 3 个项目的任务在一个查询中聚合返回
- [ ] 状态流转只允许合法路径（不允许 closed → in_progress）
- [ ] 未匹配任务在看板上可见且有视觉区分
- [ ] 同一任务不会重复创建 Assignment
- [ ] 标签变更后匹配到新 Agent（如有）

## 九、依赖

- 上游：Sync Engine (SQLite tasks 表)
- 下游：Dispatch Scheduler
