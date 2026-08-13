# 手工 Kanban 操作手册

> 用 **Agent Kanban 自己的项目管理思路** 来做 Agent Kanban。  
> 系统尚未跑通自动循环，因此本目录是 **手工等价物**：列 = 看板列，任务卡 = 未来的 GitHub Issue，正文分区 = Artifact / 审查闸。  
> 架构：[shared-context/architecture.md](../shared-context/architecture.md)  
> 闸协议：[modules/review-gates.md](../modules/review-gates.md)  
> 能力里程碑：[suggestion/08-requirements-aligned-plan.md](../suggestion/08-requirements-aligned-plan.md)

---

## 一、总说明：我们在模拟什么

目标不是另造一套「文档待办」，而是 **提前按上线后的操作系统事**，这样：

1. 做出来的模块边界，就是现在每一步对应的职责。
2. 将来 Sync Engine 接上 GitHub 后，这些卡可以 **一对一迁成 Issue**（标题、AC、label、status:*）。
3. 每个人工动作都能回答：目的是什么、过的是哪一闸、将来由哪个模块自动做。

**状态 SoT（将来）**：GitHub Issue。  
**过程 SoT（现在就做）**：本目录 `tasks/*.md` 里的 Spec / Plan / Notes / Summary。  
**列**：`backlog | in_progress | in_review | done`（与产品四列一致）。  
**WIP**：进行中 ≤ 5，待审 ≤ 3（与产品 WIP 一致）——手工阶段建议更严：**进行中 ≤ 1**（一人一卡，对齐「一任务一上下文」）。

当前看板快照：[BOARD.md](./BOARD.md)。

---

## 二、端到端步骤（人现在做 ↔ 系统以后做）

```
0. 工作空间 / 项目
1. Spec 闸     把需求写成可验收范围
2. 入列        成为 backlog 卡片
3. 排序 + WIP  决定下一张动手的卡
4. 分配        人选 / 角色（将来 = Agent）
5. Plan 闸     写计划并停下等人批
6. Implement   只按批准的计划改
7. Verify      （可选）对照 AC / 测试
8. Code 闸     进入 in_review，人看 diff
9. Done        关卡 +（将来）IM 通知
10. 复盘       时间线可回放
```

下列每一步：**目的**、**手工做法**、**对应模块**、**将来自动化信号**。

### 步骤 0 — 工作空间与项目就绪

| | |
|--|--|
| **目的** | 明确「在哪个聚合容器、对哪个 GitHub Repo 做事」，避免任务漂在真空里。 |
| **手工** | 本仓库即 Workspace `agent-kanban`；Project 映射 `innate-works` 本产品目录。任务卡 `repo` 字段写死产品路径。 |
| **模块** | Portal 配置 + `kanban_workspace` / `kanban_project`（Dashboard 工作空间切换、Project 添加）。 |
| **自动化后** | `POST /workspaces`、`POST /projects`，Sync 全量拉 Issue。 |

### 步骤 1 — Spec 闸（Review spec）

| | |
|--|--|
| **目的** | 动手前范围可验收：有 AC、有非目标、有模块边界。欠定任务不准进实现。 |
| **手工** | 在任务卡填写 `## Spec` + `## Acceptance Criteria`。软动词（「先做一下」）必须改写成可勾选 AC，否则停在 backlog 并标注 `gate:spec=pending`。 |
| **模块** | [review-gates](../modules/review-gates.md) `kanban.intake`；Artifact `kind=spec`；需求正文将来以 GitHub Issue body 为 SoT。 |
| **自动化后** | TIP `submit_spec` / `ask_human`；欠定 `auto` 策略。 |

### 步骤 2 — 入列 backlog

| | |
|--|--|
| **目的** | 让工作可见、可排序，而不是散落在聊天里。 |
| **手工** | 新卡放入 [BOARD.md](./BOARD.md) 的 Backlog 段；`status: backlog`。 |
| **模块** | [sync-engine](../modules/sync-engine.md)（Issue opened → task）；[task-orchestrator](../modules/task-orchestrator.md) 聚合；[dashboard](../modules/dashboard.md) 第一列。 |
| **自动化后** | `issues.opened` webhook；label `status:backlog`。 |

### 步骤 3 — 优先级与 WIP（选下一张卡）

| | |
|--|--|
| **目的** | 先做 **能验证地基、且能解锁后续模块** 的卡；禁止并行撑破 WIP。 |
| **手工** | 按下节「优先级规则」选卡；`in_progress` 已有 1 张则不准再开新卡。 |
| **模块** | Orchestrator 优先级队列；Dashboard WIP；Dispatch 并发槽（`max_concurrency`）。 |
| **自动化后** | urgent/high label + `created_at`；WIP 超限 PATCH 409。 |

### 步骤 4 — 分配

| | |
|--|--|
| **目的** | 明确执行者与技能，避免「谁都做 / 谁都不做」。 |
| **手工** | 卡上 `assignee` + `labels`（如 `area:sync`）。现在执行者是人；角色名用模块名，便于以后换成 Agent。 |
| **模块** | [dispatch-scheduler](../modules/dispatch-scheduler.md) Assignment；Label Router（`capability_tags`）。 |
| **自动化后** | label 匹配 Agent → `assignment.pending` → claim。 |

