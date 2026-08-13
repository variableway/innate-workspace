# PRD: Task Interaction Protocol（TIP）

## 一、模块定位

| 属性 | 值 |
|------|-----|
| **层级** | Agent 接入协议（跨 Runtime） |
| **职责** | 定义异构 AI Agent 与看板之间的标准交互信封，支持认领、进度、请示、交接与完成 |
| **输入** | Agent Adapter 发来的 TIP 消息；Dispatcher 的 pending Assignment |
| **输出** | Assignment / Task 状态变更；Artifact 写入；内部事件 |
| **文档代号** | TIP v0.1 |

## 二、为什么需要协议

当前设计默认「一个 Assignment ↔ 一个 WorkBuddy Expert」。实际需要：

- Cursor / Claude Code / Codex / 自建 Worker 同时接入
- 前端 Agent 做完 UI 后 **handoff** 给后端 Agent
- 阻塞时 **ask_human**，而不是静默 failed
- 所有执行动作可审计、可回放

协议保证：**看板不绑定某一 Agent 产品**，只绑定信封语义。

## 三、用户故事

### US-1: 统一认领
When Assignment 为 pending，Then 任意已注册 Adapter 可用 `claim` 原子拾取；冲突时仅一人成功。

### US-2: 进度可见
While 执行中，Then Agent 周期性 `heartbeat` / `progress`，看板显示阶段文案与可选百分比。

### US-3: 人工闸
When Agent 无法自行决策，Then 发 `ask_human`；任务保持 in_progress，详情展示待回答问题。

### US-4: 交接
When 当前 Agent 完成自身部分，Then `handoff` 指定目标 Agent + `context_ref`（artifact id）；系统创建新 Assignment，旧 Assignment done（kind=handed_off）。

### US-5: 完成 / 失败
When 工作结束，Then `complete` 或 `fail` 必须带 summary 引用或内联摘要；成功路径将 Task 推到 `in_review`。

### US-6: 审查闸
When Workspace 要求计划审批，Then Agent 必须 `submit_plan` 并等待批准，不得直接 `complete`。

## 四、信封格式（JSON）

```json
{
  "protocol": "tip",
  "version": "0.1",
  "message_id": "uuid",
  "type": "claim|heartbeat|progress|ask_human|submit_spec|submit_plan|resume|handoff|complete|fail|cancel",
  "timestamp": "2026-08-13T10:00:00Z",
  "agent_id": "uuid",
  "assignment_id": "uuid",
  "task_id": "uuid",
  "payload": {}
}
```

### 各 type 的 payload

| type | payload 要点 | 服务端效果 |
|------|----------------|------------|
| `claim` | `{}` 或 `{ lease_seconds }` | pending→running；写 audit |
| `heartbeat` | `{ lease_seconds? }` | 续租；超时未心跳 → failed |
| `progress` | `{ stage, message, percent?, artifact_id? }` | 更新进度缓存；可选挂 note |
| `ask_human` | `{ question, options? }` | 标记 blocked；Notifier 可选推 IM |
| `submit_spec` | `{ spec_artifact_id, ac: string[] }` | 闸 spec=submitted；按策略 wait_spec 或直接 plan |
| `submit_plan` | `{ plan_artifact_id }` | 闸 plan=submitted；wait_plan 或 skipped→implement |
| `resume` | `{ gate, artifact_id }` | **仅批准后由服务端触发/Agent 确认**；禁止自批 |
| `handoff` | `{ to_agent_id, reason, context_ref }` | 旧 done(handed_off)；新 pending |
| `complete` | `{ summary_artifact_id \| summary_md, pr_url? }` | assignment done；task→in_review |
| `fail` | `{ error, retryable, summary_md? }` | failed；按重试策略回流 |
| `cancel` | `{ reason }` | 取消；释放 slot |

## 五、接入方式（Adapter）

| 模式 | 说明 | 优先级 |
|------|------|--------|
| **A. HTTP Push** | Dispatch `POST agent.webhook_url` 推送 assignment；Agent 回调 `POST /api/v1/tip` | P0 |
| **B. Polling** | Agent 拉 `GET /agents/{id}/assignments?status=pending` 后 claim | P0（MVP） |
| **C. CLI** | `kanban tip claim|progress|…` 子命令，给本地 Coding Agent 用 | P1 |
| **D. MCP** | MCP tools 映射 TIP 动词（对齐 Backlog.md MCP 思路） | P2 |

`agent-runtime.md` 描述具体执行环境；**本文件只定协议与校验**。

## 六、幂等与安全

- `message_id` 唯一；重复投递返回上次结果
- `claim` 使用条件更新（`WHERE status='pending'`）
- 校验 `agent_id` 必须等于 assignment.agent_id（handoff 创建的新任务除外）
- 可选 HMAC：`X-Kanban-Signature` 对 body

## 七、功能清单

| ID | 功能 | 优先级 |
|----|------|--------|
| F1 | `POST /api/v1/tip` 接收信封 | P0 |
| F2 | claim 原子性 + lease | P0 |
| F3 | progress / heartbeat | P0 |
| F4 | complete / fail ↔ 状态机 | P0 |
| F5 | handoff 创建后继 Assignment | P1 |
| F6 | ask_human + 人工回复 API | P1 |
| F7 | CLI Adapter | P1 |
| F8 | MCP Adapter | P2 |
| F9 | 协议契约测试（双后端） | P0 |
| F10 | submit_spec / submit_plan / resume + stage 校验 | P0 |
| F11 | GET bootstrap 信封 | P0 |

## 八、验收标准

- [ ] 两并发 claim 仅一个成功
- [ ] complete 无 summary 时 400
- [ ] plan.required 且未过闸时 complete 400
- [ ] wait_plan 期间 progress(implement) 400
- [ ] handoff 后原 assignment 不再可 progress
- [ ] 超时无 heartbeat 标记 failed 并释放并发槽
- [ ] 事件 `tip.*` 写入 `docs/events.yaml` 且双后端实现一致

## 九、依赖

- 上游：Dispatch Scheduler（Assignment）
- 平级：Artifact Store（context_ref / summary / spec）
- 审查闸：[review-gates.md](./review-gates.md)
- 下游：Task Orchestrator（列迁移）、Notifier、Dashboard

## 十、审查闸与指令信封（TIP 增量）

产品「Spec → Plan → Code」在协议里拆成 stage + gate，详见 [review-gates.md](./review-gates.md)。本文件只列 **机器必须遵守** 的部分。

### 10.1 Assignment.stage 与 TIP 许可

服务端按 stage 拒绝非法 type（见 review-gates §三）。Adapter 必须先 `GET /assignments/{id}/bootstrap`，再按 `required_first_tip` 发信。

### 10.2 Bootstrap ≠ 指令入口文件

| 层 | 归属 | 内容 |
|----|------|------|
| AGENTS.md / CLAUDE.md / Cursor rules / MCP 安装 | **Adapter / 各 Agent 产品** | 仅允许短指针（`kanban://workflow/overview`） |
| `kanban-agent-bootstrap/v0.1` JSON | **本协议** | 当前闸、stage、禁止 Skill、TIP endpoint |
| `kanban://workflow/*` | **本服务托管** | 步骤说明，避免入口文件复制工作流 |

MCP 工具名与 TIP type 必须 1:1 可映射，例如 `tip_submit_plan` → `submit_plan`。

### 10.3 协议 Skill ID

`kanban.intake` | `kanban.plan` | `kanban.implement` | `kanban.verify` | `kanban.finalize`

实现形态不限（SKILL.md / 函数 / prompt 段落），**过闸只认 TIP + Artifact + kanban_gate**。
