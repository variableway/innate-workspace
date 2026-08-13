# 任务：实现 Provider Config Lib MVP

- **状态**：pending
- **模块**：04-agent-provider
- **优先级**：P0
- **依赖**：T01、T02

## 目标

实现可被 CLI/测试调用的最小库：加载配置、列出 provider/model、按 profile 解析。

## 执行步骤

1. 按契约选定实现语言并初始化项目
2. 实现：load → validate → resolve(profile) → list models
3. 提供 fixture 配置与单元测试或 smoke 脚本
4. README 写用法示例

## 产出

- 库源码 + 测试/smoke
- 模块 README 用法

## 验收标准

- [ ] 非法配置能报清晰错误
- [ ] profile 继承可解析
- [ ] 至少支持 OpenAI-compatible 一种类型

## 如何执行

```text
请执行 base/innate-foundation/modules/04-agent-provider/tasks/T03-lib-mvp.md，使用 Local Workflow。
```
