# AgentTODO 借鉴分析

> 分析对象：[AgentTODO](https://github.com/alanhsun/AgentTODO) (已 clone 至 `references/AgentTODO/`)
> 分析目的：找出可借鉴的设计模式，应用到我们的 agent-kanban 项目
> 分析日期：2026-08-02

## 一、AgentTODO 是什么

一个**单用户、本地化、为 AI 助手设计的任务管理中枢**。

| 维度 | AgentTODO | 我们的 Agent Kanban |
|------|-----------|---------------------|
| 用户模型 | 单用户、Zero-Auth | 多项目、多 Agent |
| 任务源 | 自建 tasks 表 | GitHub Issues (SoT) |
| AI 接入 | CLI Skill + REST + Python Wrapper | WorkBuddy Experts |
| 看板 | 单项目 Kanban | 跨项目聚合 Kanban |
| 触发方式 | Cron + Webhook 推送 | Webhook + Label 路由 |
| 部署 | Docker 一键 | 待定 |

**核心差异**：AgentTODO 是"AI 操作我的待办"，我们是"AI 操作 GitHub Issues 并跨项目协作"。但他们的**接入层设计**非常成熟，值得学习。

---

## 二、8 个值得借鉴的设计

### 借鉴 1：CLI Skill System (BaseSkill + SkillManager) ⭐⭐⭐

**位置**：`server/src/cli/BaseSkill.js`, `SkillManager.js`, `skills/*.js`

**他们的做法**：
- 每个 skill 是独立 `.js` 文件，继承 `BaseSkill`
- `BaseSkill` 定义三个方法：`validate()` / `execute()` / `handleError()`
- `SkillManager` 通过 `require.cache` 清除实现**热加载**——修改 skill 不用重启服务
- AI 通过 stdin/stdout 用 `run <skill> <json>` 调用

**为什么值得借鉴**：
我们的 `agent-runtime` 模块可以采用同样的架构——把每个 Agent 能力（写代码、跑测试、生成 PR）做成可热加载的 skill，避免每次加能力都要重启。

**应用到我们**：
```
agent-kanban/
└── runtime/
    ├── skills/
    │   ├── implement_feature.js    # 实现 issue 描述的功能
    │   ├── fix_bug.js              # 修复 bug
    │   ├── generate_tests.js       # 生成测试用例
    │   ├── create_pr.js            # 创建 Pull Request
    │   └── close_issue.js          # 关闭 issue + 评论
    ├── BaseSkill.js
    └── SkillManager.js
```

---

### 借鉴 2：HTML 注释式元数据标记 ⭐⭐⭐

**位置**：所有 `.md` 文档和 `openapi.yaml`

**他们的做法**：用 HTML 注释作为 AI 可解析的语义标记：
```markdown
<!-- @purpose -->
本文档旨在...
<!-- /purpose -->

<!-- @input -->
```bash
POST /api/tasks
```
<!-- /input -->

<!-- @output -->
```json
{ "id": 1 }
```
<!-- /output -->

<!-- @references -->
- [API 参考](./api-reference.md)
<!-- /references -->
```

**为什么值得借鉴**：
这比我之前在 `suggestion/01-proposed-structure.md` 中建议的 YAML front-matter **更轻量、更精准**：
- front-matter 只能描述整个文件
- HTML 注释可以标记**文件内的段落**（purpose/input/output/references/dependencies/features）
- AI 可以用正则一次性提取所有语义块
- 不破坏 Markdown 渲染（HTML 注释在浏览器中不显示）

**应用到我们**：
应该把这种模式加入 `suggestion/02-ai-friendly-patterns.md`，作为第 11 个模式。所有文档段落用 `<!-- @xxx -->` 标记，AI 可以直接 grep 出所有 input/output 块。

---

### 借鉴 3：三层 AI 接入方式 ⭐⭐⭐

**位置**：`docs/api-reference.md`, `server/src/cli/`, `ai-integration/openclaw_tools.py`

**他们的做法**：同一套能力提供三种接入方式，覆盖不同 AI 客户端：

| 接入方式 | 适用场景 | 文件 |
|---------|---------|------|
| **REST API** | 通用、跨语言 | `docs/api-reference.md` |
| **CLI Skill** | 本地 AI、stdin/stdout | `server/src/cli/` |
| **Python Wrapper** | OpenClaw/Coze 等需要 Python 函数签名 | `ai-integration/openclaw_tools.py` |

**为什么值得借鉴**：
不同 AI Agent 框架的能力差异很大——WorkBuddy 用 Skills，OpenClaw 用 Python 函数，ChatGPT 用 REST。提供多种接入方式能最大化兼容性。

**应用到我们**：
```
agent-kanban/
└── integrations/
    ├── rest/                # REST API (openapi.yaml)
    ├── cli/                 # CLI Skill (stdin/stdout)
    ├── python/              # Python wrapper (函数签名 + docstring)
    └── workbuddy/           # WorkBuddy Skill 包
```

---

### 借鉴 4：AI 工作流提示词模板 ⭐⭐⭐

**位置**：`ai-integration/skill_workflow.md`, `ai-assistant-setup-guide.md`

**他们的做法**：把"AI 何时调用哪个技能"写成**产品的一部分**，提供现成的 system prompt：

```
> 【AgentTODO 任务管理技能执行规范】
> 1. 信息获取原则 (读取)
>    - 当用户问"我今天要做什么"时，调用 get_today_agenda
>    - 当用户要求总结时，调用 get_daily_summary
> 2. 自动目标拆解 (写入)
>    - 当用户口述一个新目标时，主动拆解为 3-5 个子步骤
> 3. 对话即交互 (更新状态)
>    - 用户说"终于写完代码了"→ 调用 add_task_progress_note
```

**为什么值得借鉴**：
这是把"AI 使用说明书"作为产品交付，而不是让用户自己摸索。我们的系统应该同样提供"Agent 何时调用哪个 API"的提示词模板。

**应用到我们**：
```
agent-kanban/
└── spec/
    └── ai-prompts/
        ├── frontend-agent-prompt.md      # 前端 Agent 的 system prompt
        ├── backend-agent-prompt.md       # 后端 Agent 的 system prompt
        ├── orchestrator-prompt.md        # 编排层 Agent 的 prompt
        └── README.md                     # 如何使用这些 prompt
```

---

### 借鉴 5：Webhook 主动推送（事件驱动） ⭐⭐

**位置**：`server/src/services/webhookService.js`, `server/src/worker.js`

**他们的做法**：
- `webhooks` 表存储订阅方 URL + 关心的事件列表
- `triggerWebhook(event, payload)` 遍历订阅方，匹配事件后 POST
- `worker.js` 用 node-cron 定时扫描逾期任务，触发 `task.overdue` 事件
- 支持通配符 `*` 订阅所有事件

**为什么值得借鉴**：
我在 `suggestion/01-proposed-structure.md` 中建议的 `spec/events.yaml` 就是这个思路，但他们已经实现了。我们可以直接参考他们的实现模式。

**应用到我们**：
```javascript
// 我们的事件类型
const EVENTS = [
  'issue.created',        // GitHub issue 创建
  'issue.labeled',        // 打标签（触发 Label Router）
  'match.found',          // 找到匹配的 Agent
  'assignment.created',   // 分配创建
  'assignment.started',   // Agent 开始执行
  'assignment.completed', // Agent 完成
  'assignment.failed',    // Agent 失败
];
```

---

### 借鉴 6：渐进式 Migration ⭐⭐

**位置**：`server/migrations/001_initial.js`, `002_ai_features.js`, `003_webhooks.js`

**他们的做法**：按主题拆分 migration：
- 001: 基础表（tasks, tags, task_tags）
- 002: AI 功能（subtasks, task_notes, recurrence）
- 003: Webhook 系统

**为什么值得借鉴**：
我们的 `spec/models.md` 把所有表塞在一个 SQL 块里，不利于演进。应该拆成 migration 文件。

**应用到我们**：
```
agent-kanban/
└── spec/
    └── migrations/
        ├── 001_core_tables.sql       # workspaces, projects, tasks, agents
        ├── 002_assignments.sql       # assignments 表
        └── 003_audit_log.sql         # agent_audit_log 表
```

---

### 借鉴 7：Skill 代码的"为什么"注释 ⭐⭐

**位置**：`server/src/cli/skills/create_task.js`

**他们的做法**：每个 skill 文件都有大量中文注释解释"为什么这样写"：
```javascript
// 为什么需要 BASE_URL？因为我们的 CLI 相当于一个遥控器，
// 它需要知道服务器的具体地址才能发指令。
const BASE_URL = process.env.AGENTTODO_URL || 'http://localhost:3301/api';

// 为什么用 axios？它像是一个可靠的快递员，帮我们把包裹发给后端。
const res = await axios.post(`${BASE_URL}/tasks`, payload);

// 为什么需要 handleError？为了捕获网络断开等意外，并友好地提示你。
return this.handleError(error);
```

**为什么值得借鉴**：
这种注释对 AI 阅读代码极其友好——AI 不只是看到"做了什么"，还理解"为什么这样做"，避免在维护时做出错误决策。

**应用到我们**：
在我们的 runtime/skills/ 实现中，强制要求每个 skill 文件顶部有"为什么"注释块。

---

### 借鉴 8：Zero-Auth 作为部署选项 ⭐

**位置**：`README.md`, `docs/api-reference.md`

**他们的做法**：
- 默认 Zero-Auth，无需 JWT/token
- 设计前提是"本地可信网络"
- AI 直接 HTTP 调用，零配置

**为什么值得借鉴**：
我们的系统在 MVP 阶段也可以提供 Zero-Auth 模式，降低本地部署门槛。生产环境再加 API Key。

**应用到我们**：
在 `spec/openapi.yaml` 中加 `securitySchemes`，但默认不启用。配置项 `AUTH_MODE=zero|api-key`。

---

## 三、不建议借鉴的点

### ❌ 1. 单用户数据模型

他们的 `tasks` 表没有 `user_id`、没有 `project_id`。我们是多项目系统，必须有项目维度。

### ❌ 2. 无 OpenAPI examples

他们的 `openapi.yaml` 也没有 `examples:` 字段，验证了我们之前 review 中指出的问题——这是通病，不是个例。

### ❌ 3. Webhook 无签名验证

他们的 `triggerWebhook` 直接 POST，没有 HMAC 签名。我们是 GitHub webhook 接收方，必须验证签名。

### ❌ 4. CLI 用 readline 而非 JSON-RPC

他们的 CLI 用空格分割解析命令（`run create_task {"title":"x"}`），容易出错。我们应该用 JSON-RPC 或 stdin 读整行 JSON。

---

## 四、立即可执行的改进

基于这次分析，对我们的 suggestion/ 文档补充以下内容：

| 改进项 | 来源 | 优先级 |
|--------|------|--------|
| 在 `02-ai-friendly-patterns.md` 加"HTML 注释元数据"模式 | 借鉴 2 | P0 |
| 在 `01-proposed-structure.md` 加 `integrations/` 目录（三层接入） | 借鉴 3 | P0 |
| 在 `01-proposed-structure.md` 加 `spec/ai-prompts/` 目录 | 借鉴 4 | P1 |
| 在 `03-migration-checklist.md` 加"拆分 schema.sql 为 migrations/" | 借鉴 6 | P1 |
| 在 `01-proposed-structure.md` 加 `runtime/skills/` 热加载架构 | 借鉴 1 | P1 |
| 在 `spec/events.yaml` 参考 webhookService 设计 | 借鉴 5 | P2 |

---

## 五、总结

AgentTODO 是一个**接入层设计成熟、核心模型简单**的项目。它的价值不在于功能复杂度，而在于：

1. **把 AI 当一等公民**——skill 系统、提示词模板、多接入方式都是为 AI 量身定制
2. **轻量但有效**——HTML 注释元数据、BaseSkill 模板、热加载，每个都很简单但组合起来很强大
3. **文档即产品**——README/api-reference/skill_workflow 都是可交付物，不是附属品

我们的 agent-kanban 在**核心模型**（多项目、GitHub SoT、Label 路由）上比 AgentTODO 复杂，但在**接入层**上应该向它学习——让 AI 用得舒服、用得自然。
