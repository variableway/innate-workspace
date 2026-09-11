# Sprint 2 — base 成共享中心（ui + plugin 收敛）

> 状态：todo ｜ 前置：Sprint 0（.gitignore 修复，否则 fe-base 锁文件/skill 不入库） ｜ 设计依据：innate-factory.md §9、§10 Phase 2

## 总体目标

`@innate/ui` 源头唯一化到 fe-base，经私有 npm（verdaccio 本地起步）分发；通用插件跟进同一通道。**收敛是复用的前提**——当前 wip 与 fe-base 各有一份同名同版本（0.1.0）的 `@innate/ui`，diff 暂为零，任何单边改动后版本号即失效。

## 任务表

| ID | 任务 | 状态 | 依赖 |
|----|------|------|------|
| [T01](./T01-verdaccio.md) | verdaccio selfhost（compose + scope 路由） | todo | Sprint 0 |
| [T02](./T02-publish-ui.md) | fe-base 首发 @innate/ui 到 verdaccio | todo | T01 |
| [T03](./T03-wip-consume.md) | innate-wip 撤本地副本，改消费 verdaccio | todo | T02 |
| [T04](./T04-plugin-migration.md) | 通用插件迁 base（@innate/plugin-making 等） | todo | T03 |
| [T05](./T05-dev-loop.md) | 开发回环工具（秒发 + dev link 开关） | todo | T03 |

## 决策记录

- **源头 = fe-base**：包家族完整 + innate-cli 原始规划即以 fe-base 为例 + 与"base 是模板上游"自举设计一致
- **kind: app 的 wip 是第一个消费者，不再有 core 特权**
- **过河白名单**：只有 `@innate/ui`、`@innate/plugin-sdk`、通用 `@innate/plugin-*` 走 npm；站点私有主题（writing/feed）留 app 仓

## 验收

- innate-wip 构建绿，且 `@innate/ui` 来自 verdaccio 而非本地副本
- 两份 ui 副本只余一份（fe-base）
- changesets + semver 从第一天执行（本地 verdaccio 不豁免）
