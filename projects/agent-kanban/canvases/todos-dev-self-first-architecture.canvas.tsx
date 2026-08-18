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
  Stack,
  Stat,
  Table,
  Text,
  computeDAGLayout,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

type Tab = "map" | "layers" | "loop" | "slices";

const TABS: { id: Tab; label: string }[] = [
  { id: "map", label: "概念对照" },
  { id: "layers", label: "四层架构" },
  { id: "loop", label: "工作回路" },
  { id: "slices", label: "自用切片" },
];

export default function TodosDevSelfFirstArchitecture() {
  const [tab, setTab] = useCanvasState<Tab>("todosArchTab", "map");

  return (
    <Stack gap={24} style={{ padding: 24, maxWidth: 1120 }}>
      <Stack gap={8}>
        <H1>Todos.dev → Agent Kanban 自用架构</H1>
        <Text tone="secondary">
          Todos 是云上的人机工作区：控制面在网站，执行面在你的机器。Agent
          Kanban 先不当云服务——从看板出发，补上 Workflow 配方、多仓
          registry、以及可远程认领任务的 Worker。完整说明见仓内
          shared-context/self-first-architecture.md。对照来源：todos.dev/docs
        </Text>
        <Row gap={8} wrap>
          <Pill active size="sm">
            看板是家
          </Pill>
          <Pill size="sm">GitHub 改为可选同步</Pill>
          <Pill size="sm">Agent ≠ Machine</Pill>
          <Pill size="sm">不做 Chief / 托管 Git / 平台机器</Pill>
        </Row>
      </Stack>

      <Grid columns={4} gap={12}>
        <Stat value="偷 6" label="运转原则留下" tone="success" />
        <Stat value="改 5" label="按自用收缩" tone="info" />
        <Stat value="跳过 10+" label="云产品能力" tone="warning" />
        <Stat value="1" label="新运行时：Worker" />
      </Grid>

      <Callout tone="info" title="一句话定位">
        编排在看板，思考在 Agent，执行在 Worker。四列给人扫板；闸与 stage
        给人审；GitHub 只是某个 Project 的可选镜像，不再是系统身份。
      </Callout>

      <Row gap={8} wrap>
        {TABS.map((t) => (
          <Pill key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </Pill>
        ))}
      </Row>

      {tab === "map" ? <ConceptMap /> : null}
      {tab === "layers" ? <LayerView /> : null}
      {tab === "loop" ? <LoopView /> : null}
      {tab === "slices" ? <SliceView /> : null}

      <Divider />
      <Text tone="tertiary" size="small">
        Source: todos.dev/docs · Agent Kanban shared-context · 2026-08-18
      </Text>
    </Stack>
  );
}

function ConceptMap() {
  return (
    <Stack gap={16}>
      <H2>Todos 概念 → 我们怎么接</H2>
      <Text tone="secondary" size="small">
        行色：留下并实现 / 收缩后用 / 自用阶段不做。
      </Text>
      <Table
        headers={["Todos", "Agent Kanban", "策略"]}
        columnAlign={["left", "left", "left"]}
        striped
        rowTone={[
          "success",
          "success",
          "info",
          "info",
          "success",
          "warning",
          "info",
          "success",
          "info",
          "warning",
          "success",
          "warning",
        ]}
        rows={[
          ["Team", "Workspace", "一个就够，不做席位"],
          ["Project = git 仓", "Project + local_path", "路径必填；GitHub 可选"],
          ["Todo = 对话", "Task = 看板卡", "对话留在 Cursor 等 Adapter"],
          ["9 个 Phase", "4 列 + assignment.stage", "Planning/Building 都进进行中"],
          ["Confirm / Review", "gate plan / code", "已有 PLAYBOOK，直接对齐"],
          ["Chief", "暂不产品化", "需要时 = groom Agent + charter.md"],
          ["Build / Run", "Assignment", "重跑 = 新 Assignment，不加 Run 表"],
          ["Machine + tds", "Worker（新）", "认领 run、worktree、调 Adapter"],
          ["Skill 库", "仓内 SKILL.md", "不建团队技能 SaaS"],
          ["Memory / Schedule", "AGENTS.md / cron", "先文件，后产品"],
          ["Plan / Changes 文档", "artifact + kind=diff", "版本化，不堆进 Issue"],
          ["Platform machine", "你的电脑", "不做沙箱计费"],
        ]}
      />

      <H3>从 Todos 留下的六条运转原则</H3>
      <Grid columns={2} gap={12}>
        <Card>
          <CardHeader>人只在两道闸出现</CardHeader>
          <CardBody>
            <Text>
              Confirm 在动代码前，Review 在收工后。Queued / Planning /
              Building 对扫板的人是同一件事：在跑。
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>对话不是持久化层</CardHeader>
          <CardBody>
            <Text>
              规格、计划、diff、闸决定进 Artifact。Cursor
              会话可丢；下一张卡或下一个 Agent 不靠翻聊天。
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Agent ≠ Machine ≠ Repo</CardHeader>
          <CardBody>
            <Text>
              Agent 是角色与模型；Worker 提供 CPU 与 worktree；Repo
              属于 Project。三者拆开，多仓和远程才有落点。
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>控制面与执行面分离</CardHeader>
          <CardBody>
            <Text>
              看板进程只编排。没有在线 Worker 就停在 backlog / 排队，而不是假装
              Agent 自己能改文件。
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>产物是版本化文档</CardHeader>
          <CardBody>
            <Text>
              计划改一版是新 version，不是再刷一条消息。complete 必须带
              summary；有代码则带 diff。
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>权限用开关，不用大盘</CardHeader>
          <CardBody>
            <Text>
              Worker 可关 builds；Agent 可关 push。自用不做
              RBAC。远程 shell 不单独做——Worker 在哪台，就在哪台执行。
            </Text>
          </CardBody>
        </Card>
      </Grid>
    </Stack>
  );
}

