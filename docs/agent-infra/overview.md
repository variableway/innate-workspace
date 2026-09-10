# 总图

三份材料讲的是同一条产品线的三层：**桌面 Runtime**、**本地记忆 + 中枢 BaaS**、**私有云交付**。对外名称不完全一致（调研里的 AgentForge、落地页 OPC Hub、仓库里的 innate-selfhost），架构同构。

## 要解决的问题

个人 AI Agent 从「多软件拼凑」变成「一个 Runtime + Plugin」。约束是：

1. 数据尽量不出设备（local-first）
2. 插件要有生态，但不能再走 OpenClaw 式的无审核技能市场
3. 家用/小团队要能装到懒猫盒子，而不是只会托管 BaaS

## 四层架构（Runtime 调研推荐）

```
UI          Tauri v2（跨平台桌面，Capability 权限）
Runtime     Rust（MCP Host、进程、鉴权）
Plugin      MCP Server（stdio / Streamable HTTP）+ 远期 WASM 沙箱
Storage     SQLite 单文件（对话 + 配置 + sqlite-vec）
```

配套本地推理用 **Ollama sidecar**（`ollama run` + OpenAI 兼容 API），不把 LLM 焊进 Runtime。

调研给出的实施节奏：

| 阶段 | 内容 |
|------|------|
| MVP（4–6 周） | Tauri 壳 + Ollama + 5–10 个 MCP stdio + SQLite 会话 |
| 完善（8–12 周） | WASM 沙箱、A2A、sqlite-vec RAG |
| 生态 | MCP 商店（需审核）、CRDT 多设备、信任层 |

产品叙事（`info.md`）：「Your AI Agent, Your Product」——改完的 Agent 可以再打成独立 Tauri 应用。办公文档套件（Doc/Slide/Sheet）是同一 Runtime 上的 MCP skill 矩阵，不是另一套基座。

落地页 `Kimi_Agent_Deployment_v6` 标题为 **OPC Hub / AI Agent 智能情报聚合**，是同一基础设施的站点壳，不含额外架构决策。

## 中枢：去 Supabase 化组合栈（白皮书落地）

私有云侧不绑死某一家 BaaS。参考实现映射：

| 组合栈 | 替代的 Supabase 角色 |
|--------|----------------------|
| ParadeDB（PG + pgvector + pg_search） | Postgres |
| PostgREST（可选，可换 Hasura/pREST） | REST |
| Authentik | Auth / GoTrue |
| Mercure（SSE） | Realtime |
| MinIO | Storage |
| Traefik 或懒猫网关 | Kong |

常驻约 4–6 GB RAM；调研口径一台 4C8G VPS（约 €22/月）可覆盖日活 1–10 万量级的中小后端。**容器实机启动在原报告里未验证**，compose YAML 已通过解析。

## 「软件版懒猫」

Runtime 报告的跨维度判断：懒猫 **LZCOS + LPK 商店 + NAT3 穿透** 与 **Tauri + MCP Marketplace + SQLite** 同构。innate-selfhost 走中间路线——软件栈可 Compose 可 LPK，硬件仍可用懒猫盒子。

## 不要混的两件事

- **Agent Runtime 排行**（Goose / Cline / Ollama…）选的是「桌面或编码 Agent 程序」，见 [ecosystem.md](./ecosystem.md)。
- **PG BaaS 排行**（Supabase / InsForge / 组合栈…）选的是「系统记录与 API」，见 [memory-backend.md](./memory-backend.md)。

两者通过 memweave（端侧）和 baas（中枢）衔接，API 形状保持 `write_memory` / `search`。
