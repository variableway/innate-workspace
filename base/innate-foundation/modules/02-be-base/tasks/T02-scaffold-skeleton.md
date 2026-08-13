# 任务：搭建可运行的后端骨架

- **状态**：pending
- **模块**：02-be-base
- **优先级**：P0
- **依赖**：T01；建议 03-infra T01 已完成

## 背景

模块目录目前只有任务文件，需要长出真实代码。

## 目标

在本模块内落地最小可运行服务（healthz + 配置加载 + 日志）。

## 执行步骤

1. 按 ADR 初始化项目结构（含 README、`.env.example`、启动脚本）
2. 实现 `GET /healthz`（或等价）
3. 配置与日志走统一入口
4. 文档写清：如何用 infra compose 联调（若已有）

## 产出

- 可运行源码树（本模块下）
- 启动说明写入模块 README

## 验收标准

- [ ] 本地一条命令可启动
- [ ] health 检查返回成功
- [ ] `.env.example` 完整

## 如何执行

```text
请执行 base/innate-foundation/modules/02-be-base/tasks/T02-scaffold-skeleton.md，使用 Local Workflow。
```
