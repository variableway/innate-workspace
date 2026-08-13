# 任务：抽离 flock 核心 vs 自研/封装决策

- **状态**：pending
- **模块**：05-agent-runtime
- **优先级**：P0
- **依赖**：T01、G02

## 目标

决定实现策略：从 flock crates 抽核心、封装 langgraph-rust、或自研 thin runtime。

## 执行步骤

1. 评估 `flock-agent` / `flock-tools` / `flock-skills` 耦合度
2. 写 `docs/adr-001-implementation-strategy.md`
3. 列出 MVP 范围（必须有 / 明确不做）

## 产出

- `docs/adr-001-implementation-strategy.md`

## 验收标准

- [ ] Decision 明确
- [ ] MVP 范围可直接指导 T03

## 如何执行

```text
请执行 base/innate-foundation/modules/05-agent-runtime/tasks/T02-extract-vs-wrap.md，使用 Local Workflow。
```
