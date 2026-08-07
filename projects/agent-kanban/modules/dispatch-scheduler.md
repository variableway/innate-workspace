# PRD: 分配调度层 (Dispatch Scheduler)

## 一、模块定位

| 属性 | 值 |
|------|-----|
| **层级** | 调度层 |
| **职责** | 接收 Task Orchestrator 的匹配结果，创建 Assignment，管理 Agent 并发，触发执行 |
| **输入** | MatchResult (taskId, agentId, matchedLabel) |
| **输出** | Assignment 创建 → Agent Runtime 触发 |

## 二、用户故事

### US-1: 自动分配
When Task Orchestrator 产出匹配结果，Then Dispatch Scheduler 应自动创建 Assignment 记录并排队。

### US-2: 并发控制
While 一个 Agent 已经有 N 个 running 任务，Then 系统不应再分配新任务给它（默认 N=3）。

### US-3: 手动分配
When 用户在未匹配任务上手动选择 Agent，Then 系统创建 Assignment 并立即排队。

### US-4: 失败重试
If Agent 执行失败，Then 系统应记录失败原因，并将任务放回待分配队列（最多重试 2 次）。

### US-5: 分配历史
When 用户查看任务详情，Then 应能看到该任务的所有分配记录和时间线。

## 三、功能清单

| ID | 功能 | 优先级 | 说明 |
|----|------|--------|------|
| F1 | Assignment 创建 | P0 | 接收 MatchResult，创建 assignment 并设为 pending |
| F2 | Agent Pool 管理 | P0 | 维护每个 Agent 的 running 任务数，上限控制 |
| F3 | 并发控制 | P0 | 单 Agent 最多 N 个并行任务（可配置） |
| F4 | 队列管理 | P0 | pending → running 的状态推进 |
| F5 | 手动分配 API | P1 | POST /assignments 创建手动分配 |
| F6 | 失败重试 | P1 | 失败后自动重试，最多 2 次 |
| F7 | 分配超时 | P2 | pending 超过 30 分钟未拾取 → 告警 |
| F8 | 执行超时 | P2 | running 超过 2 小时 → 标记为 failed |

## 四、并发控制模型

```
Agent Pool 状态:

Agent: 前端专家 (Kimi)
  ├── maxConcurrency: 3
  ├── runningTasks: 2 ← 当前运行中
  ├── pendingTasks: 1  ← 排队中
  └── availableSlots: 1 ← 还可接收新任务

分配逻辑:
  def canAssign(agent):
    return agent.runningCount < agent.maxConcurrency

  def assign(matchResult):
    agent = getAgent(matchResult.agentId)
    if not canAssign(agent):
      return { queued: true }

    assignment = createAssignment(matchResult)
    assignment.status = 'pending'
    triggerAgent(assignment)  // 通知 Agent Runtime
    return { queued: false, assignment }
```

## 五、状态生命周期

```
                    ┌──────────┐
        create ────→│ pending  │
                    └────┬─────┘
                         │ Agent 拾取
                         ▼
                    ┌──────────┐
                    │ running  │
                    └────┬─────┘
                         │
               ┌─────────┼─────────┐
               │                   │
          执行成功             执行失败
               │                   │
               ▼                   ▼
          ┌────────┐         ┌────────┐
          │  done  │         │ failed │──→ 重试? ──→ pending
          └────────┘         └────────┘      │
                                       重试耗尽
                                           │
                                           ▼
                                      最终 failed
```

## 六、失败重试策略

| 次数 | 延迟 | 动作 |
|------|------|------|
| 第 1 次失败 | 立即 | assignment.status = pending, retry_count++ |
| 第 2 次失败 | 5 分钟后 | assignment.status = pending, retry_count++ |
| 第 3 次失败 | - | assignment.status = failed (最终)，task 保持 in_progress |

## 七、Agent 触发器

Agent 拾取任务的两种模式：

### 模式 A: Polling (MVP)
```
Agent 的 WorkBuddy Automation 每 5 分钟执行:
  1. 查询本 Agent 的 pending assignments
  2. 取最早的一条，设置 status = running
  3. 读取 task.body，作为执行 prompt
  4. 执行 (skills + model)
  5. 完成后更新 assignment.status = done
```

### 模式 B: Webhook Push (V2)
```
Dispatch Scheduler 分配成功后:
  POST <agent-webhook-url>
  Body: { taskId, title, body, labels, instruction }
  → Agent 收到后立即执行
```

## 八、API 设计

见 [spec/openapi.yaml](../spec/openapi.yaml) 中 Assignments 部分：
- `POST /assignments` — 手动分配
- `GET /tasks/{taskId}/assignments` — 任务分配历史
- `GET /agents/{agentId}/assignments` — Agent 负载列表

## 九、边界场景

| 场景 | 处理方式 |
|------|---------|
| Agent 全部 slots 满 | 任务保持 pending，等 slot 释放 |
| Agent 离线 (status=offline) | 不分配新任务，pending 任务不推进 |
| Agent 被删除 | 其 pending/running assignments 标记为 failed |
| 同一任务分配两次 | 幂等检查：已有 pending/running assignment 则拒绝 |
| Agent 拾取超时 (pending 超过 30 分钟) | 日志告警，不自动取消 |
| Agent 执行超时 (running 超过 2 小时) | 标记为 failed，释放 slot |

## 十、验收标准

- [ ] 匹配结果 1 秒内创建 Assignment
- [ ] 单 Agent 不超过 maxConcurrency 个并行任务
- [ ] 失败重试最多 2 次
- [ ] 手动分配 API 可在看板上触发
- [ ] pending 任务在 Agent 有空闲 slot 时自动推进
- [ ] 分配历史完整可追溯（时间线 + 状态变更）

## 十一、依赖

- 上游：Task Orchestrator (MatchResult)
- 下游：Agent Runtime (WorkBuddy Automation 或 Webhook)
