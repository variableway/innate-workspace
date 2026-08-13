# 任务：落地 compose 最小服务集合

- **状态**：pending
- **模块**：03-infra
- **优先级**：P0
- **依赖**：G01

## 目标

在本模块提供可 `docker compose up` 的 baseline：Postgres、Redis、MinIO（或等价对象存储）。

## 执行步骤

1. 创建 `compose.yml`（或 `docker-compose.yml`）定义三服务
2. 固定镜像 tag（勿用隐式 latest）
3. 模块 README 写 Quick Start
4. 本地执行 `docker compose config` 校验（若环境有 Docker）

## 产出

- `compose.yml`
- 模块 README Quick Start

## 验收标准

- [ ] `docker compose config` 通过（有 Docker 时）
- [ ] 三服务均有明确端口与数据卷名
- [ ] 镜像 tag 钉死

## 如何执行

```text
请执行 base/innate-foundation/modules/03-infra/tasks/T01-compose-baseline.md，使用 Local Workflow。
```
