# Agent Infra

个人 / 私有云 **AI Agent 基础设施** 的合并文档。把三份交叉调研收成一套可读手册，去掉 HTML 站点、React 壳和重复章节稿。

| 主题 | 文档 |
|------|------|
| 总图与产品落点 | [overview.md](./overview.md) |
| Runtime + Plugin（MCP / Tauri / 安全） | [runtime-plugins.md](./runtime-plugins.md) |
| 记忆层 + PG 后端选型 | [memory-backend.md](./memory-backend.md) |
| 部署（Compose / 懒猫 / 排障） | [deployment.md](./deployment.md) |
| 生态对照（Harness / Top 方案） | [ecosystem.md](./ecosystem.md) |

## 从哪里合并

| 原目录 | 贡献 | 未迁入本目录的部分 |
|--------|------|-------------------|
| `base/innate-selfhost/Kimi_Agent_AI 运行时与插件调研` | Agent Runtime、MCP、Tauri、SQLite 共识、懒猫模式、Top 20 | 分章草稿 `*_sec*.md`、`research/`、docx/pdf（营销站 `app/` 已删） |
| `base/innate-selfhost/Kimi_Agent_白皮书落地` | PG 五方案对比、memweave/baas 契约、端侧×中枢演进 | `pg-backend-comparison/` HTML/PPT、白皮书工程副本（实现已在 `services/`） |
| `base/innate-selfhost/Kimi_Agent_Deployment_v6` | 对外落地页「OPC Hub」定位 | `assets/` + 落地页实际引用的图；未引用大图已删 |
| `base/innate-selfhost/docs/` | 架构 / 网络 / 懒猫 / 排障（与白皮书落地重叠，已并入 [deployment.md](./deployment.md)） | — |

可运行代码仍在 `base/innate-selfhost/services/`（`baas`、`memweave`），不进文档仓。

## 事实日期

- Runtime / 插件调研：约 **2026-05**
- PG 后端与懒猫落地：约 **2026-08-16**
- Stars、定价、CVE 会过期；采用前按 [memory-backend.md](./memory-backend.md) 验证清单复核

## 一条结论

桌面 Runtime 推荐 **Tauri v2 + Rust + MCP + SQLite**；中枢后端在私有云场景推荐 **开源组合栈**（ParadeDB + PostgREST + Authentik + MinIO + Mercure），已有懒猫 LPK。端侧记忆（memweave）与 PG 系统记录分工，而不是二选一。
