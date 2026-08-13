# 06-desktop-shell — Tauri 可共享打包框架

## 范围

多 Desktop 产品共享的 Tauri shell / packaging lib：窗口、更新、IPC 约定、构建与多端打包。

**先可用的一层**：多个 app 共享 Cargo 编译缓存（`CARGO_TARGET_DIR`），见 [`base/desktop-cargo/`](../../../desktop-cargo/)。这与后续 shell **源码 lib**（T01–T04）互补，不互相替代。

## 代码落点

- 共享 cargo build：[`base/desktop-cargo/`](../../../desktop-cargo/)
- 本目录后续：`crates/` 或 `packages/tauri-shell`（结构由 T02 决定）
- 参考：`base/references/desktop-ref/flock/flock-ui/src-tauri`（对照，不复制整应用）

## 依赖

- G02；建议 `05-agent-runtime` API 稳定后再深度 IPC 对接（T03 可先做空壳）

## 任务索引

| 任务 | 说明 | 优先级 |
|------|------|--------|
| [T00-shared-cargo-target.md](tasks/T00-shared-cargo-target.md) | 共享 `CARGO_TARGET_DIR`（已落地 `base/desktop-cargo`） | P0 |
| [T01-shareable-inventory.md](tasks/T01-shareable-inventory.md) | 盘点 flock-ui/src-tauri 可共享点 | P0 |
| [T02-shell-lib-scaffold.md](tasks/T02-shell-lib-scaffold.md) | 搭建 packaging / shell lib | P0 |
| [T03-empty-app-template.md](tasks/T03-empty-app-template.md) | 用 lib 生成空 Desktop 应用 | P0 |
| [T04-shell-docs.md](tasks/T04-shell-docs.md) | 新建应用文档 | P1 |
