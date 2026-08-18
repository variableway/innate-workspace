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
} from "cursor/canvas";

export default function VibeKanbanWayComparison() {
  return (
    <Stack gap={24} style={{ padding: 24, maxWidth: 1120 }}>
      <Stack gap={8}>
        <H1>vibe-kanban × kanban-way × 本项目</H1>
        <Text tone="secondary">
          vibe-kanban 是编码 Agent 的执行与审 diff
          壳；kanban-way 是分层标本库；本仓库是 GitHub Issue
          为状态 SoT 的多仓编排层。按层借能力，不合成巨无霸。
        </Text>
        <Row gap={8} style={{ flexWrap: "wrap" }}>
          <Pill tone="warning" size="sm">
            vibe: 公司已关停 / 本地仍可用
          </Pill>
          <Pill tone="info" size="sm">
            kanban-way: 2026-07 已有 AKP/VK 分析
          </Pill>
          <Pill tone="neutral" size="sm">
            我们: 契约先行 / 运行时未齐
          </Pill>
        </Row>
      </Stack>

      <Grid columns={3} gap={12}>
        <Stat value="执行壳" label="vibe-kanban 主价值" tone="info" />
        <Stat value="分层标本" label="kanban-way 主价值" />
        <Stat value="编排层" label="本项目应守住" tone="success" />
      </Grid>

      <Callout tone="info" title="定位差一句话">
        vibe 优化「开 workspace、看 diff、开 PR」；AKP/VK
        优化「本地看板 + 可选 Agent」；我们优化「跨仓 Issue
        状态同步 + 过闸账本 + 异构 Agent 信封」。执行隔离（worktree）三者都能教我们，但 SoT
        不能跟 vibe 走私有看板。
      </Callout>

      <Divider />

      <H2>六项需求对照</H2>
      <Text tone="secondary" size="small">
        来源：vibe README/docs（2026-08）、kanban-way analysis、本仓库
        modules。非运行时实测。
      </Text>
      <Spacer height={8} />
      <Table
        headers={["需求", "vibe-kanban", "AKP / VK", "本项目"]}
        rows={[
          [
            "GitHub Issue 同步",
            "弱（偏 PR，云 Issue 已随关停消失）",
            "VK 强双向；AKP 仅贡献同步",
            "设计目标 / M1",
          ],
          [
            "多 Agent 分配",
            "强：10+ CLI 适配器 + 并行 workspace",
            "AKP 7 角色 spawn；VK registry+route",
            "Label 路由已设计，未 spawn",
          ],
          [
            "执行文档留存",
            "弱：会话与 diff，非 plan 账本",
            "AKP STATUS.md；VK deliverable/frontmatter",
            "Artifact + 闸（文档已写）",
          ],
          [
            "计划/分配可视化",
            "强：板 + workspace UI + 预览",
            "VK SPA 完整；AKP Jinja 板",
            "四列有；swimlane/依赖未做",
          ],
          [
            "任务交互协议",
            "无统一信封（并行会话）",
            "AKP=MCP 工具即协议；VK=hooks+REST",
            "TIP + bootstrap",
          ],
          [
            "IM 推送",
            "无",
            "VK webhook/Teams",
            "Notifier 设计",
          ],
        ]}
      />

      <Divider />

      <H2>vibe-kanban：借与不借</H2>
      <Grid columns={2} gap={16}>
        <Card>
          <CardHeader>应吸收</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Text>
                Assignment 落地为 Workspace：worktree + 分支 + 终端，限制爆炸半径。
              </Text>
              <Text>
                Agent 可替换：看板不绑死某一个 CLI。
              </Text>
              <Text>
                in_review 要能看 diff、把行内意见打回 Agent（人机面）。
              </Text>
              <Text>
                人的 WIP 在「待审」，不是禁止并行 Agent。
              </Text>
            </Stack>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>应拒绝</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Text>
                私有云 Issue 当 SoT（云能力已下线，路径已验证失败）。
              </Text>
              <Text>
                M1 就做内嵌预览 / devtools / 编码 IDE。
              </Text>
              <Text>
                无 TIP、无闸地狂开并行会话。
              </Text>
              <Text>
                把本项目做成 vibe 的功能追随（创始团队已说拼不过实验室编排器）。
              </Text>
            </Stack>
          </CardBody>
        </Card>
      </Grid>

      <Divider />

      <H2>kanban-way 分层（不要平铺参考）</H2>
      <Table
        headers={["层", "目录", "对我们"]}
        rows={[
          [
            "Agent 运行时",
            "agent-kanban-pm",
            "MCP 薄内核、STATUS.md 交接、tmux/worktree spawn",
          ],
          [
            "看板产品 + 可选编排",
            "veritas-kanban",
            "Issue 同步、transition hooks≈闸、文件账本、体量勿搬",
          ],
          [
            "规格驱动",
            "spec-kit / BMAD / task-master",
            "对齐 Spec→Plan→Code，不替代看板",
          ],
          [
            "通用 PM",
            "plane / kaneo",
            "不要做成 Plane；看板保持瘦",
          ],
          [
            "知识 / 记忆 / 上下文",
            "AFFiNE, siyuan, letta, mem0, context7, repomix",
            "非核心；implement 阶段可当领域 Skill",
          ],
        ]}
      />

      <Callout tone="warning" title="已有分析的用途差">
        kanban-way/analysis 是给 innate-capture（Go CLI
        文件优先）抽模型的。本项目 SoT 是 GitHub
        Issue，过程才是 Artifact。VK 的文件任务可以当 Artifact
        镜像，不能当状态主源。
      </Callout>

      <Divider />

      <H2>对当前 BOARD 的含义</H2>
      <Text>
        不插入新的「先抄 vibe」卡。顺序仍是 AK-001 同步地基 → 契约/Artifact/闸 →
        TIP。vibe/AKP 的 worktree 作为 AK-006 Runtime Adapter 的实现选项写入 Plan，而不是另起产品线。
      </Text>
      <Spacer height={12} />
      <Grid columns={3} gap={12}>
        <Stack gap={6}>
          <H3>M1 仍先做</H3>
          <Text size="small">Issue ↔ 四列。vibe 几乎不覆盖这条。</Text>
        </Stack>
        <Stack gap={6}>
          <H3>闸对齐 VK / spec-kit</H3>
          <Text size="small">require-plan ≈ submit_plan；不要学 vibe 先写再审当唯一闸。</Text>
        </Stack>
        <Stack gap={6}>
          <H3>M3/M4 才碰壳</H3>
          <Text size="small">worktree spawn + diff 回评；Notifier 看 VK webhook。</Text>
        </Stack>
      </Grid>

      <Callout tone="success" title="模块借力">
        sync←VK Issues；gates/artifact←VK hooks + AKP STATUS.md；runtime←vibe
        workspace + AKP launcher；protocol 仍用我们的 TIP，不改成「只 MCP」或「无信封」。
      </Callout>
    </Stack>
  );
}
