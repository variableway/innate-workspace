# 05-agent-runtime — AI Agent Runtime

## 范围

不绑定特定 UI 的 Agent Runtime：session、tool loop、streaming、HITL、skill 加载。

## 代码落点

- 本目录实现 runtime（可先 thin wrapper）
- 参考：`flock-agent` / `flock-tools` / `flock-skills`（对照抽离，不整仓 fork）

## 依赖

- `04-agent-provider` T01/T03（配置契约）
- G02

## 任务索引

| 任务 | 说明 | 优先级 |
|------|------|--------|
| [T01-runtime-api.md](tasks/T01-runtime-api.md) | 最小 Runtime API | P0 |
| [T02-extract-vs-wrap.md](tasks/T02-extract-vs-wrap.md) | 抽离 vs 封装决策 | P0 |
| [T03-mvp-loop.md](tasks/T03-mvp-loop.md) | session + tool loop + stream MVP | P0 |
| [T04-skill-loading.md](tasks/T04-skill-loading.md) | skill 加载集成 | P1 |
