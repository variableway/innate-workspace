# Sprint 1 — registry 改造

> 状态：**done（2026-09-10）** ｜ 前置：Sprint 0（.gitignore 已修） ｜ 设计依据：innate-factory.md §10 Phase 1

## 总体目标

registry 从单文件演进为 `registry/` 目录四张表；根 `registry.yaml` 红线不动；scan 的"目录为源"方向与字段保留契约成立。

## 任务表

| ID | 任务 | 状态 | 依赖 |
|----|------|------|------|
| [T01](./T01-baseline-and-move.md) | 基线同步 + git mv（保历史） | done | none |
| [T02](./T02-scripts-paths.md) | scan-innate / clone-innate 路径更新 | done | T01 |
| [T03](./T03-field-preservation.md) | scan.py 扩展字段 round-trip 保留 | done | none |
| [T04](./T04-schema-apps.md) | apps.yaml schema 回填（kind 模型） | done | T03 |
| [T05](./T05-new-tables.md) | 新建 plugins / skills / deploy 三表 | done | T04 |

## 决策记录

1. **kind 模型：`core | satellite` 废弃，改 `app | base | external`（缺省 external）**
   - core/satellite 意味着两套共享机制（核心仓 workspace:* + 基座发布），是不统一的根源
   - 收敛为一套：base 唯一共源，所有 app 平等消费；innate-wip 只是第一个 app
2. **plugin 归属：通用引擎（making/cheatsheets/awesome）targetHome = `@innate/plugin-*`（迁 base）；站点私有主题（writing/feed）留 app 仓**
3. **根 registry.yaml（references 管理）完全不动**——已由 spark-cli 实现；scan.py 对其行为经 round-trip 对比验证零影响
4. **`skills/` 是全部配套 skill 的磁盘落点**（2026-09-10）：`wip-skills` 从 `base/` 迁入；`scan-innate-apps.py` 扫描 `innate-apps` + `base` + `skills`。根 `registry.yaml` 仍扫描 `skills/`（spark-cli 的 reference skills），两套索引共用目录、各写各的表

## 验收（全部通过）

- [x] 纯迁移：mv 后跑 scan，diff 为零（只有位置变，没有内容变）
- [x] 字段保留：schema 回填后再跑 scan，kind/template/deploy/publishes 全部保留
- [x] 红线：旧/新 scan.py 对根 registry.yaml 副本的 round-trip 输出逐字节一致
- [x] 四张表 PyYAML 全部合法，扩展字段语义可读回
