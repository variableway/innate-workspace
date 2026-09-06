# 常见问题排查

## Docker 相关

### Q: `docker compose up` 报错 "network selfhost-net not found"

**原因**：外部网络未创建。

**解决**：
```bash
bash scripts/setup.sh
# 或手动创建：
docker network create selfhost-net
```

### Q: 容器启动后立即退出

**排查步骤**：
```bash
# 查看容器日志
docker compose logs <service-name>

# 查看容器退出码
docker inspect --format='{{.State.ExitCode}}' <container-name>
```

### Q: 端口被占用

```bash
# 查看端口占用
lsof -i :5432
lsof -i :3000

# 修改 .env 中的端口映射，或停止占用进程
```

## baas 服务相关

### Q: Authentik 启动失败

Authentik 需要独立数据库。首次部署后执行：

```bash
docker compose exec db psql -U postgres -c "CREATE DATABASE authentik;"
docker compose restart auth auth-worker
```

### Q: PostgREST 返回 401

PostgREST 默认需要 JWT 认证。测试时可临时修改配置允许匿名访问：

```yaml
# docker-compose.yml 中 postgrest 服务的 environment
PGRST_JWT_ANON_ROLE: anon
PGRST_DB_ANON_ROLE: anon
```

### Q: MinIO 无法访问

检查 minio-init 容器是否成功创建桶：

```bash
docker compose logs minio-init
```

## 懒猫部署相关

### Q: lzc-cli 命令找不到

```bash
npm install -g @lazycatcloud/lzc-cli
# 确认安装
which lzc-cli
```

### Q: LPK 打包失败

```bash
# 检查配置文件语法
cd services/baas/lazycat
lzc-cli project build -f 2>&1

# 确认 content/ 目录存在且包含 init.sql
ls -la content/
```

### Q: 镜像拉取超时

使用懒猫镜像仓库预同步：

```bash
lzc-cli appstore copy-image paradedb/paradedb:latest
lzc-cli appstore copy-image postgrest/postgrest:latest
lzc-cli appstore copy-image ghcr.io/goauthentik/server:latest
lzc-cli appstore copy-image dunglas/mercure:latest
lzc-cli appstore copy-image minio/minio:latest
lzc-cli appstore copy-image valkey/valkey:latest
```

## memweave 相关

### Q: pytest 测试失败

```bash
# 安装依赖
cd services/memweave
pip install -e .[test]

# 运行测试
python -m pytest -v
```

### Q: sentence-transformers 安装失败

memweave 会自动降级为哈希向量，功能不受影响。如需语义搜索：

```bash
pip install sentence-transformers
# 首次运行会下载模型（约 80MB）
```

## 性能调优

### PostgreSQL 内存优化

```sql
-- 根据服务器内存调整（8GB RAM 示例）
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '4GB';
ALTER SYSTEM SET work_mem = '64MB';
SELECT pg_reload_conf();
```

### Docker 资源限制

```yaml
# docker-compose.yml 中添加
services:
  db:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 512M
```
