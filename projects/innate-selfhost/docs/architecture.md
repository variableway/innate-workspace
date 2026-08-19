# 架构说明

## 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    懒猫私有云 (LazyCat Box)                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              LazyCat 内置网关 (HTTPS)                   │  │
│  │    baas.<box>/  →  Traefik  →  各服务                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌─────────────┐  │
│  │   db    │  │ postgrest│  │  auth   │  │   storage   │  │
│  │(ParadeDB)│  │(REST API)│  │(Authentik)│  │  (MinIO)   │  │
│  └────┬────┘  └────┬─────┘  └────┬────┘  └──────┬──────┘  │
│       │            │             │               │          │
│  ┌────┴────────────┴─────────────┴───────────────┴──────┐  │
│  │              selfhost-net (Docker Network)            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────┐  ┌──────────┐  ┌─────────────────────────┐   │
│  │ realtime│  │  redis   │  │  ollama (本地 LLM)       │   │
│  │(Mercure)│  │ (Valkey) │  │  memweave (记忆层)       │   │
│  └─────────┘  └──────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 组件关系

### baas 服务栈（9 个容器）

```
客户端请求
    │
    ▼
┌─────────┐
│ Traefik │  统一入口 :8000
│(gateway)│
└────┬────┘
     │ 路由规则
     ├── /api/*      → PostgREST (:3000) → PostgreSQL (:5432)
     ├── /auth/*     → Authentik (:9000) → PostgreSQL + Redis
     ├── /realtime/* → Mercure (:80)
     └── /minio/*    → MinIO Console (:9001)
```

### 数据流

1. **写入路径**：客户端 → PostgREST → PostgreSQL (ParadeDB)
2. **认证路径**：客户端 → Authentik → PostgreSQL (authentik DB)
3. **存储路径**：客户端 → MinIO API (:9000) → 本地 volume
4. **实时推送**：服务端 → Mercure → SSE → 客户端

## 技术栈

| 层级 | 组件 | 说明 |
|------|------|------|
| 数据库 | ParadeDB | PostgreSQL 17 + pgvector + pg_search |
| REST API | PostgREST | 自动生成 CRUD API |
| 认证 | Authentik | SSO/OIDC/SAML |
| 对象存储 | MinIO | S3 兼容 |
| 实时推送 | Mercure | SSE (Server-Sent Events) |
| 缓存 | Valkey | Redis 兼容 |
| 网关 | Traefik | 反向代理 + 负载均衡 |
| 记忆层 | memweave | SQLite + FTS5 + 向量搜索 |

## 部署模式

### 模式一：懒猫私有云部署（推荐）

- 使用 `lzc-cli` 打包为 LPK 应用
- 自动 HTTPS 证书
- 内置网关路由
- `stable_secret` 自动管理密钥
- 适合：家庭/小团队私有云

### 模式二：标准 Docker Compose 部署

- 直接 `docker compose up -d`
- 需手动配置反向代理和证书
- 适合：VPS / 开发环境

### 模式三：单服务独立部署

- 每个服务可独立运行
- 适合：只需部分功能的场景
