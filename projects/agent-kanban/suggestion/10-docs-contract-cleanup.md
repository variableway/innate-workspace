# 10 — docs/ 契约层清理：移出的想法清单

> 日期：2026-08-18
> 背景：`docs/` 是**契约 SSOT**（`docs/README.md`），但其中混入了三项「想法级」内容——
> 未实现、无代码引用、属于前瞻性设计。本次清理将其移出契约层，在此存档备查。
> 清理原则：**docs/ 只保留已实现或已承诺（M1–M4 契约先行）的内容；纯想法进 suggestion/**。

## 移出项 1：Agent Audit Log（`kanban_audit_log` 表）

- **原位置**：`docs/schema.sql`（标注「可选, P2」）、`backend-go/migrations/001_init.up.sql`（建表但无任何读写代码）
- **想法内容**：Agent 执行审计日志——`pickup | model_call | skill_call | success | fail | timeout` 事件流，含 `tokens_used` / `duration_ms`
- **来源判断**：与 LobsterBoard 的「LLM 用量监控」、ai4kanban 的 Run log 同源（见 `09` 第 8 节「运营观测页」候选）
- **为何移出**：无任何后端代码查询该表；M1–M4 里程碑均未包含；`kanban_tip_message` 已覆盖协议层审计
- **未来切入点**：M4+ 做「运营观测页」时复活；届时应重新设计——区分**协议审计**（复用 `kanban_tip_message`）与**用量计量**（新表，挂 assignment_id，喂给 dashboard 聚合读模型）

## 移出项 2：通用 Webhook 订阅（`kanban_webhook_subscription` 表）

- **原位置**：`docs/schema.sql`（标注「保留兼容；新逻辑优先 notify_channel」）、`backend-go/migrations/001_init.up.sql`
- **想法内容**：通用出站事件订阅（`events: ["*"]` 通配）
- **为何移出**：openapi.yaml 无对应 REST 端点；无代码引用；功能已被 `kanban_notify_channel`（M4 Notifier，含 `channel_type=webhook`）完整取代——「保留兼容」实际上没有兼容对象
- **未来切入点**：不需要复活。若 M4 需要通配订阅，给 `kanban_notify_channel.events` 支持 `["*"]` 即可

## 移出项 3：Zero-Auth 模式（注释级）

- **原位置**：`docs/schema.sql`（`user_id` 注释）、`docs/types.ts`（`userId` 注释）、`docs/openapi.yaml`（auth 描述）
- **想法内容**：本地单用户场景不要求认证（`user_id` nullable）
- **来源判断**：明显借自 AgentTODO 的 Zero-Auth REST（见 `09` 第 3 节）
- **为何移出**：无任何实现（前后端均无 zero-auth 代码路径）；`references/analysis/04` 已明确「Zero-Auth 不作为唯一安全模型」；契约层保留未实现模式会误导双后端实现
- **处置**：字段 `user_id` 本身保留（better-auth 关联是真实设计），仅移除 Zero-Auth 表述
- **未来切入点**：若未来要做本地单机模式，作为**部署模式**在 `modules/` 层定义（如 `deployment-modes.md`），而非散落在字段注释里；安全基线仍以 token/secret 为默认

## 清理后 docs/ 状态

- `schema.sql`：核心 6 表（workspace/project/task/agent/assignment）+ 扩展 5 表（artifact/gate/task_edge/tip_message/notify_channel + delivery），全部为 M1–M4 已承诺契约
- Go 迁移 `001_init.up/down.sql` 已同步对齐（`docs/README.md` 修改规则：schema 变更 → 各自适配迁移）
- Node 后端 `INLINE_SCHEMA` fallback 本就只含核心表，无需改动

## 未动项（核查过、确认属于契约）

- `artifact` / `gate` / `tip_message` / `notify_channel` / `task_edge`：M2–M4 契约先行，经 `08` 确认「本轮已改」
- `assignment.stage`（intake/wait_spec/plan/…）：review-gates 模块契约
- `states/*.yaml`、`events.yaml`、`contract-tests.yaml`：无想法级标注
