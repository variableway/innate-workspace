# desktop-app 文档审查与实施差距分析

本目录是对 `docs/desktop-app/`（新增的统一架构文档组）与当前实现
`base/references/desktop-ref/innate-ai-desktop`（部分实现）的双向核查结论：

1. 文档内容本身是否合理、是否需要修改。
2. 文档描述的目标架构与当前实现之间还差多少。
3. 一份可执行的落地实施计划。

## 文档清单

| 文件 | 内容 |
|------|------|
| [01-docs-review.md](./01-docs-review.md) | `docs/desktop-app` 12 份文档的逐份审查：合理性结论、发现的问题（缺失引用文件、参考源不存在、遗漏已有包等）、修改建议 |
| [02-gap-analysis.md](./02-gap-analysis.md) | 目标架构（02/03/04/05/06 号文档）与 `innate-ai-desktop` 当前实现的逐模块差距分析，含量化总表 |
| [03-implementation-plan.md](./03-implementation-plan.md) | 实施计划：Phase 0 文档修复 → Phase 1-11 按 docs 路线落地，含任务分解、文件级落点、验收标准、依赖关系 |

## 核查范围

- 文档侧：`base/innate-fe-base/docs/desktop-app/`（12 个文件，含 `desktop-base-framework/` 子目录 3 个文件）。
- 实现侧：`base/references/desktop-ref/innate-ai-desktop`（4 个 apps、18 个 packages、Rust src-tauri 共 30 个 Tauri command、scripts、自带 docs）。

## 一句话结论

文档组整体质量高、方向正确，可以作为主线架构入口；但存在 **4 处需要修改的硬伤**（缺失引用文件、参考源不在工作区、遗漏 `desktop-surface`/`admin-ui` 两个已有包、manifest 类型双轨未记录）。实现侧底座约完成目标的三分之一：Host/Shell/静态插件/终端/agent-skill-memory runtime 核心已成立，而 action/service/task/browser/document/secret 九个目标包完全缺失，需按 `03-implementation-plan.md` 的 Phase 0（先修文档）→ Phase 1（action 基座）顺序推进。
