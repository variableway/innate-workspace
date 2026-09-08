# 懒猫私有云部署指南

## 前置条件

1. **懒猫盒子**（LazyCat Box）已联网并激活
2. **开发者工具**应用已安装（盒子上的应用商店搜索安装）
3. **Node.js 18+** 已安装（用于 lzc-cli）

## 快速部署

### 1. 安装 lzc-cli

```bash
npm install -g @lazycatcloud/lzc-cli
```

### 2. 登录盒子

```bash
lzc-cli box login
# 按提示输入盒子地址和凭证
```

### 3. 部署 baas 服务

```bash
cd services/baas/lazycat

# 方式一：打包 + 安装到盒子
bash deploy.sh

# 方式二：仅打包（不安装）
bash deploy.sh --build
```

### 4. 验证部署

```bash
# 查看容器状态
lzc-cli docker ps -a

# 查看日志
lzc-cli docker logs -f baas-db
```

## LPK 打包结构

```
services/baas/lazycat/
├── package.yml          # 应用元数据（包名、版本、描述）
├── lzc-build.yml        # 打包配置（输出路径、图标、manifest）
├── lzc-manifest.yml     # 运行时定义（服务、路由、密钥、存储）
├── lzc-icon.png         # 应用图标（512x512 PNG）
├── deploy.sh            # 一键打包安装脚本
└── content/             # 打包时生成，包含 init.sql 等静态文件
```

## 路由配置

懒猫网关自动处理 HTTPS 路由：

| 路径 | 目标服务 | 端口 | 说明 |
|------|---------|------|------|
| `/api/*` | PostgREST | 3000 | REST API |
| `/auth/*` | Authentik | 9000 | 认证 |
| `/realtime/*` | Mercure | 80 | 实时推送 |
| `/minio/*` | MinIO Console | 9001 | 存储控制台 |
| `/` | MinIO Console | 9001 | 默认页 |

访问地址：`https://baas.<你的盒子域名>/`

## 密钥管理

懒猫使用 `stable_secret` 模板函数自动生成和持久化密钥：

```yaml
# lzc-manifest.yml 中的用法
environment:
  POSTGRES_PASSWORD: '{{ stable_secret "pg_password" }}'
  PGRST_JWT_SECRET: '{{ stable_secret "jwt_secret" }}'
```

- 首次安装时自动生成
- 卸载重装后密钥不变（stable）
- 无需手动管理 `.env` 文件

## TCP 端口转发

PostgreSQL 支持 TCP 直连（L4 Ingress）：

```yaml
# lzc-manifest.yml
ingress:
  - port: 15432
    service: db
    container_port: 5432
```

```bash
# 从外部连接
psql -h <盒子IP> -p 15432 -U postgres
```

## 常见问题

### Q: 安装后 Authentik 无法启动？

A: 需要先创建 Authentik 数据库：

```bash
lzc-cli docker exec -it baas-db psql -U postgres -c "CREATE DATABASE authentik;"
lzc-cli docker restart baas-authentik baas-authentik-worker
```

### Q: 镜像拉取太慢？

A: 使用懒猫镜像仓库：

```bash
lzc-cli appstore copy-image paradedb/paradedb:latest
lzc-cli appstore copy-image postgrest/postgrest:latest
# ... 其他镜像
```

### Q: 如何发布到懒猫应用商店？

```bash
lzc-cli appstore publish ./selfhost-baas-1.0.0.lpk
```