function LayerView() {
  const theme = useHostTheme();
  const layers: {
    id: string;
    title: string;
    items: string;
    note: string;
  }[] = [
    {
      id: "L0",
      title: "Surfaces",
      items: "Kanban 家界面 · 闸详情 · ak CLI · 后期 MCP 入站",
      note: "先 Web + CLI，不做 App / 推送",
    },
    {
      id: "L1",
      title: "Control plane",
      items: "Board · Workflow 配方 · Repo registry · Inbox 过滤 · Dispatch（Agent 槽 × Worker 槽）· Artifact/Gates · 可选 GitHub Sync",
      note: "现有 backend-* 单进程 + SQLite",
    },
    {
      id: "L2",
      title: "Protocol",
      items: "TIP 信封 · Bootstrap · kanban://workflow/<id>",
      note: "看板不绑死某一种 Agent 产品",
    },
    {
      id: "L3",
      title: "Execution",
      items: "L3a Agent Adapter（思考）  ·  L3b Worker（跑：心跳、worktree、回收 diff）",
      note: "唯一新模块是 Worker",
    },
  ];

  return (
    <Stack gap={16}>
      <H2>模块分层</H2>
      <Text tone="secondary" size="small">
        现有 modules/ 大多落在 L1–L2。缺口是 L3b：今天 concurrency 挂在
        Agent 上，却没有「哪台电脑在跑」。
      </Text>

      <Stack gap={8}>
        {layers.map((layer, i) => (
          <Row
            key={layer.id}
            gap={16}
            align="center"
            style={{
              padding: "12px 16px",
              border: `1px solid ${theme.stroke.secondary}`,
              background: i === 3 ? theme.fill.tertiary : theme.bg.elevated,
            }}
          >
            <Text
              weight="semibold"
              style={{ width: 36, color: theme.accent.primary }}
            >
              {layer.id}
            </Text>
            <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
              <Text weight="semibold">{layer.title}</Text>
              <Text size="small">{layer.items}</Text>
              <Text size="small" tone="tertiary">
                {layer.note}
              </Text>
            </Stack>
          </Row>
        ))}
        <Row
          gap={16}
          align="center"
          style={{
            padding: "12px 16px",
            border: `1px solid ${theme.stroke.tertiary}`,
          }}
        >
          <Text weight="semibold" style={{ width: 36 }} tone="secondary">
            L4
          </Text>
          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Text weight="semibold">Data</Text>
            <Text size="small">
              SQLite = 操作 SoT（列 / 闸 / Assignment / Artifact）· Git 仓 =
              代码 SoT · GitHub = 可选镜像
            </Text>
          </Stack>
        </Row>
      </Stack>

      <H3>现有模块怎么落层</H3>
      <Table
        headers={["模块", "层", "自用阶段改动"]}
        striped
        rows={[
          ["dashboard", "L0", "加「等我」过滤与 Project 切换；swimlane 后置"],
          ["task-orchestrator", "L1", "允许 Task 无 issue_number"],
          ["review-gates", "L1", "配方决定开哪几道闸；run-now = skip plan"],
          ["artifact-store", "L1", "增加 kind=diff"],
          ["dispatch-scheduler", "L1", "并发过 Agent 与 Worker 两道门"],
          ["sync-engine", "L1", "未接 GitHub 的 Project 直接跳过"],
          ["agent-protocol / runtime", "L2 / L3a", "Runtime 不再假设 Agent 自带机器"],
          ["notifier", "L1", "M4；自用可缺"],
          ["worker（新）", "L3b", "注册、心跳、claim、worktree、调 Adapter"],
        ]}
      />
    </Stack>
  );
}

