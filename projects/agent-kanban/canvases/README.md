# canvases/ — 仓内 Canvas SSOT

> Cursor IDE 只能从  
> `~/.cursor/projects/<workspace-id>/canvases/*.canvas.tsx`  
> 加载旁路画布。本目录是 **Git 版本真相源**；用 `canvas-load` 同步到 Cursor。

## 已收录

| 文件 | 说明 |
|------|------|
| `requirements-gap-analysis.canvas.tsx` | 需求覆盖矩阵 / Backlog.md 取舍 / M1–M4 落地顺序 |
| `vibe-kanban-way-comparison.canvas.tsx` | vibe-kanban × kanban-way × 本项目对照 |
| `todos-dev-self-first-architecture.canvas.tsx` | Todos.dev 对照 / 四层架构 / 自用切片（Worker · 多仓 · 配方） |

## 用法

```bash
# 列出仓内 canvas
task canvas:list
# 或
node tools/canvas-load/cli.mjs list

# 同步到当前工作区对应的 Cursor canvases 目录
task canvas:sync

# 对比仓内 vs Cursor 是否一致
task canvas:status

# 同步后打印可打开路径（Agent 可用 open_resource）
task canvas:load -- requirements-gap-analysis
```

环境变量（可选）：

| 变量 | 含义 |
|------|------|
| `CURSOR_CANVASES_DIR` | 覆盖自动推导的 Cursor canvases 路径 |
| `CURSOR_PROJECTS_ROOT` | 默认 `~/.cursor/projects` |

## 约定

1. **只提交** `*.canvas.tsx`；不提交 `*.canvas.status.json`（IDE 运行时产物）
2. 文件名 kebab-case，以 `.canvas.tsx` 结尾
3. 画布代码只能 `import … from "cursor/canvas"`（见 Cursor Canvas skill）
4. 改仓内文件后务必 `task canvas:sync`，否则聊天旁路仍是旧版
