# 任务：REST / 错误模型约定（基于 Vine）

- **状态**：pending
- **模块**：02-be-base
- **优先级**：P0
- **依赖**：T01
- **参考**：vine-skill `refs/02-modules.md`（errors/filters）、`refs/13-skel-syntax.md`、`refs/01-app-startup.md` Web

## 目标

把后端「默认怎么写 REST」写成约定，并在 T01 的 standalone REST 样例上补齐 CRUD 样例与统一错误形状（Vine：`core/ex`，Web 路由约定）。

## 执行步骤

1. 写 `docs/api-conventions.md`：路由风格、错误码（对齐 `ex`）、分页/鉴权占位、与 `.skel` web 的关系
2. 在 REST 样例中实现一个资源（如 `items`）的 list/create（或等价）
3. 错误响应形状与文档一致；必要时加 Web filter 示例

## 产出

- `docs/api-conventions.md`
- 样例 CRUD（或最小写路径）代码

## 验收标准

- [ ] 约定文档与代码一致
- [ ] 错误有统一、可文档化的形状
- [ ] 样例资源可手工 curl 验证

## 如何执行

```text
请执行 base/innate-foundation/modules/02-be-base/tasks/T03-api-conventions.md，使用 Local Workflow。
```
