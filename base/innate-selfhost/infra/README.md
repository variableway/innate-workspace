# Infra — 共享基础设施

本目录包含所有服务共享的基础设施配置。

## 文件说明

| 文件 | 说明 |
|------|------|
| `docker-compose.base.yml` | 公共网络定义（selfhost-net） |
| `env.example` | 全局环境变量模板 |
| `traefik/` | 统一反向代理网关（可选） |

## 使用方式

大多数服务的 `docker-compose.yml` 会引用 `selfhost-net` 外部网络。
首次部署前需执行：

```bash
# 方式一：运行 setup 脚本（推荐）
bash scripts/setup.sh

# 方式二：手动创建网络
docker network create selfhost-net
```

## 懒猫私有云说明

懒猫私有云自带网关和 HTTPS 证书，无需额外配置 Traefik。
`traefik/` 目录仅用于非懒猫环境下的统一反向代理。
