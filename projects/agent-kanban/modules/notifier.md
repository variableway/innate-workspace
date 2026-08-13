# PRD: Notifier（IM / 出站通知）

## 一、模块定位

| 属性 | 值 |
|------|-----|
| **层级** | 出站通知 |
| **职责** | 将任务生命周期事件路由到一个或多个 IM / Webhook 渠道 |
| **输入** | 内部事件（assignment.completed、ask_human、in_review 等） |
| **输出** | 各渠道消息；`kanban_notification_delivery` 投递日志 |

## 二、用户故事

### US-1: 完成推送
When Assignment 成功并进入 in_review，Then 配置的 IM 收到含标题、Agent、摘要、GitHub 链接的消息。

### US-2: 失败告警
When Assignment 最终 failed，Then 告警渠道收到错误原因与重试次数。

### US-3: 多渠道
When Workspace 绑定了飞书与 Slack，Then 同一事件按订阅配置分别投递，互不影响。

### US-4: 人工请示
When TIP `ask_human`，Then 指定渠道 @ 或推送到「需回复」会话（若渠道支持）。

### US-5: 可关闭
When 未配置任何渠道，Then 系统静默跳过，不影响主流程。

## 三、功能清单

| ID | 功能 | 优先级 | 说明 |
|----|------|--------|------|
| F1 | 渠道注册 | P0 | channel_type + credentials 引用（不落明文到日志） |
| F2 | 事件订阅 | P0 | 哪些 event → 哪些 channel |
| F3 | 模板渲染 | P0 | 每渠道一套 Markdown/卡片模板 |
| F4 | 投递与重试 | P0 | 失败指数退避 3 次；记 delivery log |
| F5 | 通用 webhook | P0 | 兼容现有 `kanban_webhook_subscription` |
| F6 | Slack | P1 | Incoming Webhook 或 Bot |
| F7 | 飞书 | P1 | 自定义机器人 webhook |
| F8 | 钉钉 | P1 | 加签机器人 |
| F9 | 企业微信 | P1 | 群机器人 |
| F10 | 静默时段 / 去重 | P2 | 同 task 5 分钟内合并 |

## 四、渠道模型

扩展原 `kanban_webhook_subscription`，或并列 `kanban_notify_channel`：

| 字段 | 说明 |
|------|------|
| id / workspace_id | 归属 |
| name | 展示名 |
| channel_type | `webhook \| slack \| feishu \| dingtalk \| wecom` |
| endpoint_url | Webhook URL |
| secret | 钉钉加签等（加密存储） |
| events | JSON 数组，如 `["assignment.completed","assignment.failed","tip.ask_human"]` |
| is_active | 开关 |
| template_id | 可选自定义模板 |

## 五、默认通知事件

| 事件 | 默认是否推 | 文案要点 |
|------|------------|----------|
| `assignment.completed` | 是 | 进入待审 + summary 摘要 |
| `assignment.failed` | 是 | error + retry_count |
| `tip.ask_human` | 是 | question + 任务链接 |
| `task.moved_in_review` | 可选 | 与 completed 合并避免双推 |
| `agent.overloaded` | 可选 | 负载告警 |
| `sync.error` | 可选 | 同步连续失败 |

## 六、处理流程

```
internal_event
  → Notifier.match_subscriptions(workspace, event)
  → for channel in matched:
        render(template, payload)
        send(adapter)
        write delivery_log (success|failed)
```

主链路 **异步**：通知失败不回滚 Assignment。

## 七、验收标准

- [ ] 无渠道时主流程零报错
- [ ] 至少 2 种渠道（含 generic webhook）可同时收到 completed
- [ ] delivery_log 可按 task / channel 查询
- [ ] 密钥不出现在 API 列表响应明文（仅创建时返回一次或掩码）
- [ ] 契约测试覆盖「订阅过滤」与「重试耗尽」

## 八、依赖

- 上游：events.yaml 内部事件
- 下游：外部 IM API
- 配置：Workspace 级渠道，不强制全局
