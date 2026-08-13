# 任务：可选服务 Compose profiles

- **状态**：pending
- **模块**：03-infra
- **优先级**：P1
- **依赖**：T02

## 目标

用 compose profiles 提供可选能力（如向量库、邮件、可观测），默认不启动。

## 执行步骤

1. 选定 1–2 个可选服务（优先向量库）
2. 用 `profiles:` 挂到 compose
3. 文档写清 `docker compose --profile X up`

## 产出

- 更新 compose + `docs/profiles.md`

## 验收标准

- [ ] 默认 up 不含可选服务
- [ ] profile 启动命令有文档

## 如何执行

```text
请执行 base/innate-foundation/modules/03-infra/tasks/T03-optional-profiles.md，使用 Local Workflow。
```
