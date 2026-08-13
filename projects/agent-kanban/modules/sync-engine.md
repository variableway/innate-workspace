# PRD: 同步引擎 (Sync Engine)

## 一、模块定位

| 属性 | 值 |
|------|-----|
| **层级** | 接入层与数据层的桥梁 |
| **职责** | 将 GitHub Issues 的数据实时同步到本地 SQLite，保持双向状态一致 |
| **输入** | GitHub Webhook Events / 定时轮询 |
| **输出** | 更新后的 Task 记录 (SQLite) |

## 二、用户故事

### US-1: Webhook 实时同步
When GitHub Issue 发生变更（创建/关闭/标签变更/分配），Then 系统应在 3 秒内将变更同步到本地数据库并通知看板刷新。

### US-2: 轮询兜底
When webhook 因网络问题丢失，Then 系统应通过定时轮询（每 5 分钟）自动补齐遗漏的变更。

### US-3: 首次全量同步
When 新项目添加时，Then 系统应拉取该 Repo 的所有 open Issue 到本地缓存。

### US-4: 状态与摘要回写
While Agent 完成任务后，Then 同步引擎应回写 `status:*` label（通常 `status:in-review`），并可将 Artifact summary 写成 Issue **短评论**（长文留在 Artifact，避免双写漂移）。默认 **不** 因 Agent complete 直接 close Issue；close 由人工确认 done 或策略触发。

### US-5: 冲突处理
If GitHub Issue 状态与本地缓存不一致，Then 按 `docs/states/task-states.yaml` 优先级栈解析（closed / status:* / assignment / keep-local / backlog），而非简单「永远覆盖本地」。
## 三、功能清单

| ID | 功能 | 优先级 | 说明 |
|----|------|--------|------|
| F1 | Webhook 事件接收 | P0 | POST /webhooks/github，验证 HMAC-SHA256 签名 |
| F2 | 事件分发器 | P0 | 根据 event type 分发到对应 handler |
| F3 | Issue 创建处理 | P0 | 写入 tasks 表，触发任务编排 |
| F4 | Issue 更新处理 | P0 | 同步 title/body/labels/assignee/status 变更 |
| F5 | Issue 关闭处理 | P0 | 更新 task.status = done |
| F6 | 轮询同步 | P1 | 每 5 分钟拉取 open issues，diff + 补齐 |
| F7 | 全量同步 | P1 | 手动触发或首次添加项目时执行 |
| F8 | 回写 GitHub | P1 | 写 status:* label、短 comment；按策略 close |
| F9 | 签名验证 | P0 | HMAC-SHA256 验证 webhook 合法性 |
| F10 | 同步状态监控 | P2 | 记录每次同步的耗时和结果 |

## 四、处理流程

### 4.1 Webhook 事件处理

```
POST /webhooks/github
  │
  ├── 1. 验证签名 (HMAC-SHA256)
  │     └── 失败 → 401
  │
  ├── 2. 匹配 project (repo_owner + repo_name)
  │     └── 未找到 → 200 (忽略非关联 repo)
  │
  ├── 3. 事件分发
  │     ├── issues.opened   → handleIssueOpened()
  │     ├── issues.closed   → handleIssueClosed()
  │     ├── issues.reopened → handleIssueReopened()
  │     ├── issues.labeled  → handleIssueLabeled()
  │     ├── issues.unlabeled→ handleIssueUnlabeled()
  │     ├── issues.assigned → handleIssueAssigned()
  │     └── issues.edited   → handleIssueEdited()
  │
  └── 4. 返回 200 OK
```

### 4.2 轮询同步流程

```
定时器触发 (每 5 分钟)
  │
  └── 遍历所有 active 项目
        │
        ├── Octokit.issues.listForRepo(state: open)
        │     └── 与本地 tasks 做 diff
        │
        ├── 新增的 Issue → INSERT tasks
        ├── 变更的 Issue → UPDATE tasks
        └── 已关闭的 → UPDATE tasks.status = closed
```

### 4.3 状态回写流程

```
Agent TIP complete（或看板 PATCH）
  │
  ├── 1. 同步 status:* labels（如 status:in-review）
  ├── 2. 可选：createComment(摘要 + Artifact 链接)
  ├── 3. 仅当目标列为 done 且策略允许时 close issue
  └── 4. 本地 task.status 已由 Orchestrator 更新；本模块保证与 GitHub 一致
```
## 五、技术方案

| 项 | 选择 |
|----|------|
| GitHub API | Octokit (@octokit/rest) |
| Webhook 框架 | Hono middleware |
| 轮询调度 | node-cron |
| 签名验证 | crypto.createHmac('sha256', secret).update(payload).digest('hex') |
| 错误处理 | 重试 3 次，指数退避 (1s, 2s, 4s) |

## 六、边界场景

| 场景 | 处理方式 |
|------|---------|
| Webhook 重复投递 | 通过 issue_number + updated_at 幂等处理 |
| Webhook 乱序 | 以 updated_at 为准，旧事件忽略 |
| GitHub API rate limit | 轮询时检查 X-RateLimit-Remaining，接近上限时降级 |
| 项目 webhook secret 丢失 | 返回错误，提示用户重新配置 |
| Issue 被非 Agent 关闭 | 正常同步为 closed，assignment 标记为 cancelled |
| 大量 Issue (1000+) | 分页拉取，每页 100 条 |

## 七、验收标准

- [ ] Webhook 收到后 3 秒内写入本地 SQLite
- [ ] 签名验证拒绝非法请求（401）
- [ ] 轮询每 5 分钟执行一次，误差不超过 30 秒
- [ ] 新项目添加后 1 分钟内完成全量同步
- [ ] Agent 结果成功回写到 GitHub Issue comment
- [ ] 连续 3 次同步失败后触发告警
- [ ] Webhook 事件与轮询结果无重复数据

## 八、依赖

- 上游：GitHub Webhook / GitHub API
- 下游：Task Orchestrator（通过 SQLite 写入后的触发机制）
