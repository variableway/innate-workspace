# 任务：定义 Provider 配置契约

- **状态**：pending
- **模块**：04-agent-provider
- **优先级**：P0
- **依赖**：G02

## 目标

产出语言无关的配置契约（字段、Profile 继承、兼容标志），作为库与消费者的单一事实来源。

## 执行步骤

1. 草拟 Provider / Model / Profile / Credentials 对象字段
2. 写 `docs/config-contract.md` + 可选 JSON Schema（`schemas/provider-config.schema.json`）
3. 标明哪些字段必须、哪些可选；OpenAI-compatible 如何表达

## 产出

- `docs/config-contract.md`
- `schemas/provider-config.schema.json`（推荐）

## 验收标准

- [ ] 契约覆盖：provider 类型、base URL、api key 引用方式、模型列表、profile 继承
- [ ] 有至少 1 个完整示例配置

## 如何执行

```text
请执行 base/innate-foundation/modules/04-agent-provider/tasks/T01-config-contract.md，使用 Local Workflow。
```
