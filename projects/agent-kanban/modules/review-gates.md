# PRD: 审查闸（Spec → Plan → Code）与协议 Skill

> 对齐 Backlog.md 的「人审三关」，但 **Kanban 只定协议与闸**，不拥有 AGENTS.md / MCP 安装 / 各 IDE 指令文件。  
> 机器契约见 [agent-protocol.md](./agent-protocol.md) §十。  
> 账本见 [artifact-store.md](./artifact-store.md)。  
> Adapter / Runtime 见 [agent-runtime.md](./agent-runtime.md)。

## 一、结论（先读）

| 问题 | 答案 |
|------|------|
| 要不要 Skill？ | **要，但分两层**：协议 Skill（过闸纪律）≠ 领域 Skill（写 React / 开 PR） |
| 要不要拆？ | **要**。产品口头「三关」拆成 **4 个协议阶段**（Spec / Plan / Implement / Verify），第 3 关 Code Review 落在看板 `in_review`，可再 handoff 给 QA Agent |
| Agent 指令入口归谁？ | **Adapter 模块**（CLI / MCP / WorkBuddy / Cursor 规则）。Kanban 只发布 **Bootstrap 信封** + **Workflow URI**，各入口必须先拉信封再动手 |
| 协议长什么样？ | TIP 增加 `submit_spec` / `submit_plan` / `resume`；Assignment 带 `stage`；每闸一条 `kanban_gate` 记录 |

## 二、为什么「三关」不够细

Backlog.md 的三关是给人看的检查点，混了三种不同东西：

| 口头三关 | 实际发生的事 | 执行者 | 若合成一步的风险 |
|----------|--------------|--------|------------------|
| Review spec | 把 Issue 变成可验收范围（AC / 拆子任务） | 人，或 Intake Agent | 欠定任务直接开写 |
| Review plan | 对照代码库写实现计划，等人批 | 被分配的实现 Agent | 计划与编码抢同一上下文窗口 |
| Review code | PR + 看板待审 | 人（可另派 Verify Agent） | Agent `complete` 被当成已上线 |

因此协议层拆成 **阶段（stage）**，产品对外仍可叫「三关」。

```
G1 Spec     G2 Plan              G3 Code
────────    ──────────────       ────────────────────────────
  spec   →    plan → wait_plan →  implement → [verify] → in_review → done
                 ↑ approve/reject      ↑ 可 handoff 给 QA Agent
```

`in_review` 是 **人类 Code 关**，不是 Agent 的 stage。

## 三、阶段状态机（Assignment.stage）

```
claim
  │
  ▼
intake ──(spec 闸 skipped 或已有合格 spec)──► plan
  │                                              │
  │ submit_spec                                  │ submit_plan
  ▼                                              ▼
wait_spec ◄── reject ── spec gate            wait_plan ◄── reject
  │ approve                                      │ approve / skip
  ▼                                              ▼
plan                                          implement
                                                 │
                                                 ├─ handoff(to=qa) → verify（新 Assignment）
                                                 │
                                                 └─ finalize → TIP complete → task.in_review
```

合法约束（服务端强制，不靠模型自觉）：

| 当前 stage | 允许的 TIP | 禁止 |
|------------|------------|------|
| `intake` / `wait_spec` | `submit_spec`、`ask_human`、`fail`、`cancel` | `complete`、进入实现文件的「完成」声明 |
| `plan` / `wait_plan` | `submit_plan`、`ask_human`、`fail` | `complete`（plan 闸 `required` 时） |
| `implement` | `progress`、`handoff`、`ask_human` | `complete` 若 verify 闸 `required` |
| `verify` | `progress`、`complete`、`fail` | 改与 AC 无关的范围（靠 plan artifact 对照，抽检） |
| `wait_*` | 仅 `heartbeat` / `cancel` / `fail` | 任何 submit_* / complete |

Workspace 策略可把某闸设为 `skipped`（见 §六），此时表中「禁止 complete」解除到下一闸。

## 四、Skill 分层：协议 Skill vs 领域 Skill

**Kanban 不实现领域 Skill**（那是 Agent 自己的工具箱）。Kanban **定义协议 Skill 的 ID、输入输出与必须调用的 TIP**。Adapter 可以用 Cursor Skill / Claude Skill / 内部函数实现同等行为，但 **对外 ID 必须稳定**。

