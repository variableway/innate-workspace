# T01 — 固化 app-content 模板

> Sprint 3 ｜ 状态：todo

## 步骤

1. 固化清单（先写全再动手）：
   - **保留**：App Shell、plugin registry 骨架（`lib/plugins/` 空壳 + types）、task-watcher 数据管道、deploy workflow 桩、eslint/tsconfig、`apps/web` 路由骨架
   - **删除**：`data/*.json` 个人数据、`content/`（writing/cheatsheets/awesome 个人内容）、`docs/`（站点私有决策文档）、`.git` 历史、任何 token/密钥
   - **占位符化**：`{{app-name}}`、`{{app-title}}`、`{{basePath}}`、`{{app-id}}`（package name、site config、workflow 名）
2. 复制到 `factory/templates/app-content/`，逐文件过占位符
3. 模板内 `@innate/ui` 依赖版本对齐 verdaccio 已发布版本

## 验收

手工替换占位符后 `pnpm install && pnpm build` 绿。

## 风险

- 夹带个人信息：固化清单是显式文档，逐项勾选执行；`grep -r "innate-wip"` 类残留扫描
