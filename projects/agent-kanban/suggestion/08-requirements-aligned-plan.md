# 08 — 需求对齐实施计划

> 日期：2026-08-13  
> 输入：用户需求（GitHub 同步 · 多 Agent · 执行留痕 · 可视化 · TIP · IM）+ Backlog.md 参考  
> 取代关系：**不取代** `07-dual-backend-implementation-plan.md` 的双后端策略；在其上叠加产品能力里程碑。  
> 架构原则见 [`shared-context/architecture.md`](../shared-context/architecture.md)。

## 一、目标陈述

把 Agent Kanban 从「Issue 同步 + 单 Agent 分配看板」升级为：

1. 与 GitHub Issue **状态完全可同步**
2. 可分配到 **异构 AI Agent**
3. 执行过程有 **Artifact 文档留存**（借 Backlog.md 三关）
4. **计划与分配可视化**
5. 多 Agent 通过 **TIP** 协作
6. 完成信息可推到 **多 IM**

## 二、需求 → 模块映射

| 需求 | 主模块 | 契约 |
|------|--------|------|
| GitHub 同步 | sync-engine | events github_* / task-states |
| 多 Agent 分配 | task-orchestrator + dispatch-scheduler | assignment-states |
| 执行文档留存 | artifact-store + review-gates | kanban_artifact / kanban_gate |
| 计划/分配可视化 | dashboard (+ task_edge) | 读模型 API |
| 多 Agent 协议 | agent-protocol + agent-runtime | TIP / bootstrap / tip_message |
| IM 推送 | notifier | notify_channel / delivery |

## 三、里程碑

### M1 — 巩固同步与看板（进行中 / 优先收口）

**目标**：Webhook/轮询/写回闭环 + 4 列拖拽真实可用。

| 项 | 说明 | 验收 |
|----|------|------|
| Sync 优先级栈 | 与 README / task-states 一致 | closed / status:* / assignment / keep-local |
| 看板 PATCH 回写 | 成功后写 GitHub `status:*` | 无 token 时跳过且不报崩 |
| WIP | in_progress≤5，in_review≤3 | 超限 409 |
| 双后端契约 | 现有 contract-tests 绿 | Go + Node 一致 |

**非目标**：TIP handoff、IM 多渠道、Git 镜像。

### M2 — Artifact 执行账本

**目标**：任意完成任务可复盘 Spec→Plan→Notes→Summary。

| 项 | 说明 | 验收 |
|----|------|------|
| schema + types | 已草案于 docs/ | 迁移应用到双后端 |
| Artifact API | CRUD + 时间线 | 见 artifact-store PRD |
| Runtime 写入 | claim 后写 plan；complete 前写 summary | 缺 summary → 400 |
| 详情面板 | 时间线 UI | plan/note/summary 可区分 |
| Issue 短评论 | summary 回写链接/摘要 | 无长日志双写 |
| 计划审批（可配置） | pending_review → approved | 未批准不可 complete 成功路径 |
| 审查闸拆分 | spec / plan / implement / verify；bootstrap 信封 | 见 review-gates.md；wait_plan 禁 implement |
| 协议 Skill | kanban.intake/plan/implement/verify/finalize | 过闸只认 TIP，不认 SKILL.md 路径 |

**参考**：Backlog.md 的 plan / notes / final summary 字段语义；指令入口仍由 Adapter 写指针。

### M3 — TIP + 多 Agent 协作

**目标**：两异构 Agent 可串行交接同一父任务。

| 项 | 说明 | 验收 |
|----|------|------|
| `POST /api/v1/tip` | 信封校验 + message_id 幂等 | 契约测试 |
| claim / heartbeat / progress | lease 超时 failed | 并发 claim 仅一成功 |
| complete / fail | 对接状态机 → in_review | 事件 tip + task.moved_in_review |
| handoff | context_ref=artifact id | 新旧 assignment 链路可查 |
| ask_human | 详情 blocked + 可选通知 | 人工回复 API |
| Adapter | Polling + HTTP Push；CLI P1 | Runtime 不绑死 WorkBuddy |
| task_edge | parent_of / blocks | 看板可展示简单依赖 |

### M4 — Notifier + 可视化增强

**目标**：完成事件到达 ≥2 种渠道；计划与分配一眼可读。

| 项 | 说明 | 验收 |
|----|------|------|
| notify_channel | webhook + 至少 1 个 IM | 双渠道同时收到 completed |
| delivery_log | 可查询 | 失败重试 3 次 |
| Agent Swimlane | 按 Agent 看负载 | 与 max_concurrency 一致 |
| Plan Panel | 展示最新 plan + 审批按钮 | 连 M2 |
| Assignment Timeline | 自动/手动/重试/handoff | 详情内 |

## 四、文档已完成 vs 代码待做

### 本轮已改（文档 / 契约）

- [x] `shared-context/architecture.md` — 双 SoT + 新分层
- [x] `shared-context/README.md` — 愿景与模块索引
- [x] `modules/artifact-store.md` / `agent-protocol.md` / `notifier.md`
- [x] `docs/schema.sql` — artifact / tip / notify / edge
- [x] `docs/events.yaml` — tip / artifact / outbound_notifications
- [x] `docs/types.ts` — 对应类型
- [x] `docs/README.md` — 模块契约索引
- [x] 本计划 `08-requirements-aligned-plan.md`
- [x] 既有模块 PRD 对齐补丁（runtime / orchestrator / dashboard）
- [x] `modules/review-gates.md` — 三关拆分、协议 Skill、Bootstrap 信封
- [x] `canvases/` 保留需求分析画布 SSOT + `tools/canvas-load` 同步到 Cursor

### 代码仍属后续（不在本轮）

- openapi.yaml 增补 Artifact / TIP / Notify paths
- backend-go / backend-node 迁移与实现
- frontend 详情时间线 / swimlane / 渠道配置页
- contract-tests 增补用例

## 五、关键决策记录（ADR 摘要）

| ID | 决策 | 理由 |
|----|------|------|
| ADR-1 | 状态 SoT=GitHub，过程 SoT=Artifact | 满足「完全同步」与「文档留存」同时成立 |
| ADR-2 | Agent done → in_review 而非直接 done | 保留人审 Code 关（对齐 Backlog.md） |
| ADR-6 | 口头三关拆成 stage+gate；指令入口只放 bootstrap 指针 | 防工作流在 AGENTS.md 与协议双写漂移 |
| ADR-3 | 协作用 TIP，不靠私有 webhook 方言 | 多产品 Agent 可替换 |
| ADR-4 | 通知异步，失败不回滚任务 | 主链路稳定 |
| ADR-5 | 双后端策略沿用 07 | 契约先行，实现可并行 |

## 六、风险

| 风险 | 缓解 |
|------|------|
| Issue 评论与 Artifact 双写漂移 | 评论只放摘要+链接 |
| TIP 与旧 Polling Automation 并存 | M3 前 Runtime 仍支持旧路径；新 Agent 走 TIP |
| schema 扩展后旧 DB | 提供迁移；Go migrations 与 Node bootstrap 同步 |
| openapi 未同步 | M2 开工第一天先改 openapi，再写实现 |

## 七、建议下一动作

1. 补 `docs/openapi.yaml` 中 Artifact / TIP / Notify 路径（M2 启动门闩）
2. 为 Go/Node 增加 schema 迁移，使新表可落地
3. 前端详情面板先接 Artifact 时间线（可先 mock）