### 4.1 协议 Skill（过闸用，P0）

| Skill ID | 绑定阶段 | 必做 | 产出 Artifact | 必发 TIP |
|----------|----------|------|---------------|----------|
| `kanban.intake` | intake | 检测欠定：无 AC、范围不清、成功标准缺失 → 补 spec 或 `ask_human` | `kind=spec`（AC 清单） | `submit_spec` 或 `ask_human` |
| `kanban.plan` | plan | 读仓库现状，写可执行计划；**写完即停** | `kind=plan` | `submit_plan` |
| `kanban.implement` | implement | **只执行已批准 plan**；步骤写入 note | `kind=note` / `log` | `progress`（stage=implement） |
| `kanban.verify` | verify | 跑测试 / lint / 对照 AC；不扩 scope | `kind=note`（验证记录） | `progress` 后 `complete` 或 `fail` |
| `kanban.finalize` | implement 末或 verify 后 | 写摘要 + PR 链接 | `kind=summary` | `complete` |

`kanban.intake` 的欠定检测应对齐工程常识（范围 / 验收 / 禁止项），可参考 underspec 思路，但 **阈值与字段是 Kanban 契约**，不绑定某个 IDE glossary skill。

### 4.2 领域 Skill（Agent.skills，P0 配置 / 非本模块实现）

例如 `git-pr`、`react-component`、`github-cli`。只允许在 `implement` / `verify` / `finalize` 调用。  
**协议 Skill 编排领域 Skill**，反过来不行：禁止 `git-pr` 在 `wait_plan` 时直接推代码。

### 4.3 谁实现这些 Skill

| 运行时 | 协议 Skill 落点 | 指令入口（非本模块） |
|--------|-----------------|----------------------|
| Cursor | `.cursor/skills/kanban-*/SKILL.md` 或用户技能库 | `AGENTS.md` 一行 bootstrap |
| Claude Code | `SKILL.md` / slash command | `CLAUDE.md` 一行 bootstrap |
| CLI Worker | `tools/kanban-skills/*.mjs` 调 TIP | `kanban tip …` |
| WorkBuddy | Expert prompt 内嵌同等步骤 | Automation prompt |
| MCP | tools 名 = TIP 动词（见 §五） | MCP resource `kanban://workflow/overview` |

验收：**换 Adapter 不换信封**。看板只检查 TIP + Artifact + Gate，不检查 Skill 文件是否存在。

## 五、指令入口协议（Bootstrap Envelope）

Kanban **不维护** 各产品的 AGENTS.md。它发布一份 **机器可读信封**；各 Adapter 负责把「请先读信封」写进自己的入口文件。

### 5.1 拉取

```
GET /api/v1/assignments/{id}/bootstrap
Authorization: agent token
```

Claim 成功后 **第一次模型调用之前** 必须拉取（Push 模式可把同一 JSON 放进 webhook body.bootstrap）。

### 5.2 信封 schema（`kanban-agent-bootstrap/v0.1`）

```json
{
  "protocol": "kanban-agent-bootstrap",
  "version": "0.1",
  "assignment_id": "uuid",
  "task_id": "uuid",
  "agent_id": "uuid",
  "tip_endpoint": "https://kanban.example/api/v1/tip",
  "workflow_uris": {
    "overview": "kanban://workflow/overview",
    "spec": "kanban://workflow/spec",
    "plan": "kanban://workflow/plan",
    "implement": "kanban://workflow/implement",
    "finalize": "kanban://workflow/finalize"
  },
  "gates": {
    "spec": { "required": true, "status": "pending", "skill": "kanban.intake" },
    "plan": { "required": true, "status": "pending", "skill": "kanban.plan" },
    "verify": { "required": false, "status": "skipped", "skill": "kanban.verify" },
    "code": { "required": true, "reviewer": "human", "column": "in_review" }
  },
  "stage": "intake",
  "spec": {
    "source": "github_issue",
    "title": "…",
    "body": "…",
    "labels": ["frontend"],
    "github_url": "https://github.com/org/repo/issues/42",
    "spec_artifact_id": null
  },
  "allowed_skills": ["kanban.intake", "kanban.plan", "kanban.implement", "kanban.finalize", "git-pr"],
  "forbidden_until_plan_approved": ["git-pr", "kanban.implement"],
  "required_first_tip": "submit_spec"
}
```

