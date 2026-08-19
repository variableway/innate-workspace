# 09 — 参考项目 Brainstorm：优缺点 × 功能清单（结合产品目的）

> 日期：2026-08-18
> 输入：`shared-context/architecture.md` + `suggestion/08-requirements-aligned-plan.md`（目的侧）；
> `references/analysis/`（五项目分析）+ `references/` 源码抽查（验证侧）。
> 性质：**脑暴文档**，不取代 `references/analysis/00–04` 的中立分析；本文所有判断都显式绑定产品目的。

## 0. 目的锚点（评判标尺）

六大需求与关键决策，作为评判所有参考项目的统一标尺：

| # | 需求 | 关键决策 |
|---|------|----------|
| R1 | GitHub Issue 状态**完全可同步** | 状态 SoT = GitHub，SQLite 仅镜像（ADR-1） |
| R2 | 异构 AI Agent 可分配 | TIP 协议接入，Runtime 无状态（ADR-3） |
| R3 | 执行过程 **Artifact 留痕** | 过程 SoT = Artifact，Issue 只回写摘要（ADR-1） |
| R4 | 计划/分配**可视化** | 4 列 + WIP + Swimlane/依赖图 |
| R5 | 多 Agent **协作**（claim/handoff/ask_human） | 完成 → `in_review` 人审闸（ADR-2） |
| R6 | 完成事件推**多 IM** | 通知异步、失败不回滚（ADR-4） |

---

## 1. Backlog.md —「人可审阅的任务账本」

**定位**：Markdown 原生看板，AI 写码、人审三关。与 R3/R5 最近。

### 功能清单

- 用户面：init/config wizard、任务 CRUD、board（含 milestone swimlane）、Web 拖拽、fuzzy search、docs/decisions、doctor/cleanup、shell completions
- 任务字段：AC、DoD、plan、notes、final summary、subtasks、dependencies、priority、milestone
- Agent 面：`backlog instructions` 写 AGENTS.md、`--json` 机读、文件锁并行建卡、MCP（已降级 legacy）

### 优点（结合目的）

- ✅ **三关审阅环（Spec→Plan→Code）直接是 R5 review-gates 的设计原型**——`modules/review-gates.md` 的四闸拆分即源于此
- ✅ AC/DoD/plan/notes/final summary 字段语义 = Artifact `kind` 枚举的现成参考（M2 直接可用）
- ✅ Manifesto 面层级（CLI > instructions > TUI/Web > MCP）提供「契约面优先级」治理范本
- ✅ Dogfood 模式（仓库 `backlog/` 即开发史）——我们 `backlog/AK-xxx` 已在实践

### 缺点（结合目的）

- ❌ **SoT 是 Markdown 且明确放弃 GitHub Issues——与 R1 根本冲突**，只能借字段语义，不能借存储架构
- ❌ 无 Assignment / 多 Agent 模型，R2/R5 协作侧零参考
- ❌ 单仓库视角，无跨仓聚合，与「多项目统一看板」错位
- ❌ 无通知能力，R6 空白；MCP 被他们自己降级为 legacy，是值得注意的信号

---

## 2. ai4kanban —「AI 自己当 PM」

**定位**：Kanban Engineering，看板 = Agent 的长期项目上下文。自主闭环最强。

### 功能清单

- 用户面：Desktop 向导（Electron）、Board/Queue 视图、周期卡排期、跑 agent、中英双语
- 平台面：`akb propose|create|refine|resolve|revise|implement|archive|reject|plan-release`、`--print` 把流程步骤打给当前会话、`akb runs|log|stop|resume`、flows 内嵌 CLI（升级 CLI 即升级流程）、module memory（含否决理由）、skill 装到 `.claude/skills`

### 优点（结合目的）

- ✅ **Module memory + 否决理由**：按模块持久化决策，减少重复提问——M1–M4 未覆盖，P1 级缺口
- ✅ **写卡后 auto-refine run**：每次写入触发独立澄清 run，可监视/停止——可嫁接到 Assignment 完成后的二次 run
- ✅ `akb … --print` 轻接入叙事：不依赖 MCP，把下一步指令直接打印给当前 Agent 会话——比 MCP 务实
- ✅ Run log/stop/resume：Assignment 生命周期观测的现成语义
- ✅ 主动 propose：Agent 基于代码 + memory 提未规划工作

### 缺点（结合目的）

