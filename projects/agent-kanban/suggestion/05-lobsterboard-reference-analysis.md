# LobsterBoard 借鉴分析

> 分析对象：[LobsterBoard](https://github.com/Curbob/LobsterBoard) (已 clone 至 `references/LobsterBoard/`)
> 分析目的：找出可借鉴的设计模式，应用到我们的 agent-kanban 项目
> 分析日期：2026-08-02

## 一、LobsterBoard 是什么

一个**自托管、拖拽式 Dashboard Builder**，60+ widgets，模板库，自定义页面，零云依赖。与 AgentTODO 完全不同——它不是任务管理，而是**可视化看板构建器**。

| 维度 | LobsterBoard | 我们的 Agent Kanban |
|------|-------------|---------------------|
| 核心功能 | Dashboard Builder（拖拽 widget） | 多项目任务看板 |
| Widget 来源 | 内置 60+ + 社区贡献 | 任务卡片（固定类型） |
| 扩展方式 | community-widgets + custom pages | Skills + Experts |
| 实时数据 | SSE 推送系统状态 | Webhook + 轮询 |
| 主题 | 5 个内置主题 | 待实现 |
| AI 集成 | DEVJARVIS_WORKFLOW（AI 作为贡献者） | Agent 作为执行者 |

**核心价值**：LobsterBoard 的**扩展性设计**非常成熟——widget registry、community template、auto-discovered pages、template gallery。这些模式直接适用于我们的看板系统。

---

## 二、10 个值得借鉴的设计

### 借鉴 1：Widget Registry Pattern ⭐⭐⭐

**位置**：`js/widgets/index.js`, `js/widgets/*.js`

**他们的做法**：
- 全局 `window.WIDGETS = {}` 作为 registry
- 按类别分文件：`ai-tools.js`, `finance.js`, `productivity.js`, `media.js` 等
- 每个 widget 是标准对象：
```js
{
  name: 'CPU / Memory',
  icon: '🖥️',
  category: 'small',           // small | large | bar
  description: '...',
  defaultWidth: 200,
  defaultHeight: 120,
  hasApiKey: false,
  properties: { title: '...', refreshInterval: 5 },
  preview: `<div>...</div>`,
  generateHtml: (props) => `...`,
  generateJs: (props) => `...`,
}
```

**为什么值得借鉴**：
我们的看板卡片（任务卡、Agent 负载卡、统计卡）可以采用同样的 registry 模式——标准化字段、按类别组织、可扩展。新增卡片类型只需往 registry 加一个对象。

**应用到我们**：
```js
// src/widgets/index.ts
export const WIDGETS = {};

// src/widgets/task-widgets.ts
WIDGETS['task-card'] = {
  name: '任务卡片',
  category: 'kanban',       // kanban | stats | agent
  properties: { showAgent: true, showLabels: true },
  generateHtml: (task) => `...`,
  generateJs: (props) => `...`,
};
```

---

### 借鉴 2：Community Widget Template ⭐⭐⭐

**位置**：`community-widgets/_template/widget.js`

**他们的做法**：
- 提供 `_template/` 文件夹，含 `README.md` + `widget.js`
- `widget.js` 是**带详尽注释的完整示例**，每个字段都有"为什么这样写"的解释
- 贡献流程：`cp -r _template my-widget` → 改 → PR
- CONTRIBUTING.md 有完整的 PR checklist（安全、多实例、错误处理）

**为什么值得借鉴**：
我们的 Skill 贡献可以照搬这种模式——提供 `_template/` 让贡献者 copy-paste 起步，用注释解释每个字段的含义，用 PR checklist 保证质量。

**应用到我们**：
```
agent-kanban/
└── community-skills/
    ├── README.md              # 贡献指南
    ├── _template/
    │   ├── SKILL.md           # skill 模板
    │   └── skill.js           # 代码模板（带注释）
    └── (社区贡献的 skills)
```

---

### 借鉴 3：Auto-discovered Pages (约定优于配置) ⭐⭐⭐

**位置**：`pages/README.md`, `pages/*/`

**他们的做法**：
- `pages/` 下每个文件夹是一个自定义页面
- 每个页面有标准结构：
```
pages/my-page/
├── page.json       # 元数据 (id, title, icon, order, enabled)
├── index.html      # 页面 UI
├── api.cjs         # 可选：服务端 API 路由
└── style.css       # 可选：样式
```
- **Drop folder + restart = 新页面出现**，无需修改主代码
- `pages.json` 可覆盖单个页面的 enabled/order

**为什么值得借鉴**：
这是"插件化扩展"的最佳实践。我们的看板可以支持自定义视图——用户 drop 一个文件夹就能加一个新视图（如"Agent 负载视图"、"项目甘特图"），不需要改主代码。

**应用到我们**：
```
agent-kanban/
└── views/
    ├── kanban/              # 内置：看板视图
    ├── agent-load/          # 内置：Agent 负载视图
    └── custom-gantt/        # 用户自定义：甘特图
        ├── view.json        # { id, title, icon, order }
        ├── index.html
        └── api.cjs          # 可选数据接口
```

---

### 借鉴 4：Page API 微框架 (api.cjs 模式) ⭐⭐⭐

**位置**：`pages/README.md` 的 "API Format" 部分

**他们的做法**：
`api.cjs` 导出一个函数，接收 `ctx`，返回 `routes` 对象：
```js
module.exports = function(ctx) {
  // ctx.dataDir — 数据目录
  // ctx.readData(filename) — 读 JSON
  // ctx.writeData(filename, obj) — 写 JSON

  return {
    routes: {
      'GET /': (req, res, { query, body, params }) => {
        return { items: [] };  // 返回值自动 JSON 序列化
      },
      'POST /': (req, res, { body }) => {
        res.statusCode = 201;
        return { id: Date.now(), ...body };
      },
      'GET /:id': (req, res, { params }) => {
        return { id: params.id };
      },
      'DELETE /:id': (req, res, { params }) => {
        return { ok: true };
      }
    }
  };
};
```

**为什么值得借鉴**：
这是一个**极简的"微框架"模式**——不需要 Express，不需要路由库，一个文件就是一个完整的 REST API。路由格式 `'METHOD /path': handler` 极其直观，返回值自动序列化。对我们的扩展页面非常合适。

**应用到我们**：
自定义视图可以用同样的模式暴露 API，无需接入主后端路由系统。

---

### 借鉴 5：Template Gallery (布局分享) ⭐⭐⭐

**位置**：`templates/`, `js/templates.js`

**他们的做法**：
- Dashboard 布局可以 **export**（含自动截图预览）
- **Browse** 模板库发现预制布局
- **Import** 支持两种模式：
  - **Replace** — 整个替换当前看板
  - **Merge** — 追加到现有布局下方
- `templates/templates.json` 是索引，每个模板有独立文件夹
- 模板可作为文件夹分享

**为什么值得借鉴**：
我们的看板配置（哪些项目、哪些 Agent、什么筛选器、什么布局）也可以 export/import。团队 A 配好了一个"前端团队看板"模板，团队 B 一键导入。

**应用到我们**：
```
agent-kanban/
└── templates/
    ├── templates.json              # 索引
    ├── frontend-team/              # 前端团队看板模板
    │   ├── config.json             # 布局配置
    │   └── preview.png             # 预览图
    └── fullstack-team/
        ├── config.json
        └── preview.png
```

---

### 借鉴 6：DEVJARVIS_WORKFLOW.md (AI 贡献者工作流) ⭐⭐⭐

**位置**：`DEVJARVIS_WORKFLOW.md`

**他们的做法**：
专门为 AI Agent（DevJarvis）写的开发工作流文件，定义：
- Fork 路径、GitHub token 位置
- 分支策略（feature/task-name-from-paperclip）
- **Pre-PR Checklist**（强制）：
  - 🧪 Testing：所有测试通过、新功能有测试、手动测试、跨浏览器
  - 🔒 Security：无硬编码凭证、输入验证、XSS 防护、auth 流程安全
  - 💡 Usefulness：明确收益、对齐 roadmap、性能影响、breaking changes
- PR 模板（含 What's Changed / Technical Details / Checklist）
- 关键规则：NEVER commit to main, NEVER push to upstream

**为什么值得借鉴**：
这是**把 AI 当作正式贡献者**的规范。我们的系统里 AI Agent 会执行任务、提交代码，应该有同样的工作流文件规范其行为。

**应用到我们**：
```
agent-kanban/
└── AGENT_WORKFLOW.md           # AI Agent 开发工作流
    ├── 分支策略
    ├── Pre-PR Checklist
    ├── PR 模板
    └── 禁止行为
```

---

### 借鉴 7：Config-driven Property Panel ⭐⭐

**位置**：`CONTRIBUTING.md` 的 "Properties" 部分

**他们的做法**：
Widget 的 `properties` 对象**自动生成编辑表单**：
```js
properties: {
  title: 'My Widget',       // string → text input
  count: 10,                // number → number input
  refreshInterval: 60,      // number → range slider
  apiKey: 'YOUR_API_KEY',   // string → password input
  enabled: true,            // boolean → checkbox
}
```
类型从默认值推断，无需手写表单 UI。

**为什么值得借鉴**：
我们的看板筛选器、Agent 配置、任务属性都可以用这种模式——定义 properties 对象，UI 自动生成，无需为每个配置项手写表单。

**应用到我们**：
```js
// Agent 配置
const agentConfig = {
  properties: {
    name: '前端专家',
    modelName: 'kimi-long-v1',
    maxConcurrency: 3,
    active: true,
  }
  // UI 自动生成 4 个编辑字段
};
```

---

### 借鉴 8：SSE 实时数据推送 ⭐⭐

**位置**：`README.md` 的 API Endpoints, `/api/stats/stream`

**他们的做法**：
- `/api/stats/stream` 用 **Server-Sent Events** 推送系统状态
- Widgets 自动刷新，无需轮询
- 对比 AgentTODO 的 node-cron 轮询，这是更实时的方案

**为什么值得借鉴**：
我们的看板需要实时更新任务状态。我在 `modules/dashboard.md` 中建议"每 30 秒轮询"，但 SSE 是更好的方案——任务状态变更时主动推送，看板即时更新。

**应用到我们**：
```
GET /api/workspaces/{id}/stream
Content-Type: text/event-stream

event: task.updated
data: {"taskId":"...","status":"in_progress"}

event: assignment.created
data: {"assignmentId":"...","agentId":"..."}
```

---

### 借鉴 9：Theme Variables 系统 ⭐⭐

**位置**：`css/themes.css`, `CONTRIBUTING.md` 的 "Theme Variables"

**他们的做法**：
- 定义一组 CSS 变量：`--bg-primary`, `--text-primary`, `--accent-blue` 等
- 5 个主题通过切换变量值实现
- **强制要求** widget 用变量而非硬编码颜色

**为什么值得借鉴**：
我们的看板应该支持主题（至少 light/dark），用 CSS 变量统一管理。

**应用到我们**：
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f6f8fa;
  --text-primary: #1f2328;
  --accent-blue: #0969da;
  --accent-green: #1a7f37;
  --border-color: #d0d7de;
}

