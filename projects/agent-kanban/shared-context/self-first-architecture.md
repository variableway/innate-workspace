# Agent Kanban 自用优先架构

> 对照：[Todos.dev Docs](https://todos.dev/docs)（2026-08 文档快照）  
> 现状契约：[architecture.md](./architecture.md)（M1–M4，GitHub 为状态 SoT）  
> 本文件是 **叠加层**：不推翻四列看板 / TIP / Artifact / 审查闸，只改「先让自己好用」的边界与增量。

## 0. 结论

Todos 清晰，是因为它只做一件事：**人设目标，Agent 在隔离工作区里 plan-then-build，人只在两道闸停留。** 控制面在云上，执行面在你的机器上（BYO-PC + BYOK）。

Agent Kanban **不要复刻成云产品**。当前目标是一台（或几台）自己的机器上的操作系统：

- **看板是家**：跨仓任务一眼可见，列就是 WIP。
- **工作流是配方，不是引擎**：先内置 `plan-then-build` / `run-now`，用已有 Gate + TIP 表达。
- **多仓是 Workspace 的本职**：Project = 一个 git 仓（本地路径必填，GitHub 可选）。
- **远程是 Worker 认领任务**：Agent 不等于机器；机器在线才跑。先本机，再 Tailscale 上的另一台。

现有 M1–M4 仍然有效。变化只有一条 ADR：**自用阶段，看板 SQLite 是操作真相源；GitHub 是 Project 的可选同步器，不是系统身份。**

---

## 1. Todos.dev 在做什么

产品一句话：人和 Agent 的共同工作区。Chief 把目标拆成 todo，交给角色匹配的 Agent；默认 **先计划再改代码**；另一名 Agent 可以先审，人尽量少插手。

文档把世界拆成你按顺序碰到的词，而不是功能清单。这是它「概念清晰」的原因。

### 1.1 概念顺序（文档自己的顺序）

| 概念 | 定义 | 关键约束 |
|------|------|----------|
| Team | 一切的归属单位 | Agent / Machine / Project / Skill / Secret 都挂在 Team |
| Project | 一个 git 仓 + 其中的工作 | 必须接仓；接上后不能换 |
| Todo | 一块工作 | **同时是一次与 Agent 的对话**；永远恰好一个 phase |
| Phase | To Do → Queued → Planning → Confirm → Building → Review → Done / Failed / Closed | 人只在 Confirm、Review 两处停 |
| Agent | 有角色、模型、工具开关、默认 Skill、私有 Memory 的队友 | **不绑死一台机器** |
| Chief | 团队唯一的站岗对话 | 只做判断与分发，**没有仓库权限** |
| Build / Run | Agent 在某台机器的隔离 worktree 上的一次尝试 | 一个 todo 可有多次 run；产物挂在 todo 上 |
| Machine | 跑 run 的电脑 | **Machine claim run，Agent 不拥有机器** |
| Skill | 团队共享的 `SKILL.md` 玩法 | 和 Memory 对立：共享 vs 私有 |
| Memory | Agent 自己的短笔记 | 有上限；人可改删，不可代写 |
| Document | Plan / Changes / Proposal / Question | **版本化附件，不是聊天里的一段话** |

### 1.2 真正值钱的运转方式

1. **人只在两道闸出现**：Confirm（动代码前）和 Review（合并前）。其余时间 todo 要么在跑，要么在终态。
2. **对话不是持久化层**。上下文分三层：Charter（人写、Chief 只读）、Memory（Agent 写）、Projects/Todos（平台存）。对话可 compact / rewind / reset，三层还在。
3. **控制面与执行面分离**。网站存元数据；`tds` 把机器拉上线；模型钥匙按 Team 配一次，随任务下发到机器。Platform machine 只是「你懒得留电脑开着」的付费执行面。
4. **Agent ≠ Machine ≠ Repo**。Agent 思考与角色；Machine 提供 CPU 与 worktree；Repo 属于 Project。三者独立，才能并行、换机、跨仓。
5. **权限是四块开关，不是 RBAC 大盘**：Agent 工具、Machine 同意（builds / remote shell）、人的 admin、API key 范围。Remote shell 必须 Agent 授权 **且** 机器打开。
6. **MCP 双向但互不相关**：入站 = 编辑器读看板；出站 = Agent 调外部工具。

### 1.3 一次完整回路（Quick start）

建 todo →（默认 Plan first）Agent 读仓写计划 → **Confirm** → 在独立分支上 Building → **Review** 看 diff → Done（可选 merge） / 另开 PR。任何终态都可以 rerun，旧 build 留历史。

「Run now」只是跳过计划闸，不是另一套系统。

---

## 2. 为什么清晰，以及我们不该抄什么

### 2.1 清晰来自克制

- 每个词只回答一个问题：工作在哪（Project）、谁做（Agent）、在哪跑（Machine）、人何时必须出现（两道闸）。
- 状态机服务「扫一眼」：phase 少而互斥；Queued 是机器忙，不是第四种业务状态。
- 产物进文档，过程进对话。计划改了是新版本，不是再刷一条消息。
- Chief 被故意做残：无仓库权限，不能发 shell / secrets。判断和执行拆开，才不会变成「一个全能 chatbot 管所有仓」。

### 2.2 那是云服务才需要的复杂度（自用阶段明确不做）

| Todos 能力 | 不做的原因 |
|------------|------------|
| Team / 计费 / 席位 / 套餐容量 | 只有你 |
| Platform machine、休眠计费、Cloudflare sandbox | 你的电脑就是执行面 |
| Todos 托管 Git | 仓已经在 GitHub / 本地 |
| 对话 rewind、中途转向队列、语音、PWA 推送 | 编辑器里已经有对话 |
| Memory 产品（100 条、save_memory 工具、人不能代写） | 用仓内 `AGENTS.md` / Skill 即可 |
| Schedule 产品（10 条配额、错过不补跑） | 以后 `cron` + CLI 一条命令就够 |
| Chief 作为常驻产品对话 + Proposal 卡片 | 需要分发时，就是又一个 Agent + 一段 charter 文件 |
| Remote shell 作为独立工具 | Worker 跑在那台机器上，本身就能执行 |
| 密钥保险库、MCP 出站加密下发 | 本机环境变量 / direnv |
| 文件浏览器、HTML 预览、手机完整工作区 | 用 git 与编辑器 |

这些不是「永远禁止」，是 **未证明自己每天都用之前，不准变成表和页面**。

---

## 3. 概念对照（Todos → Agent Kanban）

| Todos | 我们已有 / 该有 | 映射策略 |
|-------|-----------------|----------|
| Team | `Workspace` | 一个就够；不做多人邀请 |
| Project | `Project` | **本地 `local_path` 必填**；GitHub `owner/name` 可选 |
| Todo | `Task` | 看板卡片；不是「对话即任务」。对话留在 Adapter（Cursor 等）里 |
| Phase（9 态） | 看板 4 列 + `assignment.stage` | 列给人扫；stage 给运行时。Queued ≈ 无在线 Worker |
| Confirm / Review 闸 | `kanban_gate` plan / code | 已对齐 PLAYBOOK；保留 |
| Agent | `kanban_agent` | 角色 + 模型 + capability_tags + skills |
| Chief | 暂不产品化 | 需要时：一个 `role=groom` 的 Agent + `charter.md` |
| Build / Run | `Assignment` | **一次 Assignment ≈ 一次 run**。重跑 = 新 Assignment，旧的留历史。暂不另开 Run 表 |
| Machine | **新模块 Worker** | 认领 run、管 worktree、调 Adapter |
| Skill | 仓内 `SKILL.md` + Agent.skills 名列表 | 不建团队技能库 SaaS；从仓路径读 |
| Memory | 不做 | 约定写进 Project 的 AGENTS.md |
| Plan / Changes 文档 | `kanban_artifact` | 现有 spec/plan/note/summary；**补 `kind=diff`** |
| Proposal / Question | `ask_human` + 以后再谈 | Question 已有 TIP；Proposal 等有 groom Agent 再说 |
| Inbox | 看板过滤「等我」 | `gate.status=submitted` ∪ `ask_human` 未答。不是独立产品 |
| `tds` CLI | 薄 CLI：`ak worker` / `ak start` | 只做上线与触发，不做网站替代 |
| MCP 入站 | 后期 | 从 Cursor 读看板、建卡、开跑——这是「远程控制」的廉价形态 |
| GitHub App + 每 todo 一分支 | Sync Engine + 可选 PR | 自用可先 worktree + 本地分支；有 GitHub 再 push |

看板 4 列 **刻意比 Todos 的 9 phase 少**。Planning / Building 都是 `in_progress`；人只要知道「在跑」还是「等我」。细节看卡片上的 stage。

---

## 4. 模块分层（目标）

四层。现有 `architecture.md` 的七段图仍然对；这里按 **控制面 / 执行面** 重切，把 Todos 里最有用的那条缝补上。

```
┌─────────────────────────────────────────────────────────────┐
│ L0  Surfaces（自己用的入口，先 Web + CLI）                    │
│     Kanban 看板（家）  ·  任务详情/闸  ·  `ak` CLI            │
│     （后期）MCP 入站：Cursor 读板、建卡、开跑、取消            │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / SQLite
┌──────────────────────────────▼──────────────────────────────┐
│ L1  Control plane（现有 backend-* ，单进程）                  │
│                                                             │
│  Board            四列、WIP、跨 Project 过滤                  │
│  Workflow         命名配方（闸集合 + 允许的 TIP 动词）        │
│  Repo registry    Project：local_path + 可选 GitHub          │
│  Inbox view       等我：plan submitted / ask_human           │
│  Orchestrator     优先级、标签路由、未匹配高亮                │
│  Dispatch         Agent 槽 + Worker 槽，两道并发             │
│  Artifact/Gates   过程 SoT + 人闸                            │
│  Sync（可选）     GitHub Issue ↔ Task；无 token 则纯本地      │
│  Notifier         后期；自用先看板红点 / 系统通知即可         │
└──────────────────────────────┬──────────────────────────────┘
                               │ TIP 信封
┌──────────────────────────────▼──────────────────────────────┐
│ L2  Protocol                                                │
│     TIP：claim / heartbeat / submit_plan / complete / …     │
│     Bootstrap：GET bootstrap + kanban://workflow/<id>       │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
┌───────────────▼─────────────┐  ┌────────────▼───────────────┐
│ L3a Agent（思考）            │  │ L3b Worker（跑）            │
│  角色、模型、skills          │  │  新模块：在线心跳            │
│  Adapter：Cursor / CLI /    │  │  claim run → worktree      │
│  webhook                    │  │  调 Adapter → 回收 diff     │
└─────────────────────────────┘  └────────────────────────────┘
                │                             │
┌───────────────▼─────────────────────────────▼───────────────┐
│ L4  Data                                                    │
│     SQLite = 操作 SoT（列、闸、Assignment、Artifact）        │
│     Git 仓 = 代码 SoT（每个 Project 一个 local_path）        │
│     GitHub = 可选镜像（Issue 列、PR）                        │
└─────────────────────────────────────────────────────────────┘
```

### 4.1 与现有 modules/ 的对应

| 现有模块 | 层 | 自用阶段要改的一点 |
|----------|----|-------------------|
| dashboard | L0 | 加「等我」过滤；Project 切换；不要先做 swimlane |
| task-orchestrator | L1 | 继续；本地 Task 允许无 `issue_number` |
| review-gates | L1 | 配方选择哪几道闸；`run-now` = skip plan |
| artifact-store | L1 | 增加 `diff`；版本沿用 |
| dispatch-scheduler | L1 | **并发要过 Agent 与 Worker 两道门** |
| sync-engine | L1 | 降级为适配器：Project 未接 GitHub 则跳过 |
| agent-protocol / runtime | L2/L3a | 不变；Runtime 不再假设「Agent 自己有机器」 |
| notifier | L1 | M4 再做；自用可缺 |
| **worker（新）** | L3b | 本文件唯一新运行时模块 |

### 4.2 一条原则

**看板编排，Worker 执行，Agent 思考。**  
今天的缺口是把「执行」误写进 Agent：`max_concurrency` 挂在 Agent 上，却没有「哪台电脑在跑」。Todos 写得很硬：*Machines claim runs; agents do not own them.* 自用也要这条缝，否则多仓 / 远程都没有落点。

---

## 5. 三个增量（只加会每天用到的）

### 5.1 Workflow = 配方，不是引擎

不要 BPMN，不要可视化编辑器。Workspace 里一份 YAML（或表里几行默认数据）即可：

```yaml
workflows:
  - id: plan-then-build
    default: true
    gates: [plan, code]          # spec 欠定时才出现，不默认拦
    on_complete: in_review
  - id: run-now
    gates: [code]
    skip_plan: true              # 对齐 Todos「Run now」
  - id: verify-only
    gates: [verify, code]        # 已有 diff，只跑核对
```

实现落点已经存在：`assignment.stage` + `kanban_gate` + TIP `submit_plan` / `complete`。  
新建 Task 时带 `workflow_id`，默认 `plan-then-build`。

以后要「更多 workflow」，优先加配方，而不是加引擎。领域玩法继续用仓内 Skill（`kanban.plan` 仍是协议 Skill，与领域 Skill 分离，见 `modules/review-gates.md`）。

### 5.2 多仓 = Repo registry，不是第二套 GitHub

```
Workspace  1 ── N  Project
                     ├── local_path     必填（Worker 的 checkout 根）
                     ├── default_branch
                     ├── github (owner, name, webhook)  可选
                     └── tasks…
```

- 看板默认 **Workspace 聚合**；工具栏按 Project 过滤。
- 跨仓工作用已有 `kanban_task_edge`（`parent_of` / `blocks`），子卡各自带 `project_id`。
- Worker 收到 run 时只认 `project.local_path`：`git fetch`（若有 remote）→ `git worktree add` → 在 worktree 里调 Adapter。
- 不自建 Git hosting。不在控制面存 blob。

GitHub 同步策略改为：

| Project 形态 | 状态 SoT | Sync |
|--------------|----------|------|
| 仅本地路径 | SQLite 看板 | 无 |
| 本地 + GitHub | SQLite 操作；GitHub 镜像 | 现有优先级栈，写回 `status:*` |
| 尚未 clone | 不准开跑 | Worker 报错：先 clone 到 local_path |

这与「先让自己好用」一致：手工 `backlog/tasks/*.md` 本来就可以在没 webhook 时当卡用；将来迁 Issue 是导出，不是前提。

### 5.3 远程控制 = 在线 Worker + 薄 API，不是云桌面

三档，后一档以前一档能用为前提：

| 档 | 形态 | 自己怎么用 |
|----|------|------------|
| 0 | API 与 Worker 同机 | `task dev:node` + `ak worker start`（或进程内 worker） |
| 1 | 另一台电脑 | 控制面 Tailscale/LAN；`ak worker start --api http://nas:4001 --token …` |
| 2 | 编辑器遥控 | MCP 入站：list/create/start/cancel/approve-gate（对齐 [Todos MCP](https://todos.dev/docs/mcp) 的只读+开跑子集） |

Worker 最小职责：

1. 注册：hostname、可服务的 `local_path` 前缀、concurrency、builds on/off。
2. 心跳：超过 N 分钟无心跳 → 进行中的 Assignment `failed`（Todos 是 10 分钟，自用可更短）。
3. Claim：Dispatch 同时检查 Agent 槽 **和** Worker 槽。
4. 执行：worktree → Adapter → TIP 回传；把 `git diff` 写成 `artifact.kind=diff`。
5. 不做：远程 shell 产品、平台沙箱、密钥下发、睡眠计费。

「远程」的语义是：**任务在那台已上线的机器上跑**，不是 Agent 穿透 SSH 进你的笔记本。需要哪台机器，就把 Worker 装在哪台。

---

## 6. 核心数据流（自用）

```
人在看板建卡（或 GitHub Issue 同步进来）
    │  workflow_id = plan-then-build | run-now | …
    ▼
Orchestrator 入列 backlog；可选匹配 Agent
    │
    ▼
人点「开始」或 Dispatch 自动开始
    │  需要：Agent 有空槽 且 至少一台 Worker 在线且 builds=on
    ▼
Assignment(pending) → Worker claim
    │  worktree @ project.local_path
    ▼
Adapter 拉 bootstrap（闸 + workflow URI + 最近 artifacts）
    │
    ├─ plan-then-build: submit_plan → 列仍 in_progress，卡片标「等计划」
    │                   人批 → resume → implement
    ├─ run-now:         直接 implement
    ▼
complete → artifact.summary + artifact.diff
    → Task in_review（人闸 code）
    → 人拖到 done（若有 GitHub 则 close / status:done）
```

人扫板只看四列。`等计划` / `等回答` 是 Inbox 过滤，不是第五列——避免 Todos 的 9 态把家界面撑复杂。

---

## 7. 与 M1–M4 怎么叠

不重开一条产品路线。在 [suggestion/08](../suggestion/08-requirements-aligned-plan.md) 上插入薄切片：

| 切片 | 内容 | 依赖 | 对应现有卡 |
|------|------|------|------------|
| **S0 家可用** | 四列看板真实闭环；本地 Task 可无 GitHub | — | AK-001 |
| **S1 过程可回放** | Artifact 时间线 + Plan 闸 | S0 | AK-002…005 |
| **S2 本机跑起来** | TIP 最小闭环 + **同机 Worker** + worktree | S1 | AK-006、007 + 新 Worker 卡 |
| **S3 多仓** | `local_path`、聚合过滤、跨仓 edge | S0 即可并行文档，跑通要 S2 | 新卡，勿早于 S2 自动化 |
| **S4 配方** | `run-now` / `verify-only` | S1 闸 API | 小卡，改配置不改引擎 |
| **S5 远程** | Worker 异机注册；再 MCP 入站 | S2 | 新卡；**不要**和 IM/swimlane 抢 |
| M3 余项 | handoff | S2 | AK-008 |
| M4 | Notifier、swimlane | 自己都用顺了再做 | AK-009、010 |

优先级仍服从 PLAYBOOK：地基未绿不做上层；过程 SoT 先于多 Agent；单 Agent 闭环先于 handoff / IM。

S2 是相对原计划唯一的结构性插入——没有 Worker，远程和多仓都是空话。

---

## 8. ADR（本叠加层）

| ID | 决策 | 理由 |
|----|------|------|
| ADR-S1 | 自用阶段 **SQLite 看板 = 操作 SoT**；GitHub 为 Project 可选适配器 | 没 webhook 也能管自己的卡；GitHub 不再是系统身份 |
| ADR-S2 | 看板保持 4 列；Todos 的 Planning/Building 都进 `in_progress` | 扫板要快；stage 放卡片上 |
| ADR-S3 | Assignment 复用为 Run；暂不建 Run 表 | 重跑 = 新 Assignment；表够用之前不加实体 |
| ADR-S4 | 新增 Worker；Agent 不拥有机器 | 否则多仓/远程没有执行落点 |
| ADR-S5 | Workflow 是闸配方，不是工作流引擎 | 先自己好用；领域玩法用 Skill |
| ADR-S6 | 不做 Chief / Memory / Schedule / 托管 Git / 平台机器 | 过早产品化；用文件、cron、本机替代 |
| ADR-S7 | MCP 入站排在异机 Worker 之后 | 先有执行面，再让编辑器遥控 |
| ADR-S8 | 原 ADR-1（GitHub 状态 SoT）降级为「已接 GitHub 的 Project 的镜像策略」 | 与 S1 兼容：接了 GitHub 仍按原优先级栈写回 |

原 ADR-2…6（完成进 in_review、TIP、通知不回滚、双后端、闸与 bootstrap）继续有效。

---

## 9. 非目标（写下来防止膨胀）

- 多租户、登录产品、计费、移动端、推送。
- 把 Cursor 对话同步进看板当聊天产品。
- 自建 Agent 运行时（模型编排、工具沙箱）。Worker 只调已有 Adapter。
- 在看板里做 IDE（diff 预览做到「能读补丁」即可，完整审查仍在编辑器 / GitHub PR）。
- 为「像 Todos」而加的第九列、Chief 页面、Proposal 市场。

下一步仍按看板：先审本文件；通过后拆 Worker / `local_path` / 配方 三张小卡，插入 `backlog/BOARD.md`，不要从 AK-001 跳到远程 MCP。
