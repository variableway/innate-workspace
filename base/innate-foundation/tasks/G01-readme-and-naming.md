# 任务：修正 base README 编号并冻结模块命名

- **状态**：pending
- **模块**：governance
- **优先级**：P0
- **依赖**：无

## 背景

`base/README.md` 中 Desktop 两项都标成「5」；模块命名在 todo 与目录间尚未统一。

## 目标

让 README 与 `innate-foundation/modules/*` 一一对应，并冻结对外目录/仓名。

## 执行步骤

1. 编辑 `base/README.md`：修正编号（1–6），并为每项加上对应模块路径链接到 `innate-foundation/modules/...`
2. 在 `base/innate-foundation/README.md`（若需）确认命名表与 README 一致
3. 写入命名约定到本仓库某处短文（可放在本文件产出的 `docs/naming.md`，路径：`base/innate-foundation/docs/naming.md`）：
   - 目录：`01-fe-base` … `07-desktop-components`
   - 未来独立仓建议名：`innate-fe-base`（已有）、`innate-be-base`、`innate-infra`、`innate-agent-provider`、`innate-agent-runtime`、`innate-desktop-shell`、`innate-desktop-components`

## 产出

- 更新后的 `base/README.md`
- `base/innate-foundation/docs/naming.md`

## 验收标准

- [ ] README 无重复编号，条目与 7 个模块一一对应
- [ ] 每项有模块目录链接
- [ ] `docs/naming.md` 写明目录名与未来仓名映射

## 如何执行

```text
请执行 base/innate-foundation/tasks/G01-readme-and-naming.md，使用 Local Workflow。
```
