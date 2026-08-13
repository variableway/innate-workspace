import {
  Callout,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Pill,
  Row,
  Spacer,
  Stack,
  Stat,
  Table,
  Text,
  useHostTheme,
} from "cursor/canvas";

type Coverage = "strong" | "partial" | "gap";

const coverageTone = (c: Coverage) =>
  c === "strong" ? "success" : c === "partial" ? "warning" : "danger";

const coverageLabel = (c: Coverage) =>
  c === "strong" ? "已覆盖" : c === "partial" ? "部分覆盖" : "缺口";

export default function RequirementsGapAnalysis() {
  const theme = useHostTheme();

  return (
    <Stack gap={24} style={{ padding: 24, maxWidth: 1100 }}>
      <Stack gap={8}>
        <H1>Agent Kanban 需求分析</H1>
        <Text tone="secondary">
          对照当前仓库设计与实现、Backlog.md 参考模型，以及你提出的 6
          项能力要求。结论：骨架已齐（GitHub 同步 + 多 Agent
          分配 + 4 列看板），但「执行文档留存」「多 Agent
          协作协议」「IM 推送」仍是明确缺口。
        </Text>
        <Row gap={8} style={{ flexWrap: "wrap" }}>
          <Pill tone="info" size="sm">
            参考: Backlog.md
          </Pill>
          <Pill tone="neutral" size="sm">
            SoT 方向: GitHub Issues
          </Pill>
          <Pill tone="neutral" size="sm">
            现状: 契约完备 / 运行时未齐
          </Pill>
        </Row>
      </Stack>

      <Grid columns={4} gap={12}>
        <Stat value="6" label="核心需求项" />
        <Stat value="2" label="已较强覆盖" tone="success" />
        <Stat value="2" label="部分覆盖" tone="warning" />
        <Stat value="2" label="明显缺口" tone="danger" />
      </Grid>

      <Callout tone="info" title="一句话定位">
        Agent Kanban 应做成「GitHub Issues 为真相源的多 Agent
        编排层」：看板负责可视化与调度，Markdown/Artifacts
        负责执行留痕（借 Backlog.md），协议层负责多 Agent
        交接，通知层负责 IM 出口——而不是再造一套独立任务系统。
      </Callout>

      <Divider />

      <H2>需求覆盖矩阵</H2>
      <Text tone="secondary" size="small">
        基于 docs/、modules/、shared-context/ 与现有 schema；非运行时实测。
      </Text>
      <Spacer height={8} />
      <Table
        headers={["需求", "覆盖", "现状", "建议方向"]}
        columnAlign={["left", "left", "left", "left"]}
        rows={[
          [
            "1. GitHub Issue 完全同步",
            coverageLabel("strong"),
            "Webhook + 轮询 + status:* label 优先级栈已设计；schema/events 齐备",
            "补冲突策略可视化；写回失败重试与审计",
          ],
          [
            "2. 分配给不同 AI Agent",
            coverageLabel("strong"),
            "Label→capability_tags 匹配 + Assignment + 并发控制",
            "抽象 Agent Adapter，不绑死 WorkBuddy",
          ],
          [
            "3. 执行过程文档留存",
            coverageLabel("gap"),
            "仅有 result_summary + audit_log + Issue comment",
            "引入 Artifact/RunLog（plan/notes/summary）可版本化",
          ],
          [
            "4. 计划与分配可视化",
            coverageLabel("partial"),
            "4 列看板 + 详情面板设计；计划/依赖图未建",
            "计划视图 + Agent 负载 + 依赖/里程碑",
          ],
          [
            "5. 多 Agent 协作协议",
            coverageLabel("gap"),
            "单任务单 Agent 假设；无 handoff/子任务协议",
            "定义 Task Interaction Protocol (TIP)",
          ],
          [
            "6. 完成信息推送到 IM",
            coverageLabel("partial"),
            "kanban_webhook_subscription 表存在；无渠道适配器",
            "Notification Router → Slack/飞书/钉钉/企业微信",
          ],
        ].map((r, i) => {
          const cov = (
            ["strong", "strong", "gap", "partial", "gap", "partial"] as Coverage[]
          )[i];
          return [
            r[0],
            <Pill key={i} tone={coverageTone(cov)} size="sm">
              {r[1]}
            </Pill>,
            r[2],
            r[3],
          ];
        })}
        rowTone={[
          "success",
          "success",
          "danger",
          "warning",
          "danger",
          "warning",
        ]}
      />

      <Divider />

      <H2>与 Backlog.md 的取舍</H2>
      <Text tone="secondary">
        Backlog.md 强在「人审三关 + Markdown 永久账本」；Agent Kanban
        强在「跨仓 GitHub 同步 + 多 Agent 调度」。建议杂交，而非二选一。
      </Text>
      <Spacer height={12} />
      <Grid columns={2} gap={16}>
        <Card>
          <CardHeader>从 Backlog.md 应吸收</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Text>
                Spec → Plan → Code 三关审查：任务落地前先写计划，再执行。
              </Text>
              <Text>
                任务级 Markdown 账本：描述、AC、计划、评论、最终摘要进 Git。
              </Text>
              <Text>
                Agent 指令入口：AGENTS.md / MCP / CLI，降低接入成本。
              </Text>
              <Text>
                一任务一上下文窗口：利于拆分、可审 PR、可复跑。
              </Text>
            </Stack>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>当前项目应坚持</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Text>
                GitHub Issues 作为跨项目 SoT（Backlog.md 是仓内 Markdown
                SoT）。
              </Text>
              <Text>
                Label 路由 + Assignment 调度多模型/多 Agent。
              </Text>
              <Text>跨 Repo 统一看板与 WIP（in_review 人工闸）。</Text>
              <Text>
                双后端契约（docs/）与事件驱动内部总线。
              </Text>
            </Stack>
          </CardBody>
        </Card>
      </Grid>

      <Callout tone="warning" title="SoT 冲突点（需先拍板）">
        若「完全同步 GitHub」与「Markdown 永久留存」并存：建议 Issue =
        任务状态真相源；Artifact（plan/notes/run）=
        执行过程真相源，挂载到 Issue（comment/PR
        body/附件链接），本地 SQLite 只做索引与聚合。
      </Callout>

      <Divider />

      <H2>目标架构（能力层）</H2>
      <Table
        headers={["层", "职责", "关键产出"]}
        rows={[
          [
            "Portal",
            "看板 / Agent 负载 / 计划与依赖视图 / CLI·MCP",
            "可视化计划与分配",
          ],
          [
            "Sync Engine",
            "双向同步 Issue ↔ Task；冲突按优先级栈",
            "GitHub 完全可同步",
          ],
          [
            "Orchestrator",
            "状态机、标签路由、优先级、子任务分解",
            "可分配、可拆分",
          ],
          [
            "Dispatch",
            "Assignment、并发、重试、超时、handoff 队列",
            "多 Agent 调度",
          ],
          [
            "Agent Runtime + TIP",
            "统一 claim/progress/artifact/complete 协议",
            "异构 Agent 可协作",
          ],
          [
            "Artifact Store",
            "plan / notes / logs / summary 版本化留存",
            "执行文档可追溯",
          ],
          [
            "Notifier",
            "事件 → 渠道模板 → Slack/飞书/钉钉/企业微信",
            "完成信息可达 IM",
          ],
        ]}
      />

      <Divider />

      <H2>建议优先补齐的三个缺口</H2>
      <Grid columns={3} gap={16}>
        <Card variant="outlined">
          <CardHeader trailing={<Pill tone="danger" size="sm">P0</Pill>}>
            Artifact / 执行账本
          </CardHeader>
          <CardBody>
            <Stack gap={6}>
              <H3 style={{ color: theme.tokens.text.primary }}>模型</H3>
              <Text size="small">
                assignment_id → artifacts[]（kind: plan | note | log |
                summary | decision）
              </Text>
              <H3 style={{ color: theme.tokens.text.primary }}>同步</H3>
              <Text size="small">
                写回 Issue comment 或 PR description；可选镜像到仓内
                docs/runs/
              </Text>
              <H3 style={{ color: theme.tokens.text.primary }}>UI</H3>
              <Text size="small">
                任务详情展示时间线：计划 → 执行步骤 → 摘要
              </Text>
            </Stack>
          </CardBody>
        </Card>
        <Card variant="outlined">
          <CardHeader trailing={<Pill tone="danger" size="sm">P0</Pill>}>
            Task Interaction Protocol
          </CardHeader>
          <CardBody>
            <Stack gap={6}>
              <H3 style={{ color: theme.tokens.text.primary }}>消息</H3>
              <Text size="small">
                claim / heartbeat / progress / ask_human / handoff /
                complete / fail
              </Text>
              <H3 style={{ color: theme.tokens.text.primary }}>协作</H3>
              <Text size="small">
                子任务树 + handoff(from,to,context_ref)；禁止隐式抢占
              </Text>
              <H3 style={{ color: theme.tokens.text.primary }}>接入</H3>
              <Text size="small">
                HTTP webhook + CLI + MCP 三种 Adapter，统一信封格式
              </Text>
            </Stack>
          </CardBody>
        </Card>
        <Card variant="outlined">
          <CardHeader trailing={<Pill tone="warning" size="sm">P1</Pill>}>
            Notification Router
          </CardHeader>
          <CardBody>
            <Stack gap={6}>
              <H3 style={{ color: theme.tokens.text.primary }}>触发</H3>
              <Text size="small">
                assignment.completed / failed / in_review / overdue
              </Text>
              <H3 style={{ color: theme.tokens.text.primary }}>渠道</H3>
              <Text size="small">
                复用 webhook_subscription，加 channel_type + 模板
              </Text>
              <H3 style={{ color: theme.tokens.text.primary }}>内容</H3>
              <Text size="small">
                标题、Agent、耗时、摘要链接、GitHub URL
              </Text>
            </Stack>
          </CardBody>
        </Card>
      </Grid>

      <Divider />

      <H2>可视化：计划与分配应看到什么</H2>
      <Grid columns={2} gap={16}>
        <Stack gap={8}>
          <H3>已有 / 接近</H3>
          <Text>• 4 列：backlog → in_progress → in_review → done</Text>
          <Text>• 卡片：labels、Agent、项目、状态</Text>
          <Text>• 筛选：project / agent / label</Text>
          <Text>• WIP 限制（进行中 ≤5，审核 ≤3）</Text>
        </Stack>
        <Stack gap={8}>
          <H3>建议新增</H3>
          <Text>• Agent Swimlane：按执行体看负载与排队</Text>
          <Text>• Plan Panel：展示 artifact.plan + AC 勾选</Text>
          <Text>• Dependency Graph：父子任务 / blocked-by</Text>
          <Text>• Assignment Timeline：自动/手动分配与重试轨迹</Text>
        </Stack>
      </Grid>

      <Divider />

      <H2>推荐落地顺序</H2>
      <Table
        headers={["阶段", "目标", "验收"]}
        rows={[
          [
            "M1 巩固同步与看板",
            "Webhook/轮询/写回闭环 + 4 列拖拽真实可用",
            "Issue 改 label/关闭 → 看板一致；拖拽回写 label",
          ],
          [
            "M2 Artifact 留存",
            "plan/notes/summary + 详情时间线 + Issue 回写",
            "任意完成任务可复盘完整执行文档",
          ],
          [
            "M3 TIP + 多 Agent",
            "统一协议 + handoff + 子任务；Adapter 抽离 WorkBuddy",
            "两异构 Agent 可串行交接同一父任务",
          ],
          [
            "M4 Notifier + 可视化增强",
            "IM 渠道适配 + Swimlane/依赖图",
            "完成事件到达 ≥2 种 IM；计划与分配可一眼看懂",
          ],
        ]}
      />

      <Callout tone="success" title="文档与计划已更新（2026-08-13）">
        已写入双 SoT 架构、三份新 PRD、schema/events/types
        扩展，以及 suggestion/08-requirements-aligned-plan.md（M1–M4）。
        Spec→Plan→Code 已拆成审查闸协议：modules/review-gates.md。
        下一工程门闩：补 openapi 路径与双后端迁移。
      </Callout>

      <Divider />

      <H2>Spec → Plan → Code：要不要 Skill、怎么拆、协议归谁</H2>
      <Text tone="secondary">
        口头三关给人看；协议拆成 stage。指令入口（AGENTS.md / MCP）由 Adapter
        写短指针，Kanban 只发 Bootstrap 信封。
      </Text>
      <Spacer height={8} />
      <Table
        headers={["产品关", "协议阶段 / 闸", "协议 Skill", "关键 TIP"]}
        rows={[
          [
            "1. Spec",
            "intake → wait_spec（或 skipped）",
            "kanban.intake",
            "submit_spec / ask_human",
          ],
          [
            "2. Plan",
            "plan → wait_plan（写完即停）",
            "kanban.plan",
            "submit_plan → 人批后 resume",
          ],
          [
            "3. Code（实现）",
            "implement → 可选 verify",
            "kanban.implement / verify / finalize",
            "progress · handoff · complete",
          ],
          [
            "3. Code（人审）",
            "列 in_review = gate=code",
            "无（人）",
            "complete 之后，不经 TIP 自批 done",
          ],
        ]}
      />
      <Spacer height={12} />
      <Grid columns={2} gap={16}>
        <Card>
          <CardHeader>需要的 Skill（两层）</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Text>
                协议 Skill：intake / plan / implement / verify /
                finalize。过闸只认 TIP+Artifact+gate，不认 SKILL.md 路径。
              </Text>
              <Text>
                领域 Skill：git-pr、react 等，仅 implement 之后可用；wait_plan
                列入 forbidden_until_plan_approved。
              </Text>
            </Stack>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>指令入口的协议</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Text>
                Adapter 拥有 AGENTS.md / MCP 安装；只注入
                kanban://workflow/overview。
              </Text>
              <Text>
                机器契约：GET /assignments/id/bootstrap
                （kanban-agent-bootstrap/v0.1）含
                required_first_tip 与当前闸状态。
              </Text>
            </Stack>
          </CardBody>
        </Card>
      </Grid>
    </Stack>
  );
}
