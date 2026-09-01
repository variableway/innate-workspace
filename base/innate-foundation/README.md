# innate-foundation

把 `base/README.md` 里的基础能力**完全拆成独立模块**，每个模块自带可执行任务（Local Workflow）。

## 模块一览

| 模块目录 | 对应 README | 目标产物 | 现状 |
|----------|-------------|----------|------|
| [`modules/01-fe-base`](modules/01-fe-base/) | 前端基础 + FE Skill | 以现有 `base/innate-fe-base` 为唯一入口，补齐治理与复用边界 | 代码已有，任务做增强 |
| [`modules/02-be-base`](modules/02-be-base/) | 后端基础 + BE Skill | 任务在本模块；实现见 [`innate-backend`](../innate-backend/) + `projects/tooling/innate-*` | Skill/样例已迁出 |
| [`modules/03-infra`](modules/03-infra/) | 基础设施 / compose | 本地开发 compose 与 profile | 待建 |
| [`modules/04-agent-provider`](modules/04-agent-provider/) | Agent Provider Config Lib | 可复用的 Provider/Profile/模型配置库 | 参考有（flock / aiswitcher） |
| [`modules/05-agent-runtime`](modules/05-agent-runtime/) | Agent Runtime | 不绑 UI 的可嵌入 Runtime | 参考有（flock-agent） |
| [`modules/06-desktop-shell`](modules/06-desktop-shell/) | Tauri 共享打包框架 | Desktop shell / packaging lib；编译缓存见 [`base/innate-backend/innate-go/desktop`](../desktop-cargo/) | 缓存已有，shell lib 待建 |
| [`modules/07-desktop-components`](modules/07-desktop-components/) | Desktop 基础组件 | 跨产品桌面 UI 积木 | 待建 |

横切治理任务：[`tasks/`](tasks/)

全量任务表见 [`TASKS.md`](./TASKS.md)。

## 如何执行任务

每个任务文件可被 Local Workflow 直接执行。对 Agent 说：

```text
请执行 base/innate-foundation/modules/<module>/tasks/<task>.md，使用 Local Workflow。
```

或在模块目录内：

```bash
# 若已安装 local-workflow skill
python3 <path-to>/local-workflow/scripts/orchestrate.py init modules/03-infra/tasks/T01-compose-baseline.md
```

约定：

- 任务状态：`pending` → `in_progress` → `completed`
- 追踪记录写在同模块 `tasks/tracing/`
- **不要**在未完成依赖任务前跳步（见各任务「依赖」字段）
- 模块代码最终应落在模块目录内（或任务标明的目标路径）；成熟后可升格为独立 git 仓并登记 `registry.yaml`

## 建议顺序

1. 横切：`tasks/G01` → `G02`
2. `03-infra`（立刻可被多项目用）
3. `02-be-base`
4. `04-agent-provider` → `05-agent-runtime`
5. `06-desktop-shell` → `07-desktop-components`
6. `01-fe-base` 增强可并行

## 与现有目录关系

- `base/innate-fe-base`：FE 模块的代码本体（不要平行再建一套前端模板）
- `base/flock`：第三方参考，Agent/Desktop 模块任务会**对照抽离**，不直接当依赖库
- `projects/tooling/innate-aiswitcher`：Provider 切换服务参考，配置库与它边界要划清
