# T05 — 开发回环工具

> Sprint 2 ｜ 状态：todo ｜ 依赖：T03

## 背景

源头唯一化的代价：改一行 ui/plugin 要过一次发布才能被 app 用到。单人高频迭代的摩擦控制就在这。

## 两个工具（按场景切换）

1. **verdaccio 秒发**（默认）：无 CI 延迟，`pnpm publish` + 下游 `pnpm update @innate/ui`——先以 shell 脚本形式落地（`base/innate-selfhost/verdaccio/push-ui.sh`），innate-cli 成形后收编为 `innate npm publish`
2. **dev link 开关**（联调期）：`innate-dev-link.sh @innate/ui` 把消费仓依赖改写为 `link:../../base/innate-fe-base/packages/ui` 零发布直连；`--off` 还原版本号。联调态显式留在 package.json（防忘记切回就发版）

## CI 备注

GitHub Actions 拉不到 localhost:4873。两个选项（T03 遗留决策）：
- a. verdaccio 配 `notify` 或定时任务把 `@innate/*` 镜像到 GitHub Packages（CI 用 GH_TOKEN 拉）
- b. CI 内起临时 verdaccio + 本地 publish（自举构建）
先选 b（零外部依赖），出多人协作再上 a。

## 验收

- 秒发脚本一条命令完成 改→发→下游可见
- link 开关来回切换后 package.json 无残留 link 态
