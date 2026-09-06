# 懒猫私有云部署 —— 自托管 BaaS

将 `baas/docker-compose.yml` 整栈按[懒猫官方转换规则](https://developer.lazycat.cloud/app-example-porting.html)改写为 LPK 应用。

## 文件说明

| 文件 | 作用 |
|------|------|
| `package.yml` | 应用静态元数据（包名 `cloud.lazycat.app.selfhost-baas`、版本、名称） |
| `lzc-manifest.yml` | 运行结构：7 个服务 + 路由 + TCP 转发，对应原 compose 全栈 |
| `lzc-build.yml` | 打包配置（图标、内容目录、输出位置） |
| `lzc-icon.png` | 应用图标（512×512，<200KB） |
| `deploy.sh` | 一键打包 + 安装脚本 |

## 快速部署

```bash
npm install -g @lazycatcloud/lzc-cli   # 一次性安装 CLI（盒子上需装「开发者工具」应用）
bash deploy.sh                          # 打包并安装到默认盒子
bash deploy.sh --build                  # 只产出 .lpk，可放懒猫网盘点击安装
```

安装后通过 `https://baas.<你的微服域名>/` 访问（`/api/` REST、`/auth/` Authentik、
`/realtime/` Mercure、`/minio/` MinIO 控制台），PostgreSQL 经 TCP 15432 端口局域网直连。

## 与 docker-compose 版的差异

1. **无需 .env**：所有密钥（PG 密码、JWT secret、MinIO 凭据等）由懒猫的
   `stable_secret` 模板函数在首次安装时自动生成并持久化，重启/重装不变。
2. **无需 Traefik**：懒猫自带 HTTPS 网关，`application.routes` 直接做域名/路径分流。
3. **无需端口冲突管理**：仅数据库通过 `ingress` 暴露 TCP 15432；其余服务走
   `<service>.cloud.lazycat.app.selfhost-baas.lzcapp` 内部域名互访。
4. **数据持久化**：统一挂在 `/lzcapp/var/` 下（pgdata / minio / authentik / redis），
   卸载保留数据、重装自动复用。

## PostgREST 是可选的吗？

是。它只是「自动生成 REST API」层，三种处理方式：

- **不用它**：应用直接 SQL/ORM 连库（15432 端口），功能无损；
- **换掉它**：Hasura（GraphQL）或 pREST 替代，改 manifest 中对应 service 即可；
- **在懒猫版中移除**：删除 `lzc-manifest.yml` 里的 `postgrest` 服务块和
  `routes` 中的 `/api/` 行，其余不受影响；
- **在 compose 版中临时停用**：`docker compose up -d --scale postgrest=0`。

## 已知注意事项

- Authentik 首次启动前需手动建库：
  `lzc-cli docker exec -it <db容器名> psql -U postgres -c 'CREATE DATABASE authentik;'`
- 若盒子拉取 ghcr.io / Docker Hub 镜像缓慢，可用
  `lzc-cli appstore copy-image <镜像名>` 拷到懒猫官方仓库后替换 manifest 中的镜像地址。
- 上架商店：先 `lzc-cli appstore copy-image` 替换全部镜像地址，再
  `lzc-cli project build && lzc-cli appstore publish ./<包名>.lpk`。