语义：

- `workflow_uris`：人类/Agent 可读的步骤说明（MCP resource 或 `GET /api/v1/workflow/{name}`）。**内容由 Kanban 托管**，入口文件只存 URI。
- `required_first_tip`：当前 stage 下第一个合法 TIP，防止 Agent 一上来 `complete`。
- `forbidden_until_plan_approved`：领域 Skill 黑名单，Adapter 应转成工具禁用；服务端仍以 stage 禁 TIP 为最后防线。

### 5.3 Adapter 对入口文件的义务（非 Kanban 实现）

各入口 **只允许** 增加短指针，禁止复制整份工作流（防漂移）：

```markdown
<!-- kanban-bootstrap -->
开始任何 Issue 任务前：读取 assignment bootstrap
（MCP: kanban://workflow/overview 或 CLI: kanban bootstrap <assignment_id>）。
状态与进度只通过 TIP，不要直接改 GitHub 列。
<!-- /kanban-bootstrap -->
```

映射表（Adapter 实现，协议要求 **等价**）：

| 入口形态 | 发现 bootstrap | 发 TIP |
|----------|----------------|--------|
| MCP | resource `kanban://assignment/{id}/bootstrap` | tools: `tip_claim` / `tip_submit_plan` / … |
| CLI | `kanban bootstrap <id>` | `kanban tip submit-plan …` |
| HTTP Push | webhook JSON 字段 `bootstrap` | `POST /api/v1/tip` |
| IDE 规则 | AGENTS.md 指针 → CLI 或 MCP | 同上 |

### 5.4 Workflow URI 最低内容

| URI | 必须写清 |
|-----|----------|
| `overview` | 阶段顺序、何谓停、何谓过闸 |
| `spec` | AC 模板、何时 `ask_human` |
| `plan` | 计划模板（目标 / 文件范围 / 步骤 / 风险 / 不做什么）、提交后等待 |
| `implement` | 只改 plan 范围内文件；每步 `progress` |
| `finalize` | summary 字段、`pr_url`、然后 `complete` |

## 六、闸策略（Workspace / Project）

```yaml
# 概念配置，落地可放 kanban_workspace.settings JSON
gates:
  spec:
    required: auto          # always | never | auto（欠定才要求）
    underspec_signals: [missing_ac, empty_body, no_scope]
    reviewer: human         # human | none（none=Agent submit 即过）
    skill: kanban.intake
  plan:
    required: always        # 默认真闸
    skip_labels: [chore, docs, typo]
    reviewer: human
    skill: kanban.plan
  verify:
    required: never         # M3 可改 always，并 handoff 给 qa Agent
    skill: kanban.verify
    handoff_role: qa
  code:
    required: always        # 对应列 in_review，无 TIP 可跳过
    reviewer: human
```

`auto` 欠定信号（intake 写入 `spec` artifact 的 `meta`，服务端可再判）：

- Issue body 空或 < N 字
- 无 Acceptance Criteria 段落 / 无 `kind=spec` 且无 checklist
- 标题为软动词（「优化一下」「修一下」）且无路径

## 七、TIP 闸动词（相对 v0.1 增量）

信封仍用 [agent-protocol.md](./agent-protocol.md) 外壳。新增 `type`：

| type | payload | 服务端 |
|------|---------|--------|
| `submit_spec` | `{ spec_artifact_id, ac: string[] }` | upsert gate=spec submitted；reviewer=none 则直接 approved 并 `stage=plan`；否则 `wait_spec` |
| `submit_plan` | `{ plan_artifact_id }` | gate=plan submitted；按策略 `wait_plan` 或 skipped→`implement` |
| `resume` | `{ gate, artifact_id }` | **仅服务端在批准后推给 Agent**（或 Agent 轮询到 stage 变化后发此心跳式确认）。Agent 不得用 resume 自批 |

人工：

```
POST /api/v1/gates/{gate_id}/decide
{ "decision": "approved" | "rejected", "comment"?: string }
```

