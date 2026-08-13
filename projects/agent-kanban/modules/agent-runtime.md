# PRD: Agent 执行层 (Agent Runtime)

## 一、模块定位

| 属性 | 值 |
|------|-----|
| **层级** | 执行层 |
| **职责** | AI Agent 的实际执行环境：经 TIP 认领任务 → 写 Artifact → 用模型 + Skills 执行 → complete/fail |
| **输入** | Assignment (pending) + Task + 既有 Artifacts |
| **输出** | TIP 消息；Artifact（plan/note/summary）；GitHub 短评论（经 Sync） |
| **协议** | 必须遵守 [agent-protocol.md](./agent-protocol.md)（TIP v0.1 + 闸动词） |
| **账本** | 必须写入 [artifact-store.md](./artifact-store.md) |
| **审查闸** | 阶段与 Skill 纪律见 [review-gates.md](./review-gates.md) |

> WorkBuddy Experts 是 **一种 Adapter 实现**，不是唯一运行时。CLI / MCP / 通用 Webhook Worker 同等合法。  
> **AGENTS.md / MCP 安装 / IDE 规则不是本模块的产物**；Adapter 只注入 bootstrap 指针，工作流以 `GET /assignments/{id}/bootstrap` 与 `kanban://workflow/*` 为准。

## 二、用户故事

### US-1: Agent 拉取或接收任务
When 有 pending Assignment，Then Agent 通过 Polling 或 Push 获知，并用 TIP `claim` 原子拾取。

### US-2: 先计划后编码
When claim 成功，Then Agent 先拉 bootstrap，按 `required_first_tip` 走 `kanban.intake` / `kanban.plan`；`submit_plan` 后 **停止编码**，直到闸批准（`resume` / stage=implement）。

### US-3: 协议 Skill 与领域 Skill
When 处于 wait_plan，Then 不得调用 `git-pr` 等领域 Skill。When implement，Then 使用 `agent.skills` + `kanban.implement`，并周期性 `progress` / `heartbeat`。

### US-4: 上下文感知
When 开始执行，Then 从 Issue body + 项目 Memory + 既有 Artifacts（含 handoff `context_ref`）构建 prompt。

### US-5: 结果回写
When 完成，Then 写 `summary` Artifact，发 TIP `complete`；任务进入 `in_review`（不直接 close Issue，除非策略配置）。

### US-6: 执行日志
While 执行，Then `note`/`log` Artifact + `kanban_audit_log` 记录步骤、token、耗时。

### US-7: 协作
When 自身职责完成但仍有后续工作，Then TIP `handoff` 给其他 Agent，而非改别人的 Assignment。

## 三、功能清单

| ID | 功能 | 优先级 | 说明 |
|----|------|--------|------|
| F1 | TIP claim / complete / fail | P0 | 取代「直接改 DB status」的私有路径 |
| F2 | Prompt 构建 | P0 | Issue + instruction + artifacts + memory |
| F3 | 模型 + Skills | P0 | 按 agent 配置 |
| F4 | 写 plan / summary | P0 | Artifact Store |
| F5 | progress / heartbeat | P0 | 看板可见阶段 |
| F6 | Push Adapter | P1 | 接收 Dispatch webhook |
| F7 | ask_human | P1 | 阻塞请示 |
| F8 | handoff | P1 | 多 Agent |
| F9 | WorkBuddy Automation 兼容 | P1 | MVP 可仍用 cron，但对外发 TIP |
| F10 | Memory 读写 | P2 | 项目级上下文 |

## 四、Agent 配置规范

```yaml
name: "前端开发专家"
role: "frontend"
model_name: "kimi-long-v1"
capability_tags: ["frontend", "ui", "component", "style"]
skills: ["react-component", "tailwind-css", "jest-test", "github-cli", "git-pr"]
# 协议 Skill 不写在此列表：由闸策略绑定 kanban.intake|plan|implement|verify|finalize
github_bot_account: "agent-frontend-bot"
max_concurrency: 3
adapter: "webhook"          # webhook | polling | cli | mcp
webhook_url: "https://..."  # adapter=webhook 时
```

## 五、执行主流程（TIP）

```
1. 获知 pending → TIP claim → GET bootstrap
2. kanban.intake → submit_spec（或闸 skipped）
3. kanban.plan → submit_plan → wait_plan（写完即停）
4. 人批 / 策略 skip → resume → implement（仅批准 plan 范围）
5. [可选] handoff → kanban.verify
6. kanban.finalize → summary → TIP complete → in_review
   或 TIP fail / ask_human / handoff
```

### Prompt 要点

- System：role + skills
- Spec：task.title/body + labels
- Plan：已批准/最新 plan 正文
- Handoff 上下文：`context_ref` 指向的 artifact
- 输出纪律：变更走分支/PR；状态只通过 TIP；长文进 Artifact

## 六、边界场景

| 场景 | 处理方式 |
|------|---------|
| 运行时重启 | lease 过期 → failed；可重试 |
| 空 Issue body | 仅 title + labels；plan 中声明假设 |
| 需人工决策 | ask_human，不假完成 |
| 多文件产物 | 开 PR，summary 带 pr_url |
| 计划被拒 | 修订新 version plan，再审 |

## 七、验收标准

- [ ] 所有状态变更经 TIP，不直写绕过协议（管理 API 除外）
- [ ] complete 必有 summary artifact，且 plan/spec 闸已过
- [ ] wait_plan 期间 Adapter 禁用 forbidden_until_plan_approved
- [ ] 成功路径 task=in_review，而非默认 close
- [ ] 至少一种非 WorkBuddy Adapter 可跑通 claim→complete
- [ ] handoff 后继 Agent 能读到 context_ref

## 八、依赖

- 协议：[agent-protocol.md](./agent-protocol.md)
- 账本：[artifact-store.md](./artifact-store.md)
- 审查闸：[review-gates.md](./review-gates.md)
- 上游：Dispatch Scheduler
- 下游：Orchestrator、Sync、Notifier