[data-theme="dark"] {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --text-primary: #e6edf3;
  /* ... */
}
```

---

### 借鉴 10：Remote Agent 分发模式 ⭐

**位置**：`README.md` 的 "Remote Server Monitoring"

**他们的做法**：
- 主 Dashboard 是一个进程
- `lobsterboard-agent` 是独立 npm 包，装在远程服务器上
- 主 Dashboard 通过 API key 连接多个 agent
- 一个 Dashboard 监控多台服务器

**为什么值得借鉴**：
这和我们的"一个看板管理多个 GitHub Repo"是同样的架构思路——中心化看板 + 分布式 agent。我们的 agent-runtime 可以做成独立分发的包。

---

## 三、不建议借鉴的点

### ❌ 1. BSL-1.1 许可证

LobsterBoard 用 Business Source License，商用需付费。我们应用 MIT 或 Apache-2.0。

### ❌ 2. 单文件 server.cjs

他们用一个 `server.cjs` 处理所有路由。我们用结构化后端（Hono + 路由分文件）更易维护。

### ❌ 3. 无构建步骤

他们"no build step"是卖点，但代价是不能用 TypeScript、不能用现代前端工具链。我们用 Vite + TS。

### ❌ 4. generateJs 用 new Function()

他们的 widget 的 `generateJs` 返回字符串，通过 `new Function()` 执行。这是安全隐患（虽然他们有 review）。我们用正常的 ES modules。

---

## 四、与 AgentTODO 的对比

| 维度 | AgentTODO | LobsterBoard |
|------|-----------|-------------|
| 核心场景 | AI 操作任务 | 人构建看板 |
| 强项 | AI 接入层（CLI Skill） | 扩展性（Widget/Page/Template） |
| AI 角色 | 执行者 | 贡献者（DEVJARVIS_WORKFLOW） |
| 实时性 | Cron 轮询 | SSE 推送 |
| 扩展方式 | Skills | Widgets + Pages + Templates |
| 配置 | 代码即配置 | Config-driven UI |

**两者互补**：
- AgentTODO 教我们"如何让 AI 接入"
- LobsterBoard 教我们"如何让系统可扩展"

---

## 五、立即可执行的改进

基于这次分析，对我们的项目补充以下内容：

| 改进项 | 来源 | 优先级 |
|--------|------|--------|
| 看板卡片用 Widget Registry 模式 | 借鉴 1 | P0 |
| Skill 贡献用 `_template/` 模式 | 借鉴 2 | P0 |
| 自定义视图用 auto-discovered pages | 借鉴 3 | P1 |
| 看板布局 export/import (Template Gallery) | 借鉴 5 | P1 |
| 写 AGENT_WORKFLOW.md（AI 贡献者规范） | 借鉴 6 | P1 |
| 用 SSE 替代轮询做实时更新 | 借鉴 8 | P1 |
| Config-driven 筛选器/配置面板 | 借鉴 7 | P2 |
| CSS 变量主题系统 | 借鉴 9 | P2 |

---

## 六、总结

LobsterBoard 与 AgentTODO 形成完美互补：

- **AgentTODO** = "AI 接入层设计"的老师（CLI Skill、提示词模板、三层接入）
- **LobsterBoard** = "系统扩展性设计"的老师（Widget Registry、Auto-discovered Pages、Template Gallery、AI 贡献者工作流）

我们的 agent-kanban 应该**同时吸收两者**：
- 从 AgentTODO 学"如何让 AI 用得舒服"
- 从 LobsterBoard 学"如何让系统长得大"

LobsterBoard 最核心的启示是：**好的扩展性 = 标准化接口 + 模板化贡献 + 约定优于配置**。Widget Registry 让新增能力只需加一个对象；`_template/` 让贡献者 copy-paste 起步；auto-discovered pages 让新功能 drop folder 即可用。这些模式让系统可以"生长"而不需要重构。
