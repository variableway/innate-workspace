# 10 — vibe-kanban 与 kanban-way 对照分析

> 日期：2026-08-14  
> 对照对象：  
> - [BloopAI/vibe-kanban](https://github.com/BloopAI/vibe-kanban)  
> - `innate-capture/kanban-way/` 参考集（含已有 analysis）  
> - 本仓库 `projects/agent-kanban`  
> 画布：[canvases/vibe-kanban-way-comparison.canvas.tsx](../canvases/vibe-kanban-way-comparison.canvas.tsx)

## 一句话

**vibe-kanban 是「编码 Agent 的执行与审 diff 壳」；kanban-way 是「看板/编排/规格/知识」分层标本库；我们是「GitHub Issue 为状态 SoT 的多仓编排层」。不要合成一个巨无霸，按层借能力。**

公司 bloop 已于 2026-04 关停，云端协作下线；本地 `npx vibe-kanban` 仍可用。可借鉴实现，不可当依赖。

---

## 1. vibe-kanban 是什么

定位（官方）：工程师时间花在 **plan / review**，用看板规划，用 workspace 跑编码 Agent。

| 能力 | 做法 |
|------|------|
| 看板 Issue | 本地（原云端团队板已随关停消失） |
| 执行 | Workspace = git worktree + 终端 + 可选 dev server |
| 审查 | UI 内 diff、行内评论回给 Agent |
| 预览 | 内嵌浏览器 / inspect |
| Agent | 适配 10+ CLI：Claude Code、Codex、Gemini、Copilot、Amp、Cursor、OpenCode 等 |
| 交付 | 开 PR、GitHub 上 merge |
| 栈 | Rust 后端 + Node/pnpm 前端，`npx` 一键 |

**不是**：GitHub Issues 跨仓聚合、IM 出口、异构 Agent 的任务协议信封、过程 Artifact 账本。它把「任务」主要当作启动一次编码会话的入口。

与我们 6 项需求：

| 需求 | vibe-kanban | 我们 |
|------|-------------|------|
| GitHub Issue 完全同步 | 弱（用 PR，不是 Issue 双向 SoT） | 设计目标 |
| 分配不同 Agent | 强（换 CLI 适配器） | 设计有，运行时未齐 |
| 执行文档留存 | 弱（会话/diff，非 plan/summary 账本） | Artifact + 闸 |
| 计划/分配可视化 | 强（板 + workspace UI） | 四列有，swimlane 未做 |
| 多 Agent 协议 | 弱（并行 workspace，无 TIP/handoff 信封） | TIP + review-gates |
| IM 推送 | 无 | Notifier 设计 |

**可借（高）**

1. **Assignment ≈ Workspace**：claim 后建 worktree + 分支 + 终端，爆炸半径隔离（与 AKP/VK 一致）。  
2. **Agent Adapter 表**：一个 workspace 可换 Claude/Codex/Cursor，不换看板。对应我们 `adapter: webhook\|cli\|mcp`。  
3. **Review 关的 UI**：in_review 不应只改列，应能看 diff / 把评论打回 Agent（TIP `ask_human` 的人机形态）。  
4. **并行流**：人的瓶颈是审，不是写；WIP 限制的是「待审」而非「Agent 个数」。

**不要借**

- 把看板 Issue 做成私有云 SoT（他们已证明这条商业路径断了）。  
- 做成「编码 IDE 替代品」（预览/devtools 可远期，不是 M1）。  
- 无协议地狂开并行 Agent。

---

## 2. kanban-way 里有什么（按层分类）

路径：`/Users/patrick/workspace/variableway/projects/capture/innate-capture/kanban-way/`

已有分析：`analysis/common-model-for-capture.md`、`agent-kanban-pm-modules.md`、`veritas-kanban-modules.md`。那份分析面向 **innate-capture CLI 转型**；下文改映射到 **本 agent-kanban**。

| 层 | 项目 | 一句话 | 对我们 |
|----|------|--------|--------|
| **Agent 看板运行时** | `agent-kanban-pm` | 哑状态存储 + MCP；7 角色；tmux；per-task worktree；STATUS.md 交接 | Runtime / TIP / handoff 最像 |
| **产品化看板 + 可选编排** | `veritas-kanban` | 文件+frontmatter 默认；GitHub Issues 双向；transition hooks；Deliverable | Artifact + 闸 + Issue 同步最像 |
| **规格驱动** | `spec-kit`、`BMAD-METHOD`、`claude-task-master` | 先 spec/计划再写；Agent 指令与任务分解 | 对齐 review-gates，不替代看板 |
| **通用 PM** | `plane`、`kaneo` | 团队项目管理（sprint/roadmap） | **不要做成 Plane**；看板保持瘦 |
| **知识库** | `AFFiNE`、`siyuan` | 文档/白板 | 过程文档用 Artifact，不自建 Notion |
| **记忆** | `letta`、`mem0` | Agent 长期记忆 | P2 Memory，非核心 |
| **上下文装填** | `context7`、`repomix` | 最新文档 / 打包仓库进 prompt | implement 阶段的领域 Skill，不是编排 |

### agent-kanban-pm（AKP）要点

- 服务器不做路由决策，编排 Agent 经 MCP 调工具。  
- 分配 → worktree → STATUS.md → 阶段交接。  
- GitHub 只做 **贡献同步**，不是 Issue 双向 SoT。

对我们：TIP 保持「薄内核」；handoff 可直接借鉴 STATUS.md 形态，落到 `kind=plan/summary` + `context_ref`。

### veritas-kanban（VK）要点

- 任务 Markdown + YAML；可选 SQLite。  
- `require-plan` / `require-verification-complete` 等 **transition hooks** ≈ 我们的 gate。  
- **GitHub Issues 双向 + label mapping** 与我们同步引擎同族。  
- TaskAttempt / worktree lease ≈ Assignment + lease。  
- 体量很大（87 路由）：只借模型，不搬产品。

---

## 3. 三方对照（我们 vs vibe vs AKP/VK）

| 维度 | 我们 agent-kanban | vibe-kanban | AKP | VK |
|------|-------------------|-------------|-----|-----|
| SoT | Issue=状态，Artifact=过程 | 本地看板+workspace | SQLite 哑存储 | 文件任务 + 可选 Issue 同步 |
| 核心用户动作 | 跨仓看列、过闸、收 IM | 开 workspace、审 diff、开 PR | MCP 编排、tmux 看执行 | 板 + 可选 Agent |
| Agent 怎么跑 | 协议认领（尚未 spawn） | 本机 spawn CLI | tmux spawn | API spawn + adapter |
| 隔离 | 设计：分支/PR | worktree 一等公民 | per-task worktree | worktree lease |
| 多仓 GitHub | 目标 | 弱 | 弱 | 有 Issues 同步 |
| 协议 | TIP + bootstrap | 无统一信封 | MCP 工具即协议 | REST/MCP + hooks |
| 风险 | 文档超前、运行时未齐 | 公司关停、云能力没了 | alpha、22 表偏重 | 功能面过大 |

---

## 4. 对路线的修正（不改 M1 顺序，补「执行壳」为 M3 附件）

保持 [08 计划](./08-requirements-aligned-plan.md) 与 [BOARD](../backlog/BOARD.md)：

1. **仍先 AK-001**（Issue↔四列）。vibe 不能替代这条——他们几乎不把 Issue 当 SoT。  
2. **AK-004/005 Artifact+闸**：对齐 VK transition hooks + spec-kit，而不是 vibe 的「开写再审 diff」。  
3. **AK-006 TIP 之后** 增加实现注记（不必新开大卡直到 M3）：Runtime Adapter 应能 **可选** 启动 worktree workspace（vibe/AKP 模式），但看板状态仍只认 TIP。  
4. **不要** 把 Plane/Kaneo/AFFiNE 的 PM/知识库做进 M1–M4。  
5. **in_review UX**（M4 或 AK-010 之后）：diff 评论回 Agent，这是 vibe 最值得抄的人机面。

---

## 5. 模块借力表

| 我们的模块 | 主要对标 | 少对标 |
|------------|----------|--------|
| sync-engine | VK GitHub Issues | vibe、AKP 贡献同步 |
| review-gates / artifact | VK hooks、spec-kit、VK deliverable、AKP STATUS.md | vibe 会话 |
| dispatch / runtime | vibe workspace、AKP launcher | Plane |
| agent-protocol | AKP MCP 薄内核 + 我们 TIP | vibe 无信封 |
| dashboard | vibe 板+审、VK SPA（瘦用） | Kaneo 动画、Plane 全套 |
| notifier | VK webhook/Teams | vibe 无 |