function LoopView() {
  const theme = useHostTheme();
  const layout = computeDAGLayout({
    direction: "horizontal",
    nodeWidth: 108,
    nodeHeight: 40,
    rankGap: 36,
    nodeGap: 20,
    padding: 12,
    nodes: [
      { id: "file" },
      { id: "plan" },
      { id: "confirm" },
      { id: "build" },
      { id: "review" },
      { id: "done" },
    ],
    edges: [
      { from: "file", to: "plan" },
      { from: "plan", to: "confirm" },
      { from: "confirm", to: "build" },
      { from: "build", to: "review" },
      { from: "review", to: "done" },
    ],
  });

  const labels: Record<string, string> = {
    file: "建卡",
    plan: "写计划",
    confirm: "人批计划",
    build: "改代码",
    review: "人审 diff",
    done: "Done",
  };
  const gate = new Set(["confirm", "review"]);

  return (
    <Stack gap={16}>
      <H2>从 Todos 抄来的回路（映射到四列）</H2>
      <Text tone="secondary" size="small">
        高亮两步是人闸。run-now 配方跳过「写计划 / 人批计划」，直接建卡 →
        改代码。Queued 不单独成列：没有在线 Worker 时卡片停在 backlog 并标排队。
      </Text>

      <svg
        width="100%"
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="img"
        aria-label="建卡到 Done 的计划-构建回路"
      >
        {layout.edges.map((e) => (
          <line
            key={`${e.from}-${e.to}`}
            x1={e.sourceX}
            y1={e.sourceY}
            x2={e.targetX}
            y2={e.targetY}
            stroke={theme.stroke.secondary}
            strokeWidth={1.5}
          />
        ))}
        {layout.nodes.map((n) => {
          const isGate = gate.has(n.id);
          return (
            <g key={n.id}>
              <rect
                x={n.x}
                y={n.y}
                width={108}
                height={40}
                rx={4}
                fill={isGate ? theme.fill.tertiary : theme.bg.elevated}
                stroke={isGate ? theme.accent.primary : theme.stroke.primary}
                strokeWidth={isGate ? 1.5 : 1}
              />
              <text
                x={n.x + 54}
                y={n.y + 25}
                textAnchor="middle"
                fill={theme.text.primary}
                fontSize={12}
              >
                {labels[n.id]}
              </text>
            </g>
          );
        })}
      </svg>
      <Text tone="tertiary" size="small">
        回路示意 · 人闸用强调描边 · 看板列：建卡=backlog；写计划到改代码=in_progress；人审
        diff=in_review；Done=done
      </Text>

      <Grid columns={3} gap={12}>
        <Stack gap={6}>
          <H3>多仓</H3>
          <Text size="small">
            Workspace 聚合多个 Project。每个 Project 一个
            local_path。跨仓用已有 task_edge，子卡自带 project_id。Worker
            只认路径，不在控制面存代码。
          </Text>
        </Stack>
        <Stack gap={6}>
          <H3>Workflow</H3>
          <Text size="small">
            配方不是引擎：plan-then-build、run-now、verify-only
            只是闸的开关组合。领域玩法继续用仓内 Skill，不在看板里画 BPMN。
          </Text>
        </Stack>
        <Stack gap={6}>
          <H3>远程</H3>
          <Text size="small">
            档 0 同机 Worker；档 1 Tailscale 上另一台
            ak worker；档 2 才做 MCP 入站。远程 = 任务在已上线的那台机器上跑。
          </Text>
        </Stack>
      </Grid>
    </Stack>
  );
}

function SliceView() {
  return (
    <Stack gap={16}>
      <H2>自用切片（插在 M1–M4 上，不重开产品线）</H2>
      <Text tone="secondary" size="small">
        地基仍是 AK-001。唯一结构性插入是 S2 的同机
        Worker——没有它，多仓和远程都没有执行落点。
      </Text>
      <Table
        headers={["切片", "做什么", "刻意不做", "卡住哪"]}
        striped
        rowTone={["info", "info", "success", undefined, undefined, undefined]}
        rows={[
          [
            "S0 家可用",
            "四列闭环；本地卡可无 GitHub",
            "IM、依赖图",
            "AK-001",
          ],
          [
            "S1 过程可回放",
            "Artifact 时间线 + Plan 闸",
            "聊天同步进看板",
            "AK-002…005",
          ],
          [
            "S2 本机跑起来",
            "TIP 最小闭环 + 同机 Worker + worktree",
            "沙箱、密钥下发",
            "AK-006/007 + Worker 新卡",
          ],
          [
            "S3 多仓",
            "local_path、聚合过滤、跨仓 edge",
            "自建 Git hosting",
            "新卡，自动化依赖 S2",
          ],
          [
            "S4 配方",
            "run-now / verify-only",
            "工作流编辑器",
            "小卡，改配置",
          ],
          [
            "S5 远程",
            "异机 Worker，再 MCP 入站",
            "平台机器、PWA、remote shell 产品",
            "新卡，勿抢 IM",
          ],
        ]}
      />

      <Callout tone="warning" title="过早产品化的边界">
        在自己每天都用到之前，不准变成表和页面：Chief、Memory
        上限、Schedule 配额、托管 Git、计费、移动端、Proposal
        卡片。需要判断时写 charter.md；需要定时时用 cron + CLI。
      </Callout>
    </Stack>
  );
}
