# T05 — 新建 plugins / skills / deploy 三表

> Sprint 1 ｜ 状态：done（2026-09-10）

## 产出

| 文件 | 内容要点 |
|------|----------|
| `registry/plugins.yaml` | 从 innate-wip `lib/plugins/registry.ts` 转录 + 双轨标注：making/cheatsheets/awesome `track: package` 且 `targetHome: @innate/plugin-*`；writing/feed `track: route`（站点私有，不迁移）；collections-viewer `track: iframe`（逃生门先例） |
| `registry/skills.yaml` | 起步条目：backend-go（repo）、innate-fe-base-dev（repo）、wip-skills 入口（user，path=`skills/wip-skills`）、hallmark（repo，`skills/fe-design-skills/hallmark`）、innate-wip-dev（repo，规划中） |
| `registry/deploy.yaml` | innate-wip → pages + cloudflare（双发）；spark-cli → none（CLI 走 npm 分发）；keepthem/aiswitcher → none 待登记 |
| `registry/README.md` | schema 说明 + 红线 + kind 模型决策记录 + scan 字段保留契约 |

## 设计说明

- 三表**纯手工维护**（不随 scan 同步）：它们登记的是"意图与归属"，不是"磁盘现实"，没有目录为源的问题
- plugins.yaml 的 `status: in-app → targetHome` 表达迁移意图而不立即执行——迁移是 Sprint 2（T04）的事

## 执行记录（2026-09-10）

四表落地。`skills.yaml` 中 wip-skills 入口改为 `skills/wip-skills`，并登记 `hallmark`（`skills/fe-design-skills/hallmark`）。PyYAML 四表均可读回。

