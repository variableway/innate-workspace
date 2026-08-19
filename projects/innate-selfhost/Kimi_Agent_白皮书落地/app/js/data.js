// 数据层 · window.RPT —— 唯一事实来源：pg-backend-comparison.agent.final.md（2026-08-16 核查）
// 所有关键数字携带来源锚点 K1–K41（见 js/sources.js）
window.RPT = (() => {

  const meta = {
    title: "PostgreSQL 系 AI 原生后端选型报告",
    date: "2026-08-16",
    version: "v1.0",
  };

  // ── 六维评分矩阵（5 方案 × 6 维，等权合计满分 30；§3.2 总表） ──
  const dims = [
    { id: "d1", name: "开发便利性", en: "DEV EXPERIENCE" },
    { id: "d2", name: "PG 原生度", en: "PG NATIVENESS" },
    { id: "d3", name: "可扩展性", en: "SCALABILITY" },
    { id: "d4", name: "模块不锁定", en: "NO LOCK-IN" },
    { id: "d5", name: "私有云可转化度", en: "PRIVATE-CLOUD READY" },
    { id: "d6", name: "周边生态", en: "ECOSYSTEM" },
  ];

  const matrix = [
    {
      id: "supa-hosted", name: "Supabase 托管版", short: "SUPA·托管", total: 19,
      verdict: "生态断层第一的行业基准，但锁定与计量成本真实存在",
      scores: [
        { d: "d1", v: 5, note: "开箱即用，Studio/CLI/文档最成熟", k: ["K1", "K22"] },
        { d: "d2", v: 4, note: "完整 PG 直连，但扩展清单随官方镜像走（PG17 弃用 TimescaleDB）", k: ["K3"] },
        { d: "d3", v: 4, note: "compute 升到 16XL、Supavisor 池化；功能扩展靠平台", k: ["K2"] },
        { d: "d4", v: 2, note: "迁出需重建 Auth/Storage/Realtime 整套周边栈", k: ["K1", "K2"] },
        { d: "d5", v: 1, note: "托管服务，按定义不可私有化", k: ["K1"] },
        { d: "d6", v: 5, note: "SDK/教程/人才/集成全面第一", k: ["K22"] },
      ],
    },
    {
      id: "supa-self", name: "Supabase 自托管版", short: "SUPA·自托管", total: 19,
      verdict: "共享生态但平台功能带不走，运维自担",
      scores: [
        { d: "d1", v: 3, note: "Studio 只是托管版功能子集，运维自担", k: ["K1"] },
        { d: "d2", v: 4, note: "同镜像，可自建镜像补扩展", k: ["K3"] },
        { d: "d3", v: 3, note: "同上但升级/备份无 runbook", k: ["K26"] },
        { d: "d4", v: 3, note: "组件开源但 8+ 服务耦合，平台功能带不走", k: ["K1"] },
        { d: "d5", v: 2, note: "服务多、密钥配置重，无现成 LPK", k: ["K26"] },
        { d: "d6", v: 4, note: "共享同一生态，自托管议题在社区跟进中（discussion #39820）", k: ["K1"] },
      ],
    },
    {
      id: "insforge", name: "InsForge", short: "INSFORGE", total: 21, hl: true,
      verdict: "Agent 操作面最完整的 BaaS，3 容器自托管",
      scores: [
        { d: "d1", v: 4, note: "MCP/CLI/diagnose 面向 agent 最顺手，但有密钥回退坑（#905）", k: ["K5", "K9"] },
        { d: "d2", v: 3, note: "PG15 偏旧、扩展保守、Realtime 用 Socket.IO 而非逻辑复制", k: ["K4"] },
        { d: "d3", v: 3, note: "3 容器轻量，Compute 仍 private preview", k: ["K6", "K8"] },
        { d: "d4", v: 4, note: "Apache-2.0 + PostgREST + 标准 PG，仅 OpenRouter 强绑定", k: ["K4", "K5"] },
        { d: "d5", v: 4, note: "仅 3 容器；密钥需显式化，OpenRouter 需替换", k: ["K4", "K9"] },
        { d: "d6", v: 3, note: "12.7k stars、日更提交，但社区与文档仍薄", k: ["K6"] },
      ],
    },
    {
      id: "nubase", name: "Nubase", short: "NUBASE", total: 14, neg: true,
      verdict: "620 stars 对 0 issues 信号异常，不宜生产",
      scores: [
        { d: "d1", v: 2, note: "一镜像起得来，但文档薄、fresh install 未验证", k: ["K10", "K11"] },
        { d: "d2", v: 3, note: "database-per-project 真 PG，但 REST 层是 Java 重写", k: ["K10", "K11"] },
        { d: "d3", v: 2, note: "无 HA/备份/Realtime，多租户连接池待压测", k: ["K10"] },
        { d: "d4", v: 3, note: "Apache-2.0、数据在 PG 可带走；Memory/AI Gateway 内置逻辑难替换", k: ["K10", "K11"] },
        { d: "d5", v: 3, note: "单镜像但 Java 栈资源占用与内部服务未拆分", k: ["K11"] },
        { d: "d6", v: 1, note: "620 stars、0 issues、无实质社区讨论——信号异常", k: ["K12"] },
      ],
    },
    {
      id: "combo", name: "开源组合栈", short: "组合栈", total: 25, top: true,
      verdict: "每层可替换、数据即物理库，唯一已落地私有云打包",
      scores: [
        { d: "d1", v: 2, note: "无统一控制台，拼装需工程能力", k: ["K19"] },
        { d: "d2", v: 5, note: "ParadeDB 发行版即完整 PG，扩展自选", k: ["K13", "K19"] },
        { d: "d3", v: 4, note: "每层独立扩，可上 TimescaleDB/Citus，但需自建", k: ["K17", "K19"] },
        { d: "d4", v: 5, note: "每层可独立替换，数据即 PG 物理库", k: ["K19"] },
        { d: "d5", v: 5, note: "已有完整 LPK + deploy.sh，唯一已落地", k: ["K20", "K21"] },
        { d: "d6", v: 4, note: "组件各自生态成熟，组合本身无统一社区", k: ["K19"] },
      ],
    },
  ];

  // ── 关键数字（方案卡小倍数面板；value 均可 drill） ──
  const keyNumbers = {
    stars: [
      { name: "Supabase", v: 92000, approx: true, label: "≈92k", k: "K22", note: "生态断层第一：教程/人才/集成全面第一" },
      { name: "InsForge", v: 12757, label: "12,757", k: "K6", note: "GitHub API 实测 2026-08-14；第三方旧文称 2.3k，以 API 为准" },
      { name: "Nubase", v: 620, label: "620", k: "K11", note: "620 stars 但 0 issues / 5 PR——社区信号异常", neg: true },
    ],
    price: [
      { name: "Supabase Pro", v: 25, unit: "$/月/组织", label: "$25", k: "K2", note: "2023-09 起按组织计费，含 $10 compute credit；另有 20+ 计量项" },
      { name: "InsForge Pro", v: 25, unit: "$/月", label: "$25", k: "K7", note: "100k MAU、8GB DB、含 $10 Compute 抵扣" },
      { name: "组合栈", v: 22, unit: "€/月", label: "€22", k: "K24", note: "4C8G VPS（Hetzner CX32），成本曲线是平的，容量上限即硬件上限" },
    ],
    version: [
      { name: "pg_search", v: "0.25.2", k: "K13", note: "AGPL-3.0；0.25.0 起 pgvector 为前置依赖；RDS 不支持、Neon 已禁用" },
      { name: "TimescaleDB", v: "2.29.1", k: "K17", note: "2026-08-04 发布；2.29.0 起移除 PG15 支持；Apache-2.0 + TSL 双轨" },
      { name: "InsForge", v: "v1.5.6", k: "K6", note: "Apache-2.0；~2,780 commits，每日多次提交" },
      { name: "Nubase", v: "v0.1.4", k: "K11", note: "2026-06-16 发布；Apache-2.0；106 commits / 10 contributors", neg: true },
    ],
  };

  // ── 规模分层（§4.4 速查表 + 升级触发条件） ──
  const tiers = [
    {
      id: "t1", name: "Tier 1 · 个人 / MVP", dau: "< 1 万 DAU",
      rec: "Supabase Free", alt: "InsForge 自托管（3 容器）/ PocketBase",
      avoid: "企业组件（Keycloak/Cerbos）、Nubase、自建 K8s",
      k: ["K22", "K23", "K25"],
    },
    {
      id: "t2", name: "Tier 2 · 中小 SaaS", dau: "1 万 – 10 万 DAU",
      rec: "三轴选边：省心 Supabase Pro / agent 流 InsForge Pro / 成本确定 €22 自管栈", alt: "三者互为次选",
      avoid: "Supabase 自托管当主力、过早 K8s",
      k: ["K2", "K7", "K24"],
    },
    {
      id: "t3", name: "Tier 3 · 企业级", dau: "> 10 万 DAU",
      rec: "自管 PG + Citus + Keycloak/Cerbos + K8s/Terraform", alt: "BaaS Enterprise 合约（审计外包路线）",
      avoid: "BaaS 标准托管版扛核心流量、PocketBase、Nubase",
      k: ["K23", "K27", "K28"],
    },
  ];

  // 成本曲线数据点（横轴 DAU 对数刻度；单位 $/月，€22≈$24 按报告口径画平线）
  const costCurves = {
    xLabel: "日活 DAU（对数刻度）",
    points: [1000, 5000, 10000, 30000, 100000, 300000, 1000000],
    series: [
      {
        id: "supa", name: "Supabase 托管（计量计费）", color: "ink",
        // 推演值：$25 入场 + 磁盘/出口/MAU 计量随规模线性恶化（§4.2 推演模型）
        derived: true,
        vals: [0, 25, 35, 95, 260, 700, 2100],
        note: "推演模型 [derived]：Pro $25 + 磁盘 $0.125/GB、出口 $0.09/GB、MAU 超 100K 后 $0.00325/MAU 的月度账单推演（K2/K39）",
      },
      {
        id: "insforge", name: "InsForge Pro", color: "blueSoft",
        derived: true,
        vals: [0, 0, 25, 25, 25, 75, 150],
        note: "推演模型 [derived]：Free 层 5 万 MAU、Pro $25 含 100k MAU（K7）；超量后按 Enterprise 档推演",
      },
      {
        id: "combo", name: "自管组合栈（€22 ≈ $24）", color: "red",
        vals: [24, 24, 24, 24, 24, 48, 96],
        note: "4C8G VPS €22/月可承载 1–10 万日活（K24）；10 万以上需升配/加机（推演上限）",
      },
    ],
  };

  // ── 应用类型（§5.5 汇总表） ──
  const apps = [
    {
      id: "crud", name: "CRUD 为主", en: "CRUD APPS",
      min: "PG + PostgREST（或 Hasura）+ Authentik JWT",
      upgrade: "InsForge（agent 生成 CRUD/迁移）；pREST/Hasura 联邦（多库路由）",
      avoid: "全量 BaaS 全家桶",
      k: ["K29", "K30", "K5"],
    },
    {
      id: "search", name: "Search 需求", en: "SEARCH",
      min: "PG tsvector + GIN（中文 +zhparser）",
      upgrade: "pg_search 0.25.2（BM25/混合搜索；自管 PG 专属）；ES/ClickHouse + CDC（百亿文档/跨地域分片）",
      avoid: "百万行级就上 ES 集群",
      k: ["K31", "K32"],
    },
    {
      id: "data", name: "Data-intensive / AI", en: "DATA-INTENSIVE",
      min: "ParadeDB 一镜像（PG + pgvector + pg_search）",
      upgrade: "DuckDB 嵌入 OLAP；pgai 自动 embedding；ClickHouse（TB 级/亚秒聚合 SLA）",
      avoid: "自建 ES + 向量库双管道",
      k: ["K31", "K33"],
    },
    {
      id: "fin", name: "金融交易数据", en: "FINANCIAL",
      min: "PG（OLTP + RLS + WAL 审计）+ TimescaleDB（行情/K 线）+ DuckDB（回测）",
      upgrade: "kdb+（TB 级 tick 毫秒回放）；ClickHouse（>10 万行/秒全市场行情）",
      avoid: "交易记录进非 ACID 存储",
      k: ["K17", "K32"],
    },
  ];

  // 金融三层价值栈（P8 2.5D value stack 数据）
  const finStack = [
    { layer: "LAYER 03", name: "回测与量化分析", tech: "DuckDB", note: "进程内列存、只读快照；策略迭代不动生产库", k: "K35", control: 1 },
    { layer: "LAYER 02", name: "行情与 K 线时序", tech: "TimescaleDB 2.29.1", note: "hypertable + 连续聚合 + 列压（TSL 高级功能）", k: "K17", control: 2, thesis: true },
    { layer: "LAYER 01", name: "OLTP 系统记录", tech: "PostgreSQL", note: "ACID + RLS 账户隔离 + WAL/PITR 可重放审计链", k: "K32", control: 3 },
  ];

  // ── SQLite × PG 三阶段演进（§6.4） ──
  const evolution = [
    {
      id: "s1", name: "阶段一 · 单机 local-first", scale: "单机",
      stack: "memweave 单文件（memory.db + Markdown 真相源），纯标准库即可运行",
      logic: "记忆逻辑在 Python（100–200 行）", logicPos: 0,
      trigger: "——", cost: "——", k: ["K34", "K36"],
    },
    {
      id: "s2", name: "阶段二 · 团队同步", scale: "多设备 / 小团队",
      stack: "memweave 端侧 × N + 应用层 UPSERT 汇聚进 PG + PostgREST 暴露只读 API",
      logic: "仍在端侧；PG 侧只做汇聚与授权检索", logicPos: 0.5,
      trigger: "出现第二个需要共享记忆的用户/Agent；合规要求留存；单机备份成为心病",
      cost: "低：UPSERT 脚本即迁移工具，Markdown 真相源不动", k: ["K34", "K35"],
    },
    {
      id: "s3", name: "阶段三 · 企业中枢", scale: "百万级条目 / 高 QPS",
      stack: "PG + pgvector + pgai 承接记忆逻辑（存储过程/pgai 任务），SQLite 退居端侧缓存与离线缓冲",
      logic: "下沉进 PG（PL/pgSQL + pgai 任务），端侧仅剩写入缓冲", logicPos: 1,
      trigger: "记忆条目 > 百万级或 QPS 超单机；需要跨租户治理/审计；端侧 embedding 质量成为瓶颈",
      cost: "中：schema 一次映射 + 逻辑重写为存储过程（语义不变）", k: ["K33", "K37"],
    },
  ];

  // ── 风险登记册（§7.1，12 行） ──
  const risks = [
    { id: "R1", plan: "InsForge", sev: "高", title: "密钥回退链", text: "ENCRYPTION_KEY 未设置时静默回退用 JWT_SECRET 加密全部 secrets（#905 已关闭确认行为，#1552 加固仍 open）；轮转 JWT_SECRET 将致 secrets 永久不可读", fix: "部署时显式设置独立 ENCRYPTION_KEY；私有云用 stable_secret；跟踪 #1552 合并状态", k: ["K9"] },
    { id: "R2", plan: "InsForge", sev: "中", title: "项目年轻、基准未复现", text: "repo 2025-07 创建、文档/社区薄、Compute 仍 private preview、MCPMark 基准为厂商自测未独立复现", fix: "限定原型与中小项目；关键路径自测；不把厂商基准写入容量规划", k: ["K6", "K8"] },
    { id: "R3", plan: "Nubase", sev: "高", title: "稚嫩且社区信号异常", text: "v0.1.4、开源两个月、620 stars 但 GitHub 0 issues / 5 PR、Reddit/HN/知乎零实质讨论——star 疑似主要来自营销导流", fix: "不作生产采用，仅作技术观察；试用须隔离网络、不放真实数据", k: ["K12"] },
    { id: "R4", plan: "Nubase", sev: "中", title: "MCP 安全面待评估", text: "skillsllm 安全扫描记录显示 README 曾被标记 3 处 secret-exfiltration 中危提示（状态 PASSED，未定性为恶意）", fix: "接入 MCP/agent 工具链前人工审计 prompts 与网络出口；凭据最小授权", k: ["K38"] },
    { id: "R5", plan: "Nubase", sev: "高", title: "无供应商背书", text: "无公司信息、无定价页（/pricing 返回 504）、无 Realtime/备份/PITR/HA/SSO；官方自警暴露公网前需审查管理端点", fix: "按无供应商背书对待：自建备份与监控，管理端点加网关鉴权", k: ["K10", "K11"] },
    { id: "R6", plan: "Supabase 托管", sev: "中", title: "计量成本不可预测", text: "20+ 计量项（磁盘 $0.125/GB、出口 $0.09/GB、MAU 超 100K 后 $0.00325/MAU、PITR $100/月 add-on），成本与纯 Postgres 不可直接对比", fix: "上线前用真实流量模型做月度账单推演；设用量告警；与 €22/月组合栈基准对账", k: ["K39"] },
    { id: "R7", plan: "Supabase 托管", sev: "中", title: "托管锁定", text: "备份/PITR、分支、高级指标、ETL、管理 API 为平台专属；迁出需重建 Auth/Storage/Realtime 整套周边栈", fix: "数据层坚持标准 SQL 与 pg_dump 可导出形态；周边栈接口封装；每年做退出成本测算", k: ["K1"] },
    { id: "R8", plan: "Supabase（两版）", sev: "低", title: "扩展决策随官方镜像走", text: "PG17 镜像已弃用 TimescaleDB（推荐 pg_partman + 原生分区）", fix: "依赖扩展前确认目标镜像清单；自托管可自建镜像补回但计入运维成本", k: ["K3"] },
    { id: "R9", plan: "ParadeDB pg_search", sev: "高（商用场景）", title: "AGPL-3.0 网络条款", text: "网络服务（SaaS）场景触发开源义务，且 AWS RDS 不支持安装", fix: "商用采购前法务确认 AGPL 义务或购买商业授权；可用 tsvector/lakebase_bm25 系方案替代", k: ["K40"] },
    { id: "R10", plan: "TimescaleDB", sev: "中", title: "TSL 双轨许可证", text: "连续聚合、列压、保留策略等高级功能在 TSL 下，自用免费但禁止作为托管 DBaaS 转售；2.29.0 起移除 PG15 支持", fix: "逐功能核对 Apache/TSL 归属（可用 oss 标签镜像）；有转售模型须法务确认；存量 PG15 安排升级", k: ["K18", "K17"] },
    { id: "R11", plan: "开源组合栈", sev: "中", title: "运维自担", text: "无托管备份/PITR、PG 大版本升级无 runbook、监控需自建；组合本身无统一社区", fix: "pgBackRest 备份 + 恢复演练制度化；副本环境演练升级；运维工时计入 TCO", k: ["K19"] },
    { id: "R12", plan: "任意托管 PG", sev: "中", title: "托管扩展政策风险", text: "Neon 2026-03-19 起对新项目禁用 pg_search、存量 2026 年 9 月移除并导向自家 lakebase_text——托管商可单方面改变扩展供给", fix: "核心能力避免绑定单一托管商独有扩展；把扩展清单变更列入供应商监控项", k: ["K41"] },
  ];

  // ── 验证清单（§7.2） ──
  const checklist = [
    { name: "Fresh install 跑通", note: "干净机器从零部署到第一个真实 API 调用成功；预期坑位：InsForge 密钥配置、Nubase 未验证安装路径、组合栈容器实机启动" },
    { name: "密钥显式化", note: "枚举全部 secret，确认独立、持久、可轮转、无默认值回退链；私有云用 stable_secret" },
    { name: "备份恢复演练", note: "实际做一次恢复而非仅配置；Supabase 托管确认 PITR 付费 add-on；自管用 pgBackRest 建基线" },
    { name: "压测基线", note: "核心读写路径压出 p95 延迟与吞吐基线，与厂商宣称数字对照；Nubase 每租户连接池、InsForge Socket.IO Realtime 是重点未验证项" },
    { name: "许可证法务确认", note: "pg_search（AGPL 网络条款）、TimescaleDB（TSL 转售限制）、平台主体许可证逐项确认；AGPL 组件给出三选一明文结论" },
    { name: "退出成本测算", note: "演练 pg_dump 全量导出与异机恢复，估算重建周边栈人日与双跑期成本，每年复测" },
  ];

  return { meta, dims, matrix, keyNumbers, tiers, costCurves, apps, finStack, evolution, risks, checklist };
})();