- approved → 下一 stage；Push Adapter 则 POST agent webhook `{ type: "gate.approved", bootstrap }`  
- rejected → 回到 `spec` 或 `plan`，Agent 写新 version artifact

`complete` 额外校验：

- `code` 闸存在时：task → `in_review`（已有）
- `plan.required` 且 gate 非 approved/skipped → **400**
- `spec.required` 且 gate 非 approved/skipped → **400**
- 必须有 `summary` artifact（已有）

## 八、Artifact 约定（闸产出）

| kind | 谁写 | 模板要点 |
|------|------|----------|
| `spec` | intake Agent 或人 | 背景、范围、AC 清单、非目标、依赖 Issue |
| `plan` | plan Agent | 现状结论、拟改文件、步骤、风险、回滚、**停在批准前** |
| `note`/`log` | implement / verify | 步骤级 |
| `summary` | finalize | 做了什么、PR、未做项、如何验证 |
| `decision` | 人 | 驳回理由、范围变更 |

Spec 的 **需求正文仍以 GitHub Issue 为 SoT**；`kind=spec` 是结构化 AC 叠加层，不是第二份需求。

## 九、多 Agent 怎么拆（可选，M3）

同一父任务不必同一 Agent 跑完四阶段：

```
Spec Agent  --submit_spec-->  (人批)
Impl Agent  --submit_plan-->  (人批) --implement-->
QA Agent    --handoff verify--> complete --> in_review
```

规则：

- 每个阶段可以是新 Assignment；`handoff.context_ref` 指向刚过闸的 artifact
- `kanban.plan` 与 `kanban.implement` **建议不同会话**（对齐 Backlog.md「一任务一上下文」；同一 Agent 角色也可以，但必须 `wait_plan` 中断）
- 禁止在 `wait_plan` 期间预写业务代码并藏在本地（协议无法完全禁止本地动作，**complete 时 diff 应能被 verify/人审抓住**；文档要求 Adapter 在 wait_* 停工具）

## 十、与看板列的关系

| 列 | 典型 stage | 人看什么 |
|----|------------|----------|
| backlog | 未 claim；或 wait_spec 且尚未分配 | Spec 关：AC 是否够 |
| in_progress | plan / wait_plan / implement / verify | Plan 关 + 执行进度 |
| in_review | Assignment done | Code 关：PR + summary |
| done | 人把 Code 关过了 | 关闭 Issue |

不要把 `wait_plan` 做成第五列（信息在卡片 badge / 详情闸状态即可）。

## 十一、功能清单

| ID | 功能 | 优先级 |
|----|------|--------|
| G1 | Assignment.stage + kanban_gate 表 | P0（随 M2） |
| G2 | Bootstrap GET + workflow URIs | P0 |
| G3 | TIP submit_spec / submit_plan / resume | P0 |
| G4 | 协议 Skill ID 与 Adapter 映射表 | P0（文档）；实现随各 Adapter |
| G5 | 闸策略 YAML/JSON（spec auto / plan skip_labels） | P1 |
| G6 | verify + handoff_role | P1（M3） |
| G7 | 入口文件指针生成器（`kanban agents inject-bootstrap`） | P2，属 CLI Adapter，非看板核心 |

## 十二、验收标准

- [ ] `plan.required` 时，无 approved/skipped plan 的 `complete` 返回 400
- [ ] `submit_plan` 后 stage=`wait_plan`，在批准前 `progress(stage=implement)` 400
- [ ] bootstrap 含 `required_first_tip` 与 `forbidden_until_plan_approved`
- [ ] 详情时间线可区分 spec / plan / note / summary，闸状态可见
- [ ] 文档明确：AGENTS.md 不由本模块生成正文工作流，只允许指针
- [ ] 契约测试覆盖「跳过 plan 的 label」与「驳回后 version+1 再 submit」

## 十三、依赖

- 协议增量：[agent-protocol.md](./agent-protocol.md)
- 账本：`kind=spec` — [artifact-store.md](./artifact-store.md)
- 调度：wait_* 占用并发槽（lease 仍在）；过长 wait_plan 可降并发或告警 — [dispatch-scheduler.md](./dispatch-scheduler.md)
- 入口实现：各 Adapter — [agent-runtime.md](./agent-runtime.md)
- 人审 UI：Dashboard 批准按钮
