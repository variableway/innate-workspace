# Migration Checklist — 从现状到 AI-Friendly 结构的迁移清单

> 按优先级排序的可执行清单。每项含：动作、输入、输出、验收。

---

## P0 — 立即执行（影响 AI 能否入门）

### ✅ 1. 创建 AGENTS.md

- **动作**：在 `agent-kanban/` 根目录新建 `AGENTS.md`
- **输入**：`shared-context/README.md`, `modules/` 目录列表
- **输出**：`AGENTS.md`，含项目一句话、阅读顺序、SSOT 映射、模块状态表
- **验收**：AI 读 AGENTS.md 后能在 200 token 内知道"这是什么项目、下一步读哪个文件"
- **模板**：见 `01-proposed-structure.md` 第三节

---

### ✅ 2. 抽出 canonical schema.sql

- **动作**：从 `spec/models.md` 中把 SQL Schema 部分抽出，独立为 `spec/schema.sql`
- **输入**：`spec/models.md` 第二章
- **输出**：`spec/schema.sql`（`canonical: true`）；`models.md` 改为只保留 ER 图和查询示例，SQL 部分改为"见 schema.sql"
- **验收**：`models.md` 不再含 `CREATE TABLE` 语句；`schema.sql` 可直接 `sqlite3 < schema.sql` 执行

---

### ✅ 3. 为 openapi.yaml 补充 examples

- **动作**：为每个 POST/PUT 请求体和关键响应加 `examples:` 字段
- **输入**：`spec/openapi.yaml`
- **输出**：补充后的 `openapi.yaml`
- **验收**：以下端点都有 example：
  - `POST /workspaces`
  - `POST /workspaces/{id}/projects`
  - `POST /workspaces/{id}/agents`
  - `POST /assignments`
  - `GET /workspaces/{id}/tasks`（响应 example）
  - `GET /workspaces/{id}/stats`（响应 example）

---

### ✅ 4. 生成 canonical types.ts

- **动作**：用 `openapi-typescript` 从 `openapi.yaml` 生成 `spec/types.ts`
- **输入**：`spec/openapi.yaml`
- **输出**：`spec/types.ts`，顶部注释 `// AUTO-GENERATED from openapi.yaml. Do not edit.`
- **现有 `types.md`**：改名为 `types.md` → 删除或改为"类型说明文档"，指向 `types.ts`
- **验收**：`types.ts` 可被 TS 项目直接 import

```bash
npx openapi-typescript spec/openapi.yaml -o spec/types.ts
```

---

## P1 — 本周内执行（影响 AI 实现准确度）

### ✅ 5. 创建 glossary.md

- **动作**：新建 `shared-context/glossary.md`
- **内容**：所有核心术语（Workspace/Project/Task/Agent/Assignment/MatchResult/Label Router）的定义 + 指向 canonical 文件的链接
- **验收**：每个术语都有"定义"和"权威文件位置"两列

---

### ✅ 6. 创建 modules/README.md 索引

- **动作**：新建 `modules/README.md`
- **内容**：模块依赖图（mermaid）+ 模块清单表（名称/职责/状态/入口）
- **验收**：AI 读此文件能在 300 token 内了解所有模块关系

---

### ✅ 7. 把 PRD 拆分为子目录结构

- **动作**：把 `modules/<module>.md` 拆为 `modules/<module>/{README.md, contract.yaml, prd.md, notes.md}`
- **拆分规则**：
  - `README.md` ← 原文件的"模块定位" + "关键约束"摘要
  - `contract.yaml` ← 新建，定义输入/输出/事件
  - `prd.md` ← 原文件的"用户故事" + "功能清单" + "验收标准"
  - `notes.md` ← 原文件的"并发控制模型" + "状态生命周期" + "边界场景" + "实现细节"
- **验收**：每个模块目录下有 4 个文件；原 `.md` 文件删除

**拆分映射表**：

| 原 modules/X.md 章节 | 新位置 |
|---------------------|--------|
| 一、模块定位 | README.md |
| 二、用户故事 | prd.md |
| 三、功能清单 | prd.md |
| 四、并发控制模型 | notes.md |
| 五、状态生命周期 | → spec/states/X-states.yaml |
| 六、失败重试策略 | notes.md |
| 七、Agent 触发器 | notes.md |
| 八、API 设计 | contract.yaml ($ref) |
| 九、边界场景 | notes.md |
| 十、验收标准 | prd.md |
| 十一、依赖 | README.md + contract.yaml |

---

### ✅ 8. 状态机转 YAML

- **动作**：把 PRD 中的 ASCII 状态图转为 `spec/states/<entity>-states.yaml`
- **输入**：`modules/dispatch-scheduler.md` 第五章、`modules/sync-engine.md` 状态机部分
- **输出**：
  - `spec/states/task-states.yaml`
  - `spec/states/assignment-states.yaml`
- **验收**：YAML 含 `initial`, `transitions[]`，每个 transition 有 `from/to/event/guard/action`
- **模板**：见 `01-proposed-structure.md` 第六节

