# Sprint 4 — scaffold 首跑（factory 心跳）

> 状态：todo ｜ 前置：Sprint 3 ｜ 设计依据：innate-factory.md §10 Phase 4

## 总体目标

`new_app` 生成器跑通"生成 → git init → registry 登记 → 构建绿"全链路，并用**一个真实小 app** 验收——这是 factory 的定义性时刻。

## 任务表

| ID | 任务 | 状态 | 依赖 |
|----|------|------|------|
| [T01](./T01-new-app.md) | scaffold/new_app.py 生成器 | todo | Sprint 3 |
| [T02](./T02-first-real-app.md) | 生成首个真实 app 并全链路验收 | todo | T01 |

## 验收

- `python3 factory/scaffold/new_app.py <name> --template app-content` 一条命令产出可构建 app
- registry/apps.yaml 自动登记（scan 后字段保留契约成立）
- 真实 app 构建绿 + 看板 issue 建好（GitHub Issues）
