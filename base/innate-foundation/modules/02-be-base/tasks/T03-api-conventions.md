# 任务：沉淀鉴权 / CRUD / 错误模型约定

- **状态**：pending
- **模块**：02-be-base
- **优先级**：P0
- **依赖**：T02

## 目标

把后端开发「默认怎么写」写成约定，并在骨架中给一个 CRUD 样例资源。

## 执行步骤

1. 写 `docs/api-conventions.md`：路由风格、错误码、分页、鉴权占位
2. 实现一个样例资源（如 `items`）的 list/create
3. 统一错误响应形状

## 产出

- `docs/api-conventions.md`
- 样例 CRUD 代码

## 验收标准

- [ ] 约定文档与代码一致
- [ ] 错误响应有统一 JSON 形状
- [ ] 样例资源可手工 curl 验证

## 如何执行

```text
请执行 base/innate-foundation/modules/02-be-base/tasks/T03-api-conventions.md，使用 Local Workflow。
```
