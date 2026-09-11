# T04 — apps.yaml schema 回填

> Sprint 1 ｜ 状态：done（2026-09-10）

## schema（完整定义见 registry/README.md）

扩展字段：`kind`（app | base | external，缺省 external）、`template`、`templateVersion`、`deploy`、`publishes`（仅 base 类）。

## 执行记录（回填的条目）

| 条目 | 回填 |
|------|------|
| innate-wip | `kind: app, template: app-content, templateVersion: v0, deploy: [pages, cloudflare]` |
| innate-feeds / innate-keepthem / innate-aiswitcher / spark-cli / qdriven | `kind: app` |
| innate-fe-base | `kind: base, publishes: ["@innate/ui"]`（desc 更新为基座定位） |
| ai-content-os / baoyu-skills / oil-frontend / wip-skills / hallmark | `kind: external`（显式标注易混淆位） |
| `skills/wip-skills/**` 深层克隆 | 不标注（缺省即 external） |

## 验收

- PyYAML 读回 `wip['kind']=='app'`、`deploy==['pages','cloudflare']`、`publishes==['@innate/ui']` ✅
- scan 后字段保留 ✅

## 执行记录（2026-09-10）

`wip-skills` path 改为 `skills/wip-skills` 后重跑 scan：`kind: external` 仍在；`innate-wip.deploy` 与 `innate-fe-base.publishes` 仍在。

