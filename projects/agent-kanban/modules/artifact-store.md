# PRD: Artifact Store（执行过程账本）

## 一、模块定位

| 属性 | 值 |
|------|-----|
| **层级** | 数据 / 过程 SoT |
| **职责** | 保存 Agent 执行过程中的计划、笔记、日志、摘要与决策；对看板与 GitHub 提供可复盘视图 |
| **输入** | TIP progress / plan / complete；人工编辑计划 |
| **输出** | Artifact 记录；可选 Issue comment / 仓内 Markdown 镜像链接 |
| **参考** | [Backlog.md](https://github.com/MrLesk/Backlog.md) 任务文件中的 plan / notes / final summary |

## 二、用户故事

### US-1: 写计划再动手
When Agent 拾取任务，Then 应按审查闸先处理 spec（必要时 `submit_spec`），再写入 `kind=plan`；若 Workspace 开启「计划审批」，Then 进入 coding 前需人工批准。详见 [review-gates.md](./review-gates.md)。

### US-2: 执行中留痕
While Agent 执行，Then 关键步骤、工具调用摘要、阻塞原因应写入 `note` / `log`，看板详情可按时间线查看。

### US-3: 完成后摘要
When Assignment 完成或失败，Then 必须有一条 `summary` Artifact，并回写 GitHub Issue 评论（含链接或短摘要）。

### US-4: 复盘
When 用户打开已完成任务，Then 应能看到完整 Spec（Issue）→ Plan → Notes → Summary，无需翻聊天记录。

### US-5: 可选仓内镜像
When 项目开启 `artifact_mirror=git`，Then 系统将 artifact 渲染为 `docs/runs/<issue>-<assignment>.md`（或配置路径）并可选开 PR。

## 三、功能清单

| ID | 功能 | 优先级 | 说明 |
|----|------|--------|------|
| F1 | Artifact CRUD | P0 | 按 assignment / task 创建与查询 |
| F2 | kind 枚举 | P0 | `spec \| plan \| note \| log \| summary \| decision` |
| F3 | 版本号 | P0 | 同 kind 可多版本；默认展示最新 |
| F4 | 时间线 API | P0 | `GET /tasks/{id}/artifacts` 按时间排序 |
| F5 | 完成闸 | P0 | `complete` 前若无 summary → 自动生成或拒绝 |
| F6 | Issue 回写 | P1 | summary → createComment；正文放链接防双写 |
| F7 | 计划审批状态 | P1 | `draft \| pending_review \| approved \| rejected` |
| F8 | Git 镜像 | P2 | 写入仓内 Markdown（Backlog.md 风格账本） |
| F9 | 全文检索 | P2 | 按 task / agent / kind 搜索 |

## 四、数据模型（契约草案）

见 `docs/schema.sql` 表 `kanban_artifact`：

| 字段 | 说明 |
|------|------|
| id | UUID |
| task_id / assignment_id | 归属；assignment 可空（人工预写 plan） |
| agent_id | 作者 Agent（可空=人工） |
| kind | spec / plan / note / log / summary / decision |
| title | 短标题 |
| body_md | Markdown 正文 |
| status | draft / published / approved / rejected（plan 用） |
| version | 自增版本 |
| github_comment_id | 若已回写 |
| created_at / updated_at | ISO 时间 |

## 五、与双 SoT 的边界

| 内容 | 存哪里 | 不存哪里 |
|------|--------|----------|
| 列状态 / 开闭 | GitHub + task.status | Artifact |
| Issue 需求正文 | GitHub Issue body | 可引用，不复制为唯一源 |
| 结构化 AC | Artifact `kind=spec`（叠加层） | 不取代 Issue body |
| 实现计划 / 步骤日志 | Artifact | 不把长日志塞进 Issue body |
| 最终给人类的一句话结果 | Artifact.summary + Issue 短评论 | — |

## 六、API（草案，写入 openapi 于 M2）

- `POST /api/v1/assignments/{id}/artifacts`
- `GET /api/v1/tasks/{id}/artifacts`
- `PATCH /api/v1/artifacts/{id}`（审批 plan、修订正文）
- `POST /api/v1/artifacts/{id}/publish`（回写 GitHub comment）

## 七、验收标准

- [ ] 任意 done/failed 的 Assignment 至少有 1 条 summary
- [ ] 详情面板时间线可区分 plan / note / summary
- [ ] 开启计划审批时，未 approved 不能 TIP.complete 成功路径（可 fail/取消）
- [ ] spec 闸 required 时，无合格 spec 不能 submit_plan
- [ ] Issue 评论含摘要或 Artifact 深链，无完整日志双写
- [ ] 契约测试覆盖 kind / version 约束

## 八、依赖

- 上游：Agent Runtime / TIP、Dispatch
- 下游：Dashboard 详情、Sync（comment）、Notifier（摘要字段）