---

## P2 — 后续优化（提升可维护性）

### ✅ 9. 编写 ADR 决策记录

- **动作**：在 `shared-context/decisions/` 下新建 4 个 ADR
- **清单**：
  - `001-github-as-source-of-truth.md`
  - `002-label-based-routing.md`
  - `003-sqlite-for-aggregation.md`
  - `004-workbuddy-as-agent-runtime.md`
- **模板**：见 `01-proposed-structure.md` 第七节
- **验收**：每个 ADR 含 背景/决策/理由/备选/后果 五节

---

### ✅ 10. 为所有 .md 加 front-matter

- **动作**：为现有所有 `.md` 文件顶部加 YAML front-matter
- **字段**：`audience`, `read_when`, `depends_on`, `status`, `canonical`
- **验收**：`grep -L "^---" **/*.md` 返回空（所有文件都有 front-matter）

---

### ✅ 11. 创建 events.yaml 事件契约

- **动作**：新建 `spec/events.yaml`，定义所有 webhook 事件和模块间事件
- **内容**：
  - GitHub webhook 事件类型（issues.opened, issues.labeled 等）
  - 模块间内部事件（match.found, assignment.created, assignment.completed）
- **验收**：每个事件有 `name`, `producer`, `consumers[]`, `payload_schema`

---

### ✅ 12. 添加实现状态标记

- **动作**：在 `AGENTS.md` 和 `modules/README.md` 中更新模块状态
- **状态值**：`planned` → `in-progress` → `implemented` → `deprecated`
- **验收**：AI 能从文档判断哪些模块已实现、哪些还在设计

---

## 迁移后的最终目录结构

```
agent-kanban/
├── AGENTS.md                         ✅ P0-1
├── shared-context/
│   ├── README.md                     (保留)
│   ├── architecture.md               (保留)
│   ├── glossary.md                   ✅ P1-5
│   └── decisions/                    ✅ P2-9
│       ├── 001-github-as-source-of-truth.md
│       ├── 002-label-based-routing.md
│       ├── 003-sqlite-for-aggregation.md
│       └── 004-workbuddy-as-agent-runtime.md
├── spec/
│   ├── openapi.yaml                  (升级，加 examples) ✅ P0-3
│   ├── schema.sql                    ✅ P0-2
│   ├── types.ts                      ✅ P0-4 (auto-generated)
│   ├── models.md                     (改为 ER 图说明)
│   ├── events.yaml                   ✅ P2-11
│   └── states/                       ✅ P1-8
│       ├── task-states.yaml
│       └── assignment-states.yaml
├── modules/
│   ├── README.md                     ✅ P1-6
│   ├── sync-engine/                  ✅ P1-7
│   │   ├── README.md
│   │   ├── contract.yaml
│   │   ├── prd.md
│   │   └── notes.md
│   ├── task-orchestrator/
│   │   ├── README.md
│   │   ├── contract.yaml
│   │   ├── prd.md
│   │   └── notes.md
│   ├── dispatch-scheduler/
│   │   ├── README.md
│   │   ├── contract.yaml
│   │   ├── prd.md
│   │   └── notes.md
│   ├── agent-runtime/
│   │   ├── README.md
│   │   ├── contract.yaml
│   │   ├── prd.md
│   │   └── notes.md
│   └── dashboard/
│       ├── README.md
│       ├── contract.yaml
│       └── prd.md
└── suggestion/                       (本目录)
    ├── 00-review-findings.md
    ├── 01-proposed-structure.md
    ├── 02-ai-friendly-patterns.md
    └── 03-migration-checklist.md
```

---

## 工作量估算

| 优先级 | 任务数 | 预估总工时 | 谁来做 |
|--------|--------|-----------|--------|
| P0 | 4 | 3-4 小时 | AI 可直接执行 |
| P1 | 4 | 5-6 小时 | AI 可执行，需人工 review |
| P2 | 4 | 4-5 小时 | AI 起草，人工补充 |
| **合计** | **12** | **12-15 小时** | |

建议执行顺序：**P0 全部 → 验证 AI 阅读体验 → P1 → P2**。

---

## 验收：AI 阅读体验测试

迁移完成后，用以下任务测试 AI 是否能高效阅读文档：

| 测试任务 | 期望 AI 行为 | 通过标准 |
|---------|-------------|---------|
| "实现 sync-engine 的 webhook 接收" | 读 AGENTS.md → modules/sync-engine/README.md → contract.yaml → prd.md | AI 能在 < 2000 token 内开始写代码 |
| "Assignment 有哪些状态？" | 读 spec/states/assignment-states.yaml | 一次读到，无需跨文件 |
| "为什么用 SQLite 不用 Postgres？" | 读 shared-context/decisions/003-sqlite-for-aggregation.md | 直接命中 ADR |
| "POST /assignments 请求体长什么样？" | 读 openapi.yaml 的 examples | 无需推断 |
| "dispatch-scheduler 依赖谁？" | 读 modules/README.md 依赖图 | 一次看到 |
