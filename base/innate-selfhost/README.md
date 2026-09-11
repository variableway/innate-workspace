# innate-selfhost

本地/私有云环境搭建管理仓库。用于统一管理自托管服务的部署配置、运维脚本和文档。

## 目录结构

```
innate-selfhost/
├── infra/                 # 共享基础设施（网络、网关、全局配置）
├── services/              # 可部署服务（每个服务独立目录）
│   ├── baas/              #   自托管 BaaS 后端
│   ├── memweave/          #   SQLite 本地记忆层
│   ├── ollama/            #   本地 LLM 推理（预留）
│   ├── agent-runtime/     #   AI Agent Runtime（预留）
│   └── devtools/          #   开发工具链（预留）
├── scripts/               # 通用运维脚本
├── docs/                  # 运维短文（已并入仓库 docs/agent-infra）
├── Kimi_Agent_*/          # 调研归档（结论见 docs/agent-infra）
└── references/            # 参考资料
```

## 快速开始

### 1. 环境准备

```bash
# 克隆仓库
git clone <repo-url> innate-selfhost
cd innate-selfhost

# 初始化环境（检查依赖、创建 .env）
bash scripts/setup.sh
```

### 2. 部署服务

```bash
# 部署单个服务
bash scripts/deploy.sh baas

# 部署所有服务
bash scripts/deploy.sh --all

# 懒猫私有云部署
cd services/baas/lazycat
bash deploy.sh
```

### 3. 验证

```bash
# 健康检查
bash scripts/health-check.sh
```

## 服务矩阵

| 服务 | 状态 | 端口 | 说明 |
|------|------|------|------|
| **baas** | ✅ 就绪 | 8000, 3000, 5432, 9000 | 自托管 BaaS：ParadeDB + PostgREST + Authentik + MinIO + Mercure |
| **memweave** | ✅ 就绪 | — | SQLite 本地优先 AI 记忆层，FTS5 + 向量混合搜索 |
| **ollama** | 🔲 预留 | 11434 | 本地 LLM 推理（Ollama） |
| **agent-runtime** | 🔲 预留 | — | AI Agent Runtime（Tauri 基座） |
| **devtools** | 🔲 预留 | — | GitLab, Harbor, CI/CD 等 |

## 技术栈

- **编排**: Docker Compose
- **IaC**: Shell 脚本
- **数据库**: ParadeDB (PostgreSQL 17 + pgvector + pg_search)
- **认证**: Authentik
- **对象存储**: MinIO (S3 兼容)
- **实时推送**: Mercure (SSE)
- **REST API**: PostgREST
- **网关**: Traefik / 懒猫内置网关

## 懒猫私有云支持

本仓库的服务支持打包为懒猫私有云 LPK 应用。每个服务的 `lazycat/` 目录包含：

- `package.yml` — 应用元数据
- `lzc-manifest.yml` — 运行时服务定义
- `lzc-build.yml` — 打包配置
- `deploy.sh` — 一键打包安装脚本

详见 [懒猫部署指南](docs/lazycat-deployment.md)。

## 文档

Agent 基础设施（Runtime、记忆层、PG 选型、懒猫/Compose）的**合并手册**：仓库根目录 [docs/agent-infra](../../docs/agent-infra/)。

本目录 `docs/` 仍是面向运维的短文，内容已吸收进上述手册的 [deployment.md](../../docs/agent-infra/deployment.md)：

- [架构说明](docs/architecture.md)
- [懒猫部署指南](docs/lazycat-deployment.md)
- [网络拓扑](docs/network.md)
- [常见问题](docs/troubleshooting.md)

`Kimi_Agent_*` 三个目录是调研归档，勿当现行规范。
