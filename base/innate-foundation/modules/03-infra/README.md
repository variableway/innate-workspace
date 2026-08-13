# 03-infra — 基础设施与 docker-compose

## 范围

本地开发常用依赖服务的 compose、env、profile 与引用文档。

## 代码落点

- 本目录：`compose.yml`、`profiles/`、`.env.example`、`docs/`

## 依赖

- G01（命名）
- 被 `02-be-base` 等模块消费

## 任务索引

| 任务 | 说明 | 优先级 |
|------|------|--------|
| [T01-compose-baseline.md](tasks/T01-compose-baseline.md) | Postgres + Redis + MinIO 最小集合 | P0 |
| [T02-env-health-volumes.md](tasks/T02-env-health-volumes.md) | env / healthcheck / volume 约定 | P0 |
| [T03-optional-profiles.md](tasks/T03-optional-profiles.md) | 可选 profile（向量库等） | P1 |
| [T04-project-include-docs.md](tasks/T04-project-include-docs.md) | projects 如何引用本文档与 compose | P1 |