- ❌ **「AI 全权 PM」与 ADR-2（人审闸）张力最大**——全盘照搬会破坏「完成进 in_review」原则，只能渐进摘取
- ❌ 仍是 Markdown SoT，无 GitHub 同步引擎，R1 零参考
- ❌ 无多 Agent 协作协议（无 claim/handoff/lease），R5 协作侧空白
- ❌ flows 藏在 CLI guide 内，契约开放性弱于我们 `docs/` YAML SSOT 策略
- ❌ Electron 壳对 Vite Web 路线是负担

---

## 3. AgentTODO —「AI 可调用的待办中枢」

**定位**：轻量本地任务中枢，让 AI 直接读写待办。Agent 调用面最顺滑。

### 功能清单

- 用户面：List/Kanban/Calendar 三视图、筛选批量、标签、子任务、周期任务、深浅色、备份导入导出
- Agent 面：Zero-Auth REST + OpenAPI 3/Swagger、**CLI Skill 热加载**（7 个：create_task / update_task / get_today_agenda / get_daily_summary / add_task_progress_note / get_user_tags / ping，stdin/stdout JSON）、Webhook 逾期主动推送、TaskNote `source=user|ai`、`@purpose/@input/@output` HTML 注释语义标记

### 优点（结合目的）

- ✅ **CLI Skill 热加载是「Agent 一等公民写入面」的最佳轻量实现**——显式替代 MCP，与「CLI/Skill 薄封装对齐 OpenAPI」的 P0 建议同构
- ✅ **Webhook 主动唤醒（push 而非只 pull）**：cron 扫逾期主动推 AI——Notifier + 「WIP 超限/失败 assignment 推送」的直接参考（R6）
- ✅ `notes source=user|ai` 人/机留痕区分——Artifact 需要 `author` 字段语义
- ✅ 文档语义标记约定可在 `docs/`、`modules/` 推广

### 缺点（结合目的）

- ❌ **三列状态机（todo/in_progress/done）过简，无 in_review 人审闸**——与 ADR-2 冲突
- ❌ 单用户个人待办：无多项目、无 GitHub、无 Assignment，R1/R2/R5 全无
- ❌ Zero-Auth 不能作为默认安全模型（多项目 + webhook 至少需 token/secret）
- ❌ 无依赖/blocked_by，任务模型薄

---

## 4. LobsterBoard —「运维/用量仪表盘」

**定位**：自托管拖拽 Dashboard Builder，60+ widgets。与任务工作流**正交**，距离最远。

### 功能清单

- 用户面：Ctrl+E 编辑、拖拽网格、60+ widgets（系统/天气/金融/**AI 用量**/Todo…）、5 主题、Template Gallery（导出/导入 + 截图预览）、Custom Pages、多机监控
- 平台面：Widget registry 分文件、`community-widgets/_template` 贡献模板（带注释 + PR checklist）、SSE `/api/stats/stream`、remote agent

### 优点（结合目的）

- ✅ **Widget/Page registry + community `_template`**：「加文件而非改核心」的扩展机制教科书——可借鉴于未来 dashboard 插件面
- ✅ **LLM/IDE 用量监控全家桶**：启发 M4+ 运营观测页（Agent 成功率、token、同步健康度）
- ✅ SSE 实时流：看板「进行中可见」的技术参考
- ✅ 无框架单进程，部署极轻

### 缺点（结合目的）

- ❌ **无任务状态机，Todo widget ≠ 项目管理**——对 R1–R5 几乎零贡献
- ❌ JSON 文件存储，无契约/迁移概念，与 contract-first 相反
- ❌ **BSL-1.1 license：代码不能抄，只能借鉴模式**
- ❌ 只能当「观测层灵感库」，不能当看板模板

---

## 5. agent-manager —「多 Agent 会话调度台」

**定位**：Go + Bubble Tea TUI，并排管理多个 CLI agent 的持久 tmux 会话。管「谁在跑」，不管「做什么」。

### 功能清单

- 用户面：多会话列表、`n` 新建 / `space` 不 attach 灌 prompt / focus / fork / kill / **revive 死会话**、分组树、`ctrl+r` **in-TUI diff review（行评论回流 agent）**、per-session git worktree、主题/密度/通知
- 平台面：内置 7 家 CLI（Claude Code/Codex/OpenCode/Gemini…）、`[tools.<name>]` 扩展任意 CLI 状态规则、私有 tmux server（`agentmgr`，与用户 tmux 隔离）、**MCP 回调**（agent 反向 rename/review/控 terminal）

### 优点（结合目的）

