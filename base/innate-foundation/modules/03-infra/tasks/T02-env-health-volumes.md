# 任务：统一 env、健康检查与 volume 约定

- **状态**：pending
- **模块**：03-infra
- **优先级**：P0
- **依赖**：T01

## 目标

让其它模块/项目复制 `.env.example` 即可联调，服务具备 healthcheck。

## 执行步骤

1. 添加 `.env.example`（含密码占位、端口、bucket）
2. 为各服务配置 `healthcheck`
3. 写 `docs/volumes-and-env.md`：命名规则、勿提交密钥
4. 确认 compose 使用 env 文件且默认值安全

## 产出

- `.env.example`
- `docs/volumes-and-env.md`
- 更新后的 compose

## 验收标准

- [ ] 所有必需变量出现在 `.env.example`
- [ ] 每个核心服务有 healthcheck
- [ ] README 说明 copy env 步骤

## 如何执行

```text
请执行 base/innate-foundation/modules/03-infra/tasks/T02-env-health-volumes.md，使用 Local Workflow。
```
