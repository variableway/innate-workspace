# DevTools — 开发工具链

自托管的开发基础设施，包括代码仓库、镜像仓库、CI/CD 等。

## 状态

🔲 预留 — 待实现

## 规划组件

| 组件 | 说明 | 状态 |
|------|------|------|
| Gitea | 轻量级 Git 托管 | 🔲 待建 |
| Harbor | 容器镜像仓库 | 🔲 待建 |
| Drone CI | CI/CD 流水线 | 🔲 待建 |
| Portainer | Docker 管理面板 | 🔲 待建 |

## 快速开始（规划中）

```bash
cd services/devtools
cp .env.example .env
docker compose up -d
```

## 端口规划

| 端口 | 服务 | 说明 |
|------|------|------|
| 3001 | Gitea | Git 托管 Web UI |
| 5000 | Harbor | 镜像仓库 |
| 8002 | Drone CI | CI/CD 面板 |
| 9443 | Portainer | Docker 管理 |
