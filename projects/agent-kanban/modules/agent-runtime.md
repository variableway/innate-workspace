# PRD: Agent 执行层 (Agent Runtime)

## 一、模块定位

| 属性 | 值 |
|------|-----|
| **层级** | 执行层 |
| **职责** | AI Agent 的实际执行环境，拉取任务 → 用绑定的模型 + Skills 执行 → 回写结果 |
| **输入** | Assignment (pending) → Task Body |
| **输出** | 执行结果 (GitHub Comment) → 状态更新 |

## 二、用户故事

### US-1: Agent 拉取任务
When 有新的 Assignment 标记为 pending 且指向本 Agent，Then Agent 应自动拾取并开始执行。

### US-2: 模型绑定执行
When 前端 Agent 执行任务，Then 应使用 `kimi-long-v1` 模型执行；When 后端 Agent 执行任务，Then 应使用 `glm-4-flash` 模型执行。

### US-3: Skill 工具链
While Agent 执行中，Then 应能调用其关联的 Skills（如文件读写、git 操作、代码生成）完成任务。

### US-4: 上下文感知
When Agent 开始执行，Then 应从 Issue Body 获取任务描述，从项目 Memory 获取历史上下文。

### US-5: 结果回写
When Agent 完成执行，Then 应将结果以评论形式写入 GitHub Issue，并尝试关闭 Issue。

### US-6: 执行日志
While Agent 执行，Then 应记录关键步骤、模型选择、token 消耗和执行耗时。

## 三、功能清单

| ID | 功能 | 优先级 | 说明 |
|----|------|--------|------|
| F1 | Assignment 拾取 | P0 | Polling 检测 pending assignment |
| F2 | Prompt 构建 | P0 | Issue body + instruction + project context |
| F3 | 模型选择 | P0 | 根据 agent.model_name 选择对应模型 |
| F4 | Skills 调用 | P0 | 执行 agent.skills 列表中的能力 |
| F5 | 结果回写 | P0 | GitHub Issue comment + close |
| F6 | 执行日志 | P1 | 记录步骤、模型、token、耗时 |
| F7 | 错误处理 | P1 | 异常捕获、重试、降级 |
| F8 | Memory 读写 | P2 | 读写项目 Memory 获取上下文 |

## 四、Agent 配置规范

每个 Agent 在 WorkBuddy 中对应一个 Expert，配置如下：

```yaml
# Agent 配置 (存储在 WorkBuddy Expert 定义中)
name: "前端开发专家"
role: "frontend"
model_name: "kimi-long-v1"          # 绑定的 AI 模型
capability_tags: ["frontend", "ui", "component", "style"]
skills:
  - "react-component"                # 组件生成
  - "tailwind-css"                   # 样式
  - "jest-test"                      # 测试
  - "github-cli"                     # GitHub 操作
  - "git-pr"                         # PR 创建
github_bot_account: "agent-frontend-bot"
max_concurrency: 3
```

## 五、执行流程

### 5.1 任务执行主流程

```
1. Assignment 拾取
   ├── 查询: SELECT * FROM assignments WHERE agent_id=? AND status='pending' LIMIT 1
   ├── 更新: UPDATE assignments SET status='running', started_at=now()
   └── 读取: task = SELECT * FROM tasks WHERE id=assignment.task_id

2. Prompt 构建
   ├── System: agent.role + agent.description
   ├── Context: project.MEMORY.md + task.project 上下文
   ├── Task: task.title + task.body
   ├── Labels: task.labels (用于 Skill 选择)
   ├── Instruction: assignment.instruction (如有)
   └── Output format: "请在完成后: 1) 用 git 提交代码 2) 在 Issue 下评论结果"

3. 模型调用
   ├── 使用 agent.model_name 绑定的模型
   ├── 加载 agent.skills 列表
   └── 执行 (multi-turn, skill calls)

4. 结果处理
   ├── 成功: 写入 GitHub Comment + close issue
   ├── 失败: 记录错误原因 + 标记 assignment.failed
   └── 更新 assignment.completed_at, assignment.result_summary

5. 日志记录
   ├── model_used, tokens_used, duration_ms
   └── 写入 agent_audit_log 表
```

### 5.2 Prompt 模板

```
System:
你是 {agent.name}，角色定位是 {agent.role}。
你的专长领域: {agent.capability_tags}
你可以使用的工具: {agent.skills}

项目背景:
{project_memory}

当前任务:
## {task.title}
{task.body}

标签: {task.labels}

指令:
1. 阅读并理解任务需求
2. 使用合适的工具完成任务
3. 完成后，请在 GitHub Issue 下评论你的执行结果
4. 如果完成，关闭此 Issue
5. 如果遇到无法解决的问题，在评论中说明原因
```

## 六、在 WorkBuddy 中的实现

### MVP 方案: WorkBuddy Automation

```javascript
// Automation 配置
{
  name: "前端 Agent 任务拾取器",
  scheduleType: "recurring",
  rrule: "FREQ=MINUTELY;INTERVAL=5",
  modelId: "kimi-long-v1",
  prompt: `
    1. 查询 SQLite: SELECT assignments WHERE agent_id=(前端Agent) AND status=pending LIMIT 1
    2. 如果找到: 设为 running, 读取 task.body
    3. 用你的 Skills ({skills列表}) 执行任务
    4. 完成后写 GitHub Comment + close issue
    5. 更新 assignment 状态为 done
    6. 如果失败: 标记 failed, 记录错误原因
    7. 如果没找到任务: 静默结束
  `
}
```

### V2 方案: Webhook 触发

Agent 暴露一个 webhook 端点，Dispatch Scheduler 在创建 Assignment 后直接 POST 触发，从 cron 轮询变为事件驱动。

## 七、Agent 注册流程

```
1. 在 Agent Kanban 中创建 Agent 记录 (POST /agents)
   ├── 指定 name, role, modelName, capabilityTags, skills
   └── 获得 agentId

2. 在 WorkBuddy 中创建对应 Expert
   ├── 名称: 与 agent.name 一致
   ├── 角色: 与 agent.role 一致
   └── 工具: 对应 agent.skills

3. 创建 WorkBuddy Automation
   ├── modelId: agent.model_name
   └── prompt: Agent 任务拾取 + 执行逻辑

4. 在 GitHub 创建对应 Bot 账号 (可选)
   └── 用于 issue.assignee 标识
```

## 八、边界场景

| 场景 | 处理方式 |
|------|---------|
| Agent 执行中 WorkBuddy 重启 | Assignment 保持 running，超时后自动 failed |
| Issue body 为空 | 仅根据 title + labels 推断任务范围 |
| 需要人工决策 | Agent 在 Issue 评论中 @ 项目成员，标记为 blocked |
| 产物多文件 | Agent 创建 Pull Request 而非直接 push main |
| 并发执行冲突 | 不同 Agent 操作不同文件，通过 git 分支隔离 |
| Model API 不可用 | 切换备选模型，记录降级日志 |

## 九、验收标准

- [ ] Agent 能自动拾取 pending assignment 并开始执行
- [ ] 正确使用绑定的模型（Kimi/GLM/Hunyuan）
- [ ] Skills 调用正常（文件读写、git、代码生成）
- [ ] 执行结果成功写入 GitHub Issue comment
- [ ] 任务完成后 Issue 被关闭
- [ ] 失败时正确记录错误信息
- [ ] 执行日志包含 model/token/duration

## 十、依赖

- 上游：Dispatch Scheduler (Assignment)
- 平台：WorkBuddy (Experts + Automations + Skills)
- 外部：GitHub API (comment + close issue)