### 步骤 5 — Plan 闸（Review plan）

| | |
|--|--|
| **目的** | 编码前暴露文件范围与风险；计划被拒的成本远低于改完再推翻。 |
| **手工** | 在卡上写 `## Plan`，把 `gate:plan` 改为 `submitted`，**停笔**。合并/继续前必须把 plan 改为 `approved`。 |
| **模块** | [artifact-store](../modules/artifact-store.md) `kind=plan`；TIP `submit_plan` / `resume`；Dashboard 批准按钮。 |
| **自动化后** | `wait_plan` 禁用 `git-pr` 等领域 Skill；未过闸 `complete` → 400。 |

### 步骤 6 — Implement

| | |
|--|--|
| **目的** | 只改 Plan 里声明的范围；过程留 notes，不把长日志塞进 Issue。 |
| **手工** | `## Notes` 按步骤追加；git 提交信息指向任务 ID（`AK-00x`）。 |
| **模块** | [agent-runtime](../modules/agent-runtime.md)；TIP `progress` / `heartbeat`；领域 Skill。 |
| **自动化后** | Adapter 调模型 + skills；lease 续租。 |

### 步骤 7 — Verify（可选拆分）

| | |
|--|--|
| **目的** | 用另一上下文（或另一角色）对照 AC，降低「自己写自己过」。 |
| **手工** | 跑相关测试 / 勾选 AC；需要时另开子卡 `blocks` 关系。 |
| **模块** | `kanban.verify`；TIP `handoff`；[task_edge](../docs/schema.sql) `parent_of` / `blocks`。 |
| **自动化后** | QA Agent Assignment；失败 `fail` + 重试策略。 |

### 步骤 8 — Code 闸（in_review）

| | |
|--|--|
| **目的** | Agent（或人）完成 ≠ 上线。人审 diff / PR / summary。 |
| **手工** | 卡移到 BOARD `in_review`；写 `## Summary`；等阅读者勾 AC。 |
| **模块** | Orchestrator：assignment done → `task.status=in_review`；Sync 写 `status:in-review`；Dashboard 第三列。 |
| **自动化后** | TIP `complete` 必带 summary；不自动 close Issue。 |

### 步骤 9 — Done 与通知

| | |
|--|--|
| **目的** | 关闭循环，让干系人知道「可依赖」。 |
| **手工** | 卡移 `done`；本阶段可用 commit / 口头同步。 |
| **模块** | Sync close Issue / `status:done`；[notifier](../modules/notifier.md) IM。 |
| **自动化后** | `assignment.completed` / `task.moved_in_review` 投递 Slack/飞书等。 |

### 步骤 10 — 复盘（时间线）

| | |
|--|--|
| **目的** | 下一张卡或下一 Agent 不靠翻聊天记录。 |
| **手工** | 同一 markdown 内保留 Spec→Plan→Notes→Summary，不删闸记录。 |
| **模块** | Artifact 时间线 API；Dashboard 详情面板。 |

---

## 三、优先级规则（选「可以先做」）

按顺序套用，与产品调度一致：

1. **地基未验证的，不做上层。** 同步与四列看板不绿，不准开工 Artifact/TIP。  
   → 对应模块：sync-engine、dashboard、task-orchestrator。
2. **契约未齐的，不写双后端实现。** OpenAPI / schema / types 是 SSOT。  
   → 对应：`docs/`（契约层，不是运行时模块）。
3. **过程 SoT 先于多 Agent。** 没有 Artifact + Plan 闸，handoff 没有 `context_ref`。  
   → artifact-store、review-gates。
4. **单 Agent TIP 闭环先于 handoff / IM / 炫酷可视化。**  
   → agent-protocol、agent-runtime；然后 dispatch handoff、notifier、dashboard swimlane。
5. **同一优先级：解锁下游最多、切片最小的先做。**

当前排序见 [BOARD.md](./BOARD.md) 数字序（AK-001 最先）。

---

## 四、任务卡格式（对应系统字段）

每张 `tasks/AK-xxx.md` 的 YAML 头：

| 字段 | 系统对应 |
|------|----------|
| `id` | Task.id / 将来 Issue 标题前缀 |
| `status` | Task.status（四列） |
| `priority` | Orchestrator priority |
| `labels` | GitHub labels / capability_tags |
| `assignee` | Assignment.agent（现为人） |
| `module` | 主模块 PRD |
| `gate.spec` / `gate.plan` | `kanban_gate` |
| `blocked_by` | `kanban_task_edge` |

正文分区：`Spec` → `Acceptance Criteria` → `Plan` → `Notes` → `Summary` = Artifact kinds。

---

## 五、本轮执行约定（WIP）

- 同时 `in_progress` **最多 1 张**。
- 无 `gate.plan=approved` 不准改业务代码（本手册/BOARD/任务卡本身算 Spec+Plan 产物，允许一次写入）。
- 完成一张必须有 Summary，再进入 in_review。
- 不把 innate-works 里无关子项目塞进同一张卡。
