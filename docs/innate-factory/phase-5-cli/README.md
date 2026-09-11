# Sprint 5 — innate-cli 收编（概述）

> 状态：todo（远期） ｜ 前置：Sprint 4 ｜ 设计依据：innate-factory.md §4、tasks/innate-cli.md

## 总体目标

Go 实现的 innate-cli（落 `base/innate-backend`）逐步收编 python 脚本与 shell 工具，成为 factory 的统一入口。**收编原则：每个子命令先有脚本形态跑通（Sprint 1–4 已完成的 python/shell），再移植——CLI 是壳不是本体。**

## 子命令路线

| 命令 | 收编对象 | 前置 |
|------|----------|------|
| `innate new app/plugin/skill` | `factory/scaffold/*.py` | Sprint 4 |
| `innate registry scan/clone` | `scripts/scan-innate-apps.py` / `clone-innate.py` | Sprint 1 ✅ |
| `innate npm start/stop/publish` | verdaccio compose + push 脚本（tasks/innate-cli.md 原始需求） | Sprint 2 |
| `innate task/board` + `innate dispatch` | 手工波次协议（multi-agent-dispatch.md） | Sprint 4 后 |
| `innate doctor` | 新写：注册一致 / 构建绿 / 依赖过期 / templateVersion 落后 | Sprint 4 后 |

## 验收（sprint 级）

原 python 脚本标记 deprecated 后删除；所有既有操作在 CLI 有等价命令；doctor 在 CI 可跑。

> 详细任务拆解在本 sprint 启动时补齐（届时扫描/发布/调度的脚本形态均已稳定，拆解才有依据）。
