# 来源文档索引与去重说明

这份索引记录新 `docs/` 从哪些旧文档吸收了内容，以及哪些旧文档不再建议作为主入口。

## 新文档对应关系

| 新文档 | 主要吸收来源 | 处理方式 |
|---|---|---|
| `01-product-vision.md` | `innate-ai-desktop/docs/README.md`、`desktop-framework-evaluation-and-phase-plan.md`、本 session 讨论 | 合并产品目标、非目标、参考项目角色 |
| `02-target-architecture.md` | `current-architecture.md`、`desktop-framework-evaluation-and-phase-plan.md`、`PLUGIN_LAYER_MODEL.md` | 合并总架构、plugin package/contribution 分离、native 边界 |
| `03-module-boundaries.md` | `module-map.md`、`shared-capability-extraction-plan.md`、`PROJECT_BUILD_AND_STORAGE_STRATEGY.md` | 合并包边界、build/storage 策略、模块归属 |
| `04-runtime-and-plugin-model.md` | `plugin-runtime.md`、`application-model.md`、`agent-skill-runtime.md`、`llm-provider-store.md`、`task-runtime.md` | 合并 plugin/service/agent/provider/task runtime 协议 |
| `05-workspace-markdown-git.md` | `workspace-gap-analysis.md`、`desktop-base-framework/02-editor-and-layout-deep-dive.md`、`desktop-framework-evaluation-and-phase-plan.md` | 合并 workspace、Git、Markdown、Tolaria editor/vault 抽取 |
| `06-ui-shell-toolbar-theme.md` | `desktop-base-framework/01-four-projects-comparison.md`、`02-editor-and-layout-deep-dive.md`、`desktop-framework-evaluation-and-phase-plan.md`、Wandesk 实现讨论 | 合并 shell、toolbar、status、dock、theme、plugin skinning |
| `07-implementation-roadmap.md` | 多份 roadmap、plantree plans、shared extraction plan | 去重成一份 phased roadmap |

## 仍有价值的旧文档

这些可以保留为参考，但不再作为新读者入口。

### `innate-ai-desktop`

- `innate-ai-desktop/docs/architecture/current-architecture.md`：当前实现细节仍有参考价值。
- `innate-ai-desktop/docs/architecture/plugin-runtime.md`：插件 MVP 和 v1.1 协议来源。
- `innate-ai-desktop/docs/architecture/agent-skill-runtime.md`：已实现 runtime packages 的 CLI 和测试细节。
- `innate-ai-desktop/docs/architecture/application-model.md`：web-only、web+backend、standalone desktop app shape 来源。
- `innate-ai-desktop/docs/architecture/base-shell.md`：BaseShell 非目标和 plugin service 下一步。
- `innate-ai-desktop/docs/plantree/baseline/module-map.md`：模块 inventory 参考。
- `innate-ai-desktop/docs/plantree/baseline/runtime-flows.md`：static/sidecar/tutorial/skill import flow 参考。
- `innate-ai-desktop/docs/plantree/baseline/risk-hotspots.md`：风险清单参考。
- `innate-ai-desktop/docs/tutorials/*`：使用教程仍应保留，不并入架构文档。

### `innate-desktop-mono`

- `innate-desktop-mono/docs/PLUGIN_LAYER_MODEL.md`：plugin package vs contribution 的核心来源。
- `innate-desktop-mono/docs/agent-core-spec.md`：AgentProvider trait 和事件模型参考。
- `innate-desktop-mono/docs/architecture/llm-provider-store.md`：provider store 和 execution profile 来源。
- `innate-desktop-mono/docs/architecture/task-runtime.md`：Task Activity 模型来源。
- `innate-desktop-mono/docs/architecture/skill-runtime.md`：Skill scanner 设计来源。
- `innate-desktop-mono/docs/workspace-gap-analysis.md`：workspace/file/git/editor/terminal 缺口来源。
- `innate-desktop-mono/docs/PROJECT_BUILD_AND_STORAGE_STRATEGY.md`：monorepo build/storage 策略来源。
- `innate-desktop-mono/docs/APPS_ARCHITECTURE.md`：apps/product suite 组织参考。

### 其他参考

- `desktop-base-framework/01-four-projects-comparison.md`：四项目横向比较，已被合并到 `01`、`05`、`06`。
- `desktop-base-framework/02-editor-and-layout-deep-dive.md`：WorkbenchShell、Wandesk window manager、Tolaria editor 深挖，已被合并到 `05`、`06`。
- `wandesk-ui/README.md`、`wandesk-ui/WANDESK_TAKEOVER.md`：Wandesk 运行和 UI 参考。

## 不再建议作为主入口的旧文档

这些旧文档不是没用，而是容易让读者绕远路：

- `innate-ai-desktop/docs/README.md`：旧入口，已被新 `docs/README.md` 替代。
- `innate-ai-desktop/docs/architecture/desktop-framework-evaluation-and-phase-plan.md`：内容有价值，但太大且混合多轮讨论，已拆分到新文档。
- `innate-ai-desktop/docs/architecture/shared-capability-extraction-plan.md`：roadmap 与新 `07` 重复。
- `innate-ai-desktop/docs/architecture/desktop-mono-integration-plan.md`：历史迁移计划，不应继续驱动实现。
- `innate-ai-desktop/docs/plantree/plans/*`：适合历史追踪，不适合作为当前总路线。
- `innate-desktop-mono/docs/PLUGIN_PLAN.md`、`PLUGIN_ARCHITECTURE.md`：大量内容已被 `PLUGIN_LAYER_MODEL` 和新 `04` 吸收。
- `innate-desktop-mono/docs/plantree-1/*`：迁移历史和 task 状态，不作为当前架构入口。
- `desktop-base-framework/*`：本 session 的早期中间产物，已被新文档吸收。

## 去重后的关键决策

1. 主干：`innate-ai-desktop`。
2. 框架目标：local-first AI Agent Desktop application foundation。
3. UI 主模式：WorkbenchShell。
4. UI 可选模式：Wandesk-style Desktop Window Mode。
5. Markdown 参考：Tolaria BlockNote/CodeMirror/document toolbar/vault。
6. Plugin 模型：Package 与 Contribution 分离。
7. Runtime 模型：Terminal、Service、Agent、Skill、Memory、Task 分层。
8. Workspace 模型：filesystem-first，Git/files/browser/editor 都通过 Host API。
9. Security：sidecar、secret、browser、agent tool 都走权限和审批。
10. Roadmap：先做 action/service/workspace/runtime，再做 rich editor/browser/marketplace。

## 后续维护规则

- 新架构变更优先改当前 `docs/`。
- 旧项目文档只作为 source material，不再追加新主线决策。
- 如果某个旧文档仍被频繁引用，应把它的有效内容继续合并进当前 `docs/`，然后在本 source map 标注。
- Tutorial/操作手册可以保留在项目内，但架构入口保持这组文档。
