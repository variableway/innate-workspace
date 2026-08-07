# Review Findings — 当前文档对 AI 阅读的真实问题

> 评审对象：`shared-context/`, `spec/`, `modules/` 下共 10 个文档
> 评审视角：**AI Agent 作为主要读者**（用于实现、调试、扩展本系统）
> 评审日期：2026-08-02

## 一、核心结论

当前文档**对人类阅读友好，但对 AI 阅读不友好**。原因：信息以叙述性段落组织，缺乏机器可解析的元数据、单一真相源和显式依赖关系。

---

## 二、发现的具体问题

### 问题 1：没有 AI 入口文件 ❌ Critical

**现象**：AI Agent 打开 `agent-kanban/` 目录后，不知道从哪个文件开始读、读多少、读的顺序。

**影响**：AI 要么读全部文件（token 浪费），要么随机挑一个（上下文缺失）。

**对比**：业界已有 `AGENTS.md` / `CLAUDE.md` 约定，作为 AI 进入项目的"门厅"。

---

### 问题 2：同一事实多处定义，易漂移 ⚠️ High

**现象**：数据模型分散在三处：
- `spec/models.md` — SQL Schema
- `spec/types.md` — TypeScript 类型
- `spec/openapi.yaml` — `components/schemas`

三份描述字段相同但格式不同，没有标注哪份是**canonical（权威源）**。

**影响**：AI 实现时不知道以哪份为准；后续修改时容易漏改一处，造成不一致。

---

### 问题 3：跨文件引用是"软提示"，不可机器解析 ⚠️ High

**现象**：`dispatch-scheduler.md` 第 126 行写：
```
见 [spec/openapi.yaml](../spec/openapi.yaml) 中 Assignments 部分
```

这是给人看的提示，AI 无法直接定位到 openapi.yaml 的具体路径或 schema。

**影响**：AI 要实现"手动分配 API"时，需要自己 grep openapi.yaml 找 `/assignments`，多一步推理。

---

### 问题 4：ASCII 状态图无法被程序解析 ⚠️ Medium

**现象**：`dispatch-scheduler.md` 的状态生命周期用 ASCII art 画：
```
┌──────────┐
│ pending  │
└────┬─────┘
     │ Agent 拾取
     ▼
┌──────────┐
│ running  │
...
```

**影响**：AI 能"看懂"但无法精确复述状态转换规则。如果用 YAML 定义状态机，AI 可以直接生成代码。

---

### 问题 5：PRD 混合了多种关注点 ⚠️ Medium

**现象**：每个 `modules/*.md` 同时包含：
- 用户故事（业务需求）
- 功能清单（产品规格）
- 并发控制模型（实现细节）
- 边界场景（测试规格）
- 验收标准（QA 规格）
- 依赖关系（架构规格）

**影响**：AI 实现某模块时，只需"契约 + 实现规格"，但被迫加载了用户故事等无关内容，浪费 token。

---

### 问题 6：没有决策记录 (ADR) ⚠️ Medium

**现象**：README 提到技术选型：
```
| 同步引擎 | Node.js + GitHub Webhooks + Octokit |
| 本地存储 | SQLite (better-sqlite3) |
```

但**没有说明为什么**选这些。AI 后续维护时，遇到"为什么不用 Postgres？"这类问题无法回答。

**影响**：AI 在扩展或重构时可能做出与原决策冲突的选择。

---

### 问题 7：缺少术语表 (Glossary) ⚠️ Medium

**现象**：`Workspace`、`Project`、`Task`、`Assignment`、`Agent`、`MatchResult` 这些核心术语分散在各文档中定义。

**影响**：AI 阅读某个 PRD 时遇到 `MatchResult`，不知道它的结构，要去其他文件找。

---

### 问题 8：API 缺少示例 ⚠️ Medium

**现象**：`openapi.yaml` 定义了 schema 但**没有 `examples:` 字段**。

**影响**：AI 调用 API 时只能靠 schema 推断请求体格式，容易出错。

---

### 问题 9：没有实现状态标记 ℹ️ Low

**现象**：所有 PRD 看起来都像"待实现"，没有 `status: implemented | planned | draft` 标记。

**影响**：AI 不知道哪些模块已实现、哪些还在设计阶段。

---

### 问题 10：模块边界隐式 ℹ️ Low

**现象**：`modules/` 下没有 README 索引，模块间依赖关系只在每个 PRD 末尾的"依赖"章节提及。

**影响**：AI 要构建依赖图需要读完所有 PRD。

---

## 三、问题严重度汇总

| # | 问题 | 严重度 | 修复成本 |
|---|------|--------|---------|
| 1 | 没有 AI 入口文件 | Critical | 低 |
| 2 | 事实多处定义 | High | 中 |
| 3 | 软引用不可解析 | High | 低 |
| 4 | ASCII 状态图 | Medium | 中 |
| 5 | PRD 混合关注点 | Medium | 高 |
| 6 | 缺少 ADR | Medium | 中 |
| 7 | 缺少术语表 | Medium | 低 |
| 8 | API 缺示例 | Medium | 低 |
| 9 | 无实现状态 | Low | 低 |
| 10 | 模块边界隐式 | Low | 低 |

---

## 四、总体评价

| 维度 | 评分 | 说明 |
|------|------|------|
| 人类可读性 | 8/10 | 结构清晰，叙述流畅 |
| AI 可读性 | 4/10 | 缺元数据、缺单一真相源、缺机器可解析契约 |
| 可维护性 | 5/10 | 事实易漂移，无 ADR |
| 可扩展性 | 6/10 | 模块边界清晰但无显式依赖图 |

**核心建议**：保持现有内容，但增加一层"AI-friendly 元数据 + 机器可解析契约"包装。详见 `01-proposed-structure.md`。
