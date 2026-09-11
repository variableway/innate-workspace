# T04 — 通用插件迁 base

> Sprint 2 ｜ 状态：todo ｜ 依赖：T03（通道打通后迁移才有意义）

## 迁移对象（registry/plugins.yaml 的 targetHome）

| 插件 | 迁移后 | 复用视野 |
|------|--------|----------|
| making | `@innate/plugin-making` | 项目追踪引擎，其他 app（edu 等）可能要 |
| cheatsheets | `@innate/plugin-cheatsheets` | 参考手册引擎 |
| awesome | `@innate/plugin-awesome` | 清单渲染引擎 |

**不迁**：writing / feed（站点私有主题，留在 innate-wip `app/` 下，plugins.yaml `targetHome: null`）。

## 步骤（以 making 为例）

1. fe-base 新建 `packages/plugin-making`：迁移 innate-wip 的 route 页面 + 数据加载器，实现 `InnatePlugin` 契约（manifest + data + pages）
2. wip 侧 `app/making/**` 保留一行式薄包装 re-export；`lib/plugins/registry.ts` 改从包 import manifest
3. 发布 `@innate/plugin-making@0.1.x` 到 verdaccio；wip 消费验证
4. cheatsheets / awesome 依样重复（各为独立 commit，可并行任务）

## 验收

- wip 的 making/cheatsheets/awesome 三区页面渲染不变（对照迁移前截图/diff）
- wip 仓内不再有这三个插件的源码，只有薄包装路由

## 风险

- 数据文件归属：`data/{issues,weekly,projects,insights}.json` 留在 wip（数据是站点的），插件只带加载器不带数据——契约里 data loader 接收宿主数据目录
