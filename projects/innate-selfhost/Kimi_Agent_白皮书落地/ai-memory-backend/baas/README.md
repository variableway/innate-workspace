# baas —— 去 Supabase 化自托管 BaaS

对应白皮书 **2.2 Skill 2 / 2.4 Tier 2 / 2.5 方案 B**：用一组可独立替换的开源组件，
在一台 4C8G VPS（约 **€22/月**）上拼出完整的后端即服务，无供应商锁定。

## 组件对照表

| 本栈组件 | 镜像 | 替代的 Supabase 组件 | 端口 |
|---|---|---|---|
| db | `paradedb/paradedb:latest`（PostgreSQL + pgvector + pg_search） | Supabase Postgres | 5432 |
| postgrest | `postgrest/postgrest` | Supabase REST API（自动 CRUD） | 3000 |
| auth / auth-worker | `ghcr.io/goauthentik/server`（+ valkey 作 Redis 依赖） | Supabase Auth（GoTrue） | 9002 / 9443 |
| realtime | `dunglas/mercure`（SSE 推送） | Supabase Realtime | 8001 |
| storage / minio-init | `minio/minio` + `minio/mc`（S3 兼容，自动建桶） | Supabase Storage | 9000 / 9001 |
| gateway | `traefik` | Supabase Kong 网关 | 8000（统一入口）/ 8080（dashboard） |

网关路由：`/api/*` → PostgREST，`/auth/*` → Authentik，`/realtime/*` → Mercure，`/minio/*` → MinIO 控制台。

## 启动步骤

```bash
cd baas
cp .env.example .env        # 编辑 .env，替换所有 change-me 密钥
docker compose up -d        # 首次启动会自动执行 init.sql
# Authentik 需要独立数据库（首次启动后执行一次）：
docker compose exec db psql -U postgres -c "CREATE DATABASE authentik;"
docker compose restart auth auth-worker
docker compose ps           # 查看健康状态
```

## 验证命令

```bash
# 1. PostgREST：直接列出示例表（走网关则 curl http://localhost:8000/api/documents）
curl http://localhost:3000/documents
curl http://localhost:3000/tenants

# 2. 向量检索（SQL 直连）
docker compose exec db psql -U postgres -c \
  "SELECT id, content FROM documents ORDER BY embedding <=> '[0.1,0.2]'::vector LIMIT 5;"

# 3. RLS 多租户隔离
docker compose exec db psql -U postgres -c \
  "SET app.tenant_id='00000000-0000-0000-0000-000000000001'; SELECT count(*) FROM documents;"

# 4. Authentik 控制台：浏览器打开 http://localhost:9002（或经网关 /auth）
#    使用 .env 中 AUTHENTIK_BOOTSTRAP_EMAIL / PASSWORD 登录

# 5. MinIO 控制台：浏览器打开 http://localhost:9001（或经网关 /minio）
#    使用 MINIO_ROOT_USER / MINIO_ROOT_PASSWORD 登录；minio-init 已建好 public/private 桶

# 6. Mercure 订阅（SSE）
curl -N "http://localhost:8001/.well-known/mercure?topic=demo"

# 7. Traefik 路由总览：http://localhost:8080
```

## 成本说明

整套栈常驻内存约 4–6 GB（Postgres ~0.5G、Authentik server+worker ~2G、MinIO ~0.5G、
PostgREST/Mercure/Traefik/Redis 合计 <1G），一台 **4C8G VPS（约 €22/月，如 Hetzner CX32）**
即可承载 Tier 2 规模（日活 1–10 万）的中小 SaaS 后端；横向扩容时各层可独立拆分替换
（如 Neon 托管 Postgres、Cloudflare R2 替换 MinIO），无供应商锁定。
