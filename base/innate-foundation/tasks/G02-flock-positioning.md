# 任务：明确 flock 在 base 中的定位

- **状态**：pending
- **模块**：governance
- **优先级**：P0
- **依赖**：无

## 背景

`base/flock` 是第三方仓（Onelevenvy/flock），未进 `registry.yaml`，但被 Agent/Desktop 模块当作抽离参考。

## 目标

书面决定：仅参考（推荐）或正式 submodule；并落到文档，避免后续任务误当成自家库直接依赖。

## 执行步骤

1. 核对 `registry.yaml` / `.gitmodules` 是否包含 flock
2. 决策并写入 `base/innate-foundation/docs/flock-positioning.md`：
   - 推荐：**reference-only**（不注册、不作为 runtime 依赖）
   - 若选入库：补 registry + submodule 步骤
3. 在 `base/README.md` 或 foundation README 加一句指向该文档
4. 若 reference-only：在 flock 模块相关任务中确认措辞为「对照抽离」而非「依赖 flock crate」

## 产出

- `docs/flock-positioning.md`
- README 交叉引用

## 验收标准

- [ ] 有明确决策（reference-only 或 registered）
- [ ] Agent/Desktop 模块 README 不暗示直接依赖 flock 包名作为发布产物

## 如何执行

```text
请执行 base/innate-foundation/tasks/G02-flock-positioning.md，使用 Local Workflow。
```
