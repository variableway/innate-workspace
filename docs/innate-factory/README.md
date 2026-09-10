# Innate Factory — Sprint 文档

innate-workspace 改造为 innate-factory（快速创建 APP 的工厂）的执行文档。
设计全文：`innate-apps/content/innate-wip/docs/solution/innate-factory.md`（方案层）
本目录：**执行层**——每个 phase 是一个 sprint，总体目标 + 任务拆解，一个子任务一个文件。

## 总体目标

1. **快速创建 APP**：模板 + 生成器 + registry + 生命周期命令四件套
2. **一套共享机制**：base（innate-fe-base）是唯一共享源，所有 app 平等消费（`kind: app`，无 core/satellite 之分）
3. **多 Agent 协作**：GitHub Issues + Projects 看板，dispatch 自动化波次协议
4. **Agent 知识模板化**：SKILL.md 随 app 生成，任何 harness 进仓即知怎么开发

## Sprint 索引

| Sprint | 目标 | 状态 |
|--------|------|------|
| [phase-0-clear](./phase-0-clear/) | 清障：.gitignore 审计修复 + 脏树 commit | **done（2026-09-10）** |
| [phase-1-registry](./phase-1-registry/) | registry 改造：apps.yaml 迁移 + 四张表 | **done（2026-09-10）** |
| [phase-2-base-hub](./phase-2-base-hub/) | base 成共享中心：verdaccio + ui/plugin 收敛 | todo |
| [phase-3-template](./phase-3-template/) | app-content 模板固化 + 冒烟 CI | todo |
| [phase-4-scaffold](./phase-4-scaffold/) | new_app 生成器 + 首个真实 app 验收 | todo |
| [phase-5-cli](./phase-5-cli/) | innate-cli（Go）收编（概述） | todo |

## 红线（全程有效）

1. **根 `registry.yaml` 不动**——references 管理已由 spark-cli 实现
2. **`innate-apps/` 保持 ignore**——app 仓库物理独立，factory 只索引不吸收
3. **scan 的"目录为源"方向不变**——扩展字段只允许手工维护、scan 原样保留

## 文档约定

- sprint README：总体目标 / 任务表（ID、文件、状态、依赖）/ 验收标准 / 决策记录
- 任务文件（T*.md）：背景 / 步骤 / 验收 / 风险；完成后追加"执行记录"
- 状态：`todo` → `doing` → `done`（附日期）
