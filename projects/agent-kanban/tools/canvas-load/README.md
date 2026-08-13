# canvas-load

把仓库 `canvases/*.canvas.tsx` **同步并加载**到 Cursor IDE 可识别的目录。

## 为什么需要

| 位置 | 作用 |
|------|------|
| `projects/agent-kanban/canvases/` | Git SSOT，可评审、可 PR |
| `~/.cursor/projects/<workspace-id>/canvases/` | Cursor 旁路渲染入口（仅本地） |

两边不同步时，聊天旁打开的仍是旧画布。

## 命令

```bash
node tools/canvas-load/cli.mjs list
node tools/canvas-load/cli.mjs path
node tools/canvas-load/cli.mjs status
node tools/canvas-load/cli.mjs sync
node tools/canvas-load/cli.mjs load requirements-gap-analysis
```

Taskfile 封装：

```bash
task canvas:list
task canvas:status
task canvas:sync
task canvas:load -- requirements-gap-analysis
```

`load` = `sync` + 打印绝对路径与 `file://` URI，便于 Agent 调用 `open_resource`。

## 零依赖

纯 Node.js（`fs` / `path` / `os`），不新增 npm 包。
