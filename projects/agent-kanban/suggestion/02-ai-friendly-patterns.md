# AI-Friendly Patterns — 给 AI 阅读的文档模式清单

> 本文总结 10 个让文档对 AI 更友好的具体模式，每个模式含：问题、模式、示例、适用场景。

---

## 模式 1：AI 入口文件 (AGENTS.md)

### 问题
AI 进入项目目录后不知从何读起。

### 模式
在项目根目录放 `AGENTS.md`，作为"门厅"。内容：项目一句话、阅读顺序、SSOT 映射、当前状态。

### 示例
```markdown
# AGENTS.md
## 项目一句话
XXX 系统：一句话描述。

## 阅读顺序
1. 必读：本文件
2. 理解架构：architecture.md
3. 实现模块X：modules/X/README.md → contract.yaml

## SSOT 映射
| 事实 | 权威文件 |
|------|---------|
| API | spec/openapi.yaml |
| DB | spec/schema.sql |
```

### 适用
所有会被 AI 阅读的项目。

---

## 模式 2：Front-Matter 元数据

### 问题
AI 打开文件后不知道：这文件给谁看、何时读、依赖什么、是否权威。

### 模式
每个 `.md` 顶部加 YAML front-matter。

### 示例
```yaml
---
audience: ai-agent          # ai-agent | human | both
read_when:                  # 什么场景下读
  - implementing dispatch
depends_on:                 # 依赖哪些文件
  - spec/openapi.yaml
status: planned             # draft | planned | implemented | deprecated
canonical: false            # true = 该事实的权威源
---
```

### 适用
所有文档。AI 可先扫 front-matter 决定是否细读。

---

## 模式 3：单一真相源 (SSOT) + 生成派生物

### 问题
同一事实（如数据模型）在 SQL、TS、OpenAPI 三处重复定义，易漂移。

### 模式
- 标注一个文件为 `canonical: true`
- 其他格式标注为"自动生成，请勿手改"
- 用代码生成工具同步

### 示例
```
spec/openapi.yaml      (canonical: true)  ← 手改
spec/types.ts          (canonical: false, generated: true)  ← 由 openapi-typescript 生成
spec/schema.sql        (canonical: true, scope: db)  ← 手改
modules/*/contract.yaml 中的 $ref 指向 openapi.yaml
```

### 适用
API、数据模型、状态机、事件契约等结构化事实。

---

## 模式 4：$ref 硬引用代替软提示

### 问题
"见 spec/openapi.yaml 中 Assignments 部分" 是软提示，AI 要自己 grep。

### 模式
用 JSON Pointer `$ref` 精确指向。

### 示例
```yaml
# 不推荐
api: "见 spec/openapi.yaml 中 Assignments 部分"

# 推荐
api:
  $ref: "../../spec/openapi.yaml#/paths/~1assignments/post"
```

### 适用
所有跨文件引用结构化数据的地方。

---

## 模式 5：状态机用 YAML，不用 ASCII

### 问题
ASCII 状态图能被人看懂，但 AI 生成代码时要重新解析。

### 模式
用 YAML 定义状态机，AI 可直接生成 XState 代码或 switch-case。

### 示例
```yaml
entity: Assignment
initial: pending
transitions:
  - from: pending
    to: running
    event: pickup
    guard: "agent.active && agent.slots > 0"
  - from: running
    to: done
    event: success
```

### 适用
任何有状态流转的实体（任务、订单、审批流）。

---

## 模式 6：契约文件 (contract.yaml) 分离

### 问题
PRD 把"做什么"和"怎么实现"混在一起，AI 实现时被迫加载无关内容。

### 模式
每个模块拆为：
- `README.md` — 概览（一句话 + 关键约束）
- `contract.yaml` — 输入/输出/事件契约（机器可解析）
- `prd.md` — 用户故事 + 验收标准
- `notes.md` — 实现细节 + 边界场景

### 示例
```
modules/dispatch-scheduler/
├── README.md         # AI 30 秒了解模块
├── contract.yaml     # AI 生成接口代码
├── prd.md            # 产品经理看
└── notes.md          # 实现者看
```

### 适用
模块化系统，每个模块有明确边界。

---

## 模式 7：决策记录 (ADR)

### 问题
技术选型只写"用什么"，不写"为什么"，AI 维护时无法判断能否替换。

### 模式
每个重要决策写一个 ADR (Architecture Decision Record)。

### 示例
```markdown
# ADR-003: 用 SQLite 做聚合缓存

## 背景
需要跨项目聚合 Issue 数据。

## 决策
SQLite (better-sqlite3)。

## 理由
1. 单文件部署，无服务端
2. 读多写少场景性能足够
3. JSON 字段支持 label 查询

## 备选（已否决）
- Postgres：过度设计，需运维
- 纯内存：重启丢数据

## 后果
- 单机部署，不支持横向扩展
- 如未来需多实例，需迁移到 Postgres
```

### 适用
所有"为什么选 X 而不选 Y"的决策。

---

## 模式 8：稳定 ID 引用

### 问题
"前面提到的并发控制"这种模糊引用，AI 无法定位。

### 模式
给需求、用户故事、功能点分配稳定 ID。

### 示例
```markdown
## US-3: 手动分配
When 用户点击"分配"，Then 系统创建 Assignment。

## F-5: 手动分配 API
对应 US-3。POST /assignments。

## 验收
- [ ] AC-5.1: 满足 US-3
```

引用时：`实现 F-5 时需满足 US-3`。

### 适用
需求文档、PRD、测试用例。

---

## 模式 9：API 必须带 examples

### 问题
只有 schema 没有 example，AI 调用时靠推断，易出错。

### 模式
OpenAPI 每个 operation 和 schema 都加 `examples:`。

### 示例
```yaml
paths:
  /assignments:
    post:
      requestBody:
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateAssignmentInput"
            examples:
              default:
                value:
                  taskId: "task-001"
                  agentId: "agent-frontend-001"
                  instruction: "请用 React 实现登录页"
```

### 适用
所有 REST API。

---

## 模式 10：显式依赖图

### 问题
模块间依赖藏在每个 PRD 末尾，AI 要读完全部才能画图。

### 模式
在 `modules/README.md` 用 mermaid 或文字画依赖图。

### 示例
```markdown
# 模块依赖
\`\`\`mermaid
graph LR
  sync --> orchestrator --> scheduler --> runtime
  dashboard --> sync
  dashboard --> scheduler
\`\`\`
```

### 适用
模块化系统。

---

## 模式速查表

| # | 模式 | 解决的问题 | 实施成本 |
|---|------|-----------|---------|
| 1 | AGENTS.md 入口 | AI 不知从何读起 | 低 |
| 2 | Front-matter 元数据 | 文件无上下文 | 低 |
| 3 | SSOT + 生成派生物 | 事实多处定义易漂移 | 中 |
| 4 | $ref 硬引用 | 软提示不可解析 | 低 |
| 5 | 状态机 YAML | ASCII 不可解析 | 中 |
| 6 | contract.yaml 分离 | PRD 混合关注点 | 高 |
| 7 | ADR 决策记录 | 无"为什么" | 中 |
| 8 | 稳定 ID | 模糊引用 | 低 |
| 9 | API examples | AI 调用靠推断 | 低 |
| 10 | 显式依赖图 | 依赖关系隐式 | 低 |
