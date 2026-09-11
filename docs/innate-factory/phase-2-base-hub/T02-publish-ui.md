# T02 — fe-base 首发 @innate/ui

> Sprint 2 ｜ 状态：todo ｜ 依赖：T01

## 步骤

1. fe-base `packages/ui`：补齐 `publishConfig.registry`、`files`（dist）、`prepare` 构建（tsup/tsc 产物，发布编译结果而非源码——消费仓不装 devDeps）
2. 版本从 `0.1.1` 起（0.1.0 已被"两份副本"污染，弃用）；changesets 初始化
3. `pnpm publish --no-git-checks` 到 verdaccio（innate-cli 未成之前手动，不挡路）
4. 登记 `registry/apps.yaml` fe-base 条目 `publishes` 扩展（已有，验证即可）

## 验收

- verdaccio web UI 可见 `@innate/ui@0.1.1`
- 新目录 `pnpm add @innate/ui` 成功且 import 可用

## 风险

- 发布源码而非产物 → 消费仓被迫装 peer/dev 依赖；`files` 白名单把好关
