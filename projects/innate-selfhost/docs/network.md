# 网络拓扑

## Docker 网络

所有服务通过 `selfhost-net` 桥接网络互联。

```
┌─────────────────────────────────────────────────┐
│                 selfhost-net                     │
│                                                  │
│  baas-db:5432  baas-postgrest:3000  baas-auth   │
│       │              │                 │         │
│       └──────────────┴─────────────────┘         │
│                      │                           │
│  baas-minio:9000   baas-mercure:80   baas-redis  │
│       │              │                 │         │
│       └──────────────┴─────────────────┘         │
│                                                  │
│  ollama:11434 (预留)                              │
└─────────────────────────────────────────────────┘
```

## 端口分配表

### 外部可访问端口

| 端口 | 服务 | 协议 | 说明 |
|------|------|------|------|
| 8000 | Traefik 网关 | HTTP | 统一入口（懒猫部署时由内置网关替代） |
| 8080 | Traefik Dashboard | HTTP | 网关管理面板 |
| 3000 | PostgREST | HTTP | REST API（可选直接访问） |
| 5432 | PostgreSQL | TCP | 数据库直连 |
| 9000 | MinIO API | HTTP | S3 兼容 API |
| 9001 | MinIO Console | HTTP | 存储管理面板 |
| 9002 | Authentik | HTTP | 认证管理面板 |
| 8001 | Mercure | HTTP | SSE 推送端点 |
| 11434 | Ollama | HTTP | LLM 推理 API（预留） |

### 懒猫部署端口映射

懒猫使用子域名 + 路径路由，外部端口由盒子统一管理：

| 外部访问 | 内部服务 |
|---------|---------|
| `https://baas.<box>/api/*` | PostgREST:3000 |
| `https://baas.<box>/auth/*` | Authentik:9000 |
| `https://baas.<box>/realtime/*` | Mercure:80 |
| `https://baas.<box>/minio/*` | MinIO:9001 |
| `<box>:15432` (TCP) | PostgreSQL:5432 |

## 内部 DNS

懒猫环境下的服务发现：

```
<service>.cloud.lazycat.app.<package-id>.lzcapp
```

例如：`db.cloud.lazycat.app.selfhost-baas.lzcapp`

标准 Docker Compose 环境下使用容器名作为主机名：

```
baas-db:5432
baas-postgrest:3000
baas-minio:9000
```

## 防火墙建议

### 开发环境

所有端口对外开放（仅限内网/VPN）。

### 生产环境

| 端口 | 策略 | 说明 |
|------|------|------|
| 80, 443 | 开放 | HTTP/HTTPS 入口 |
| 8000 | 开放 | 网关入口（非懒猫部署） |
| 5432 | 限制 | 仅允许应用服务器访问 |
| 9000, 9001 | 限制 | 仅内网访问 |
| 9002 | 限制 | 仅管理员访问 |
| 8080 | 禁止 | Traefik Dashboard 不应暴露 |
