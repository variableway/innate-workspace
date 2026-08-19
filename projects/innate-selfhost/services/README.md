# Services

可部署服务目录。每个服务独立包含自己的 `docker-compose.yml` 和配置。

## 服务索引

| 服务 | 状态 | 端口 | 说明 |
|------|------|------|------|
| [baas](baas/) | ✅ 就绪 | 8000, 3000, 5432, 9000 | 自托管 BaaS 后端（ParadeDB + PostgREST + Authentik + MinIO） |
| [memweave](memweave/) | ✅ 就绪 | — | SQLite 本地优先 AI 记忆层（Python 库） |
| [ollama](ollama/) | 🔲 预留 | 11434 | 本地 LLM 推理 |
| [agent-runtime](agent-runtime/) | 🔲 预留 | — | AI Agent Runtime |
| [devtools](devtools/) | 🔲 预留 | — | 开发工具链 |

## 部署顺序

推荐按以下顺序部署：

1. **memweave** — 无外部依赖，可独立运行
2. **baas** — 核心后端栈，其他服务可能依赖其 PostgreSQL
3. **ollama** — 本地 LLM 推理，为 Agent 提供模型服务
4. **agent-runtime** — 依赖 baas + ollama
5. **devtools** — 独立工具链

## 添加新服务

1. 在 `services/` 下创建目录：`services/<service-name>/`
2. 添加 `docker-compose.yml`、`.env.example`、`README.md`
3. 如需懒猫部署，添加 `lazycat/` 子目录（参考 `baas/lazycat/`）
4. 更新本文件的服务索引表
