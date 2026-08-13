# 任务：共享 Desktop Cargo 编译缓存

- **状态**：completed
- **模块**：06-desktop-shell
- **优先级**：P0
- **依赖**：无（可与 G02 / T01 并行；不替代 T01–T04 的源码级 shell lib）

## 目标

在 `base/` 提供可被多个 Desktop / Tauri app 复用的 Cargo 编译缓存方法，避免每个 `src-tauri` 各自重编 `tauri` / `wry`。

## 执行步骤

1. 对照 foundation / desktop-ref 文档，确认缺的是编译产物共享而不是 workspace 合并
2. 在 `base/desktop-cargo/` 落地 `CARGO_TARGET_DIR` helper
3. 接入在用的 wandesk-ui 与 innate-ai-desktop 启动/打包脚本
4. 在模块 README 中交叉引用

## 产出

- [`base/desktop-cargo/`](../../../../desktop-cargo/)（方案说明 + `env.mjs` / wrapper）
- wandesk-ui / innate-ai-desktop 构建脚本使用共享 target

## 验收标准

- [x] 方法放在 `base/`，不绑死某一个 app 的 `target/cargo`
- [x] 已设置的 `CARGO_TARGET_DIR` 不被覆盖
- [x] 文档区分「共享 target」与「共享 shell lib」
- [x] 不把 flock / tolaria 收进同一个 Cargo workspace

## 如何执行

方法已落地。新 app 接入见 [`base/desktop-cargo/README.md`](../../../../desktop-cargo/README.md)。
