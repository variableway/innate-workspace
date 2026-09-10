# 部署

合并 `innate-selfhost/docs/`（architecture / network / lazycat / troubleshooting）、白皮书 baas README，以及 Runtime 报告「懒猫模式」章中与交付相关的部分。硬件报价会过期。

## 三种模式

| 模式 | 何时用 |
|------|--------|
| 懒猫 LPK（推荐家用/小团队） | 盒子已激活；要 HTTPS、穿透、`stable_secret` |
| Docker Compose | VPS / 开发机 |
| 单服务 | 只要 PG 或只要记忆层 |

可运行入口：`base/innate-selfhost` 的 `scripts/setup.sh`、`scripts/deploy.sh`。

## 组合栈拓扑

```
客户端
  → Traefik :8000（懒猫上由盒子网关代替）
      /api/*      → PostgREST :3000 → ParadeDB :5432
      /auth/*     → Authentik
      /realtime/* → Mercure SSE
      /minio/*    → MinIO Console
```

懒猫访问：`https://baas.<盒子域名>/`；PG TCP：`<盒子>:15432` → 容器 5432。

内部网：Compose 用 `selfhost-net` 与容器名；懒猫用 `<service>.cloud.lazycat.app.<package-id>.lzcapp`。

## Compose 要点

```bash
cd base/innate-selfhost
bash scripts/setup.sh          # 创建 selfhost-net 等
cd services/baas
cp .env.example .env           # 换掉所有 change-me
docker compose up -d
docker compose exec db psql -U postgres -c "CREATE DATABASE authentik;"
docker compose restart auth auth-worker
```

组件对照见 [memory-backend.md](./memory-backend.md)。PostgREST 可 `--scale postgrest=0` 关掉。

外部端口（开发）：8000 网关、8080 Traefik Dashboard、3000 REST、5432 PG、9000/9001 MinIO、9002 Authentik、8001 Mercure、11434 Ollama（预留）。生产应关掉 8080，限制 5432/9000/9002。

## 懒猫 LPK

```bash
npm install -g @lazycatcloud/lzc-cli
lzc-cli box login
cd base/innate-selfhost/services/baas/lazycat
bash deploy.sh                 # --build 只打包
```

清单：`package.yml`、`lzc-build.yml`、`lzc-manifest.yml`、`deploy.sh`。密钥用 `{{ stable_secret "pg_password" }}` 这类模板，卸载重装保持不变。

镜像慢：`lzc-cli appstore copy-image <镜像>`。

## 懒猫在产品矩阵里的位置（调研摘要）

懒猫是「家庭私有云」而不是传统 NAS：LZCOS + LPK 商店 + NAT3 穿透。飞牛 OS 是免费 DIY；极空间/绿联偏消费 NAS。个人知识库常见组合仍是 Ollama + AnythingLLM + 国产模型。与本仓库关系：我们提供 **LPK 化的软件栈**，不绑定必须买某型号盒子。

## 排障（高频）

| 现象 | 处理 |
|------|------|
| `network selfhost-net not found` | `bash scripts/setup.sh` 或 `docker network create selfhost-net` |
| Authentik 起不来 | 先 `CREATE DATABASE authentik` 再重启 auth 与 worker |
| PostgREST 401 | 开发可配 `PGRST_DB_ANON_ROLE=anon`（生产不要敞开） |
| 端口占用 | `lsof -i :5432` 等，或改 `.env` 映射 |
| memweave pytest 红 | `pip install -e .[test]`；sentence-transformers 失败会降级哈希向量 |
| LPK 构建失败 | `lzc-cli project build -f`；确认 `content/` 含 `init.sql` |

PG 8GB 机器可参考：`shared_buffers=2GB`、`effective_cache_size=4GB`。compose 里给 db 加 memory limit。

原报告声明：**baas 容器实机未在无 Docker 的调研环境拉起**。上线前按 [memory-backend.md](./memory-backend.md) 的 fresh install 清单做一遍。