- ✅ **异构 Agent 状态归一化**：`[tools.<name>]` 把任意 CLI 输出映射成统一 status——与 TIP Adapter「异构 Agent 统一接入」（R2）思路同源
- ✅ **In-TUI diff review + 行评论回流**：Code 闸人审 UX 的最佳参考（R5）
- ✅ **per-session git worktree 隔离**：并行 Assignment 互不踩——M3 并行执行刚需
- ✅ `space` 灌 prompt、revive：assignment 卡住/失败后的恢复 UX 参考
- ✅ MCP 回调 = agent → 管理面的反向通道，类似 TIP 的 progress/ask_human

### 缺点（结合目的）

- ❌ **Session ≠ Task**：无卡片/Issues/状态机，绝不能替代看板
- ❌ 强绑 TUI 运行时；我们是 Web 看板 + 双后端，形态不同
- ❌ 无 Artifact/审阅关概念，R3 空白
- ❌ 定位是**旁路组合**（看板管任务、manager 管会话），不是合并对象

---

## 6. 功能 × 目的 汇总矩阵

| 我们的需求 | Backlog.md | ai4kanban | AgentTODO | LobsterBoard | agent-manager |
|-----------|:----------:|:---------:|:---------:|:------------:|:-------------:|
| R1 GitHub 同步 | ❌ 反方向 | ❌ | ❌ | ❌ | ❌ |
| R2 异构 Agent 接入 | ◐ CLI 契约 | ● spawn/`--print` | ● Skill/REST | ○ | ● tools 规则 |
| R3 Artifact 留痕 | ● plan/notes/summary | ● memory/runs | ◐ notes source | ○ | ○ |
| R4 可视化 | ● 看板/TUI/Web | ● Board/Queue | ● 三视图 | ● widgets/SSE | ◐ TUI |
| R5 协作 + 人审闸 | ● 三关 | ◐ 全自动反向 | ❌ | ❌ | ◐ diff review |
| R6 IM 通知 | ❌ | ○ | ● webhook push | ○ | ◐ 桌面通知 |

**空白带确认**：五个项目无一以 GitHub Issues 为 SoT——R1 既是差异化，也是**无现成参考、必须自研最深**的部分（sync-engine 优先级栈、写回、冲突处理）。

---

## 7. 关键矛盾与取舍（Brainstorm）

1. **Markdown SoT vs GitHub Issues SoT**：近邻都选文件 SoT 换「零配置 + 可 diff」；我们选 Issues 换「跨仓统一 + 既有工作流」。代价是同步引擎全自研——M1 收口是全产品地基，值得最高优先级。
2. **AI 全自动（ai4kanban）vs 人审闸（Backlog.md / ADR-2）**：人审为默认路径，自动化走「可配置 skip」；propose/auto-refine 只能作为**建议层**叠加，不能绕开闸。
3. **Zero-Auth 便利 vs 多项目安全**：本地单用户场景学 AgentTODO 零摩擦；对外 webhook/多项目必须 token。
4. **Session 编排 vs Task 编排**：组合而非合并——「Agent Kanban 管任务 + agent-manager 管会话」，不在核心内重建 tmux。

## 8. 超出 M1–M4 的新候选功能（Brainstorm 增量）

| 候选 | 来源 | 建议里程碑 |
|------|------|-----------|
| Module/project memory + 否决理由 | ai4kanban | M3+（P1） |
| Assignment 完成后 auto-refine 二次 run | ai4kanban | M3+（可选开关） |
| Agent 主动 propose 未规划工作 | ai4kanban | M4+（建议层） |
| Recurring cards | ai4kanban / AgentTODO | M4+ |
| `--print` 式轻接入叙事 | ai4kanban | M2 随 CLI/Skill 薄封装 |
| Code 闸 diff review UX（行评论） | agent-manager | M3–M4（或外挂） |
| per-Assignment worktree 隔离 | agent-manager | M3 并行时 |
| 运营观测页（成功率/token/同步健康度） | LobsterBoard | M4+ |
| WIP 超限/失败 assignment 主动推送 | AgentTODO | M4 Notifier 增强 |
| Artifact `author=user|agent` 语义 | AgentTODO | M2 schema 顺带加 |

## 9. 下一步候选

1. 基于第 8 节候选清单做优先级收敛，更新 `08-requirements-aligned-plan.md` 或开新计划
2. 深入单参考项目做实现级拆解（如 AgentTODO SkillManager 热加载、agent-manager 状态规则引擎）
3. M2 启动门闩：`docs/openapi.yaml` 增补 Artifact / TIP / Notify paths（`08` 第七节）
