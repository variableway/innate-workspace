# InsForge 深度盘点（PostgreSQL 系 AI 后端方案对比报告素材）

访问日期：2026-08-16

## 结论（一句话）

InsForge 是 YC（P26 批次）支持的、Apache-2.0 开源的"agent-native"后端平台：把 PostgreSQL 15 + PostgREST + Deno Edge Functions + S3 兼容存储 + OpenRouter 模型网关打包成一套 Docker Compose 可自托管的栈，其真正差异化不在 PG 本身（版本与扩展生态都偏保守），而在面向 AI 编码代理的 MCP 语义层 + CLI/Skills 控制面（读 schema、跑迁移、部署函数、分支整个后端、诊断修复）；作为"PG 系方案"数据库层功能与 Supabase 高度重叠但更薄，社区热度中等（GitHub 约 12.8k stars，开发活跃），已知风险集中在自托管默认密钥回退和全新安装的坑。

## 架构（文字图）

```
AI Coding Agents (Cursor / Claude Code / Codex / Copilot / Windsurf ...)
   │  两条入口：
   │   ① MCP Server（自托管+云均可）— 工具化操作后端
   │   ② CLI + Skills（`npx @insforge/cli`，云端为主）— JSON 输出供 agent 消费
   ▼
InsForge Backend (Node/TS, ghcr.io/insforge/insforge-oss) ── MCP / REST API / Dashboard (Vite 前端)
   ├── Authentication（自研：JWT、email/OTP/magic link、OAuth/OIDC、PKCE；可接 Clerk/Auth0/WorkOS/Kinde/Stytch/Better Auth）
   ├── Database 层：PostgREST v12.2.12 → PostgreSQL 15（自托管镜像 ghcr.io/insforge/postgres:v15.13.4，含 pg_cron、pgvector）
   ├── Storage（本地磁盘默认 / MinIO / RustFS / 外部 S3 兼容；自带 /storage/v1/s3 SigV4 网关）
   ├── Edge Functions（Deno runtime；云端走 Deno Subhosting，本地 Docker；支持 cron 触发 = pg_cron）
   ├── Realtime（Socket.IO：DB 变更 + pub/sub + presence，RLS 校验）
   ├── Model Gateway（OpenAI 兼容端点 → OpenRouter 路由，按项目配额/用量追踪；旧代理端点已废弃）
   ├── Sites / Deployment（前端部署到 Vercel，.insforge.site 域名）
   └── Compute（私有预览：长驻容器/microVM）
```

自托管最小栈（deploy/docker-compose/docker-compose.yml）：**3 个核心容器** = `postgres` + `postgrest` + `insforge`（app 内含 dashboard、auth、storage、MCP、Deno 函数运行所需代理），可选 MinIO/RustFS overlay。端口默认 APP 7130、AUTH 7131、PostgREST 5430、PG 5432、Deno 7233（多实例需改端口）。官方另提供 Railway/Zeabur/Sealos 一键部署及 EC2/Hetzner/GCP/Azure/Coolify/Dokploy 等 VPS 指南。

## 功能清单（标注来源）

| 功能 | 细节 | 来源 |
|---|---|---|
| Database | PostgreSQL 15（自托管 v15.13.4 镜像）；表即 REST/SDK API；多 schema；migrations 为 git 中时间戳 .sql，CLI/MCP 前滚执行 | docs /core-concepts/database/overview |
| pgvector | 每项目内置，HNSW/IVFFlat 索引 | docs /core-concepts/database/pgvector |
| RLS | 支持；RLS 是 anon key 的安全边界；覆盖 REST/SDK/realtime/storage | docs database、REST API |
| Auth | email、magic link、OTP、OAuth/OIDC、JWT 会话、admin API key/anon key 可轮换（grace period）；OAuth Server（InsForge 作为 IdP） | docs /core-concepts/authentication、api-reference |
| Storage | S3 兼容；presigned 或 proxy 模式；自带 SigV4 网关；RLS on storage.objects | docs /core-concepts/storage |
| Edge Functions | Deno，HTTP 调用、cron（pg_cron）、DB trigger、secrets | docs /core-concepts/functions |
| Realtime | Socket.IO 频道、消息历史/保留、webhook fan-out | docs /core-concepts/realtime |
| Model Gateway | OpenRouter 提供 key，OpenAI 兼容；chat/image/embedding 旧代理端点已 deprecated，直接调 OpenRouter | docs /core-concepts/ai |
| MCP 工具 | get-table-schema、run-raw-sql（strict mode, admin only, 禁系统表/auth.users）、bulk-upsert、bucket CRUD、function CRUD、create-deployment/get-container-logs、fetch-docs、get-anon-key、get-backend-metadata | docs /mcp-setup |
| Agent-native 原语 | CLI harness（JSON 输出）、config as code（insforge.toml, plan/apply/export）、backend branching（整后端克隆：DB+auth+storage+functions+schedules，merge/reset）、diagnostics & advisor（`insforge diagnose`，RLS 告警、错误日志，agent 自修复） | docs /agent-native/* |
| 其他产品 | Payments（Stripe/Razorpay 自带账号）、Messaging（SMTP 邮件）、Analytics（PostHog）、Web Scraper（Apify）、Custom Compute | docs /products、/core-concepts/* |
| SDK | TypeScript、Swift、Kotlin、REST（PostgREST 风格） | docs /sdks/* |

## 许可证与定价（托管版，insforge.dev/pricing）

- 开源：**Apache-2.0**（GitHub LICENSE）。
- Free $0：5 万 MAU、500MB DB、5GB 带宽、1GB 存储、10 万次函数调用、120h custom compute；**闲置 1 周自动暂停**。
- Pro $25/月（年付 $240 折 $20）：含 $10/月 InsForge Compute 抵扣；100k MAU、8GB DB、250GB 带宽、100GB 存储；超量按价计费（$0.125/GB DB 等）。Compute 实例 Nano 2vCPU/0.5GB $5/月 至 16XL 64vCPU/128GB $2560/月，按小时计费。
- Enterprise：SOC2、HIPAA（付费附加）、SSO、无限项目。

## 自托管实测线索

- 安装：`curl ... deploy/setup.sh | sh -s ~/insforge` 自动生成 JWT_SECRET/ENCRYPTION_KEY/POSTGRES_PASSWORD 等到 .env（600 权限），然后 `docker compose up -d`；浏览器开 http://localhost:7130 接 MCP。
- 坑 1（已修复，issue #890/#901）：早期 README 自托管 Docker 在 fresh clone 上启动失败（缺 shared-schemas 与 ui build 步骤）；现由 setup.sh + 预构建镜像解决。
- 坑 2（issue #905，closed）：**ENCRYPTION_KEY 未设置时静默回退用 JWT_SECRET 加密所有存储 secrets**，且无任何告警——轮转 JWT_SECRET 会导致全部 secrets 永久不可读（数据丢失）。compose 文件当前仍有 `ENCRYPTION_KEY:-${JWT_SECRET:-dev-secret...}` 的回退链，自托管务必显式设置 ENCRYPTION_KEY。
- 坑 3（issue #1552，open）：生产部署模板仍允许占位/默认密钥，要求"fail closed"，尚未落地。
- 坑 4（issue #1763，closed）：schedules 依赖 `app.encryption_key` GUC 但从未设置导致带 header 的 cron 任务失败。
- 多实例：同一 COMPOSE_PROJECT_NAME 的目录会互相接管容器，需改 COMPOSE_PROJECT_NAME 与端口。
- 历史迁移坑：PGDATA 固定在 `/var/lib/postgresql/data/pgdata`（旧 postgres-all 镜像遗留，防止误 initdb 成空库"看似数据丢失"）。

## 社区证据（第三方评价）

- **HN**：5+ 次 Show HN；最成功的 2026-05 "Open-source Heroku for coding agents" 62 分/7 评论。正面评论："getting started experience really smooth"（peggyrayzis）；"RLS 默认开启对 DX 是双刃剑，MCP 自动给 sane defaults 是巨大胜利"（albertlsc）。质疑点：多 agent 并发协调/配额机制不明、与 Supabase 相比的扩展性与 MCP 延迟 trade-off。早期帖子（2025 年）分数很低（1–15 分），说明热度是 2026 年才起来的。
- **developersdigest.tech（2026-05，权威性 B）**：系统性怀疑论——"是否真的需要又一个后端平台？"；警告 abstraction drift（agent 学简化控制面而生产行为在底层 PG/auth/storage，事故时抽象掩盖关键细节）和安全性（给 agent 后端工具只有在权限/日志/审批/回滚优于裸工具时才更安全）。给出 10 条评估清单。
- **agent-finder.co（2026-07，10 天实测）**：7/10。优点：语义层让 agent 自主 provisioning、model gateway 省事、免费层够原型；缺点：文档和社区比 Supabase/Firebase 薄、企业合规缺失、不适合迁移存量项目。实测：3 分钟建项目，DB/auth 一次成功，storage bucket 权限需纠正一次。
- **funblocks / hokai.io / aitoolly**：转述官方基准 MCPMark（官方自称 vs Supabase 1.6x 快、30% 更少 token、1.7x 准确率——**为厂商自测，需谨慎采信**）；FunBlocks 指出语义层映射若不健壮会产生难调试的隐性 bug。
- **Reddit**：未检索到有分量的独立讨论（搜 HN/Reddit 组合仅命中 HN），社区声音主要来自官网精选的 X 推文（均为正面，选择性偏倚）。

## 已知风险汇总

1. **PG 版本偏旧**：PostgreSQL 15（非 16/17），扩展生态不如 Supabase 丰富（确认有 pgvector、pg_cron；未见 pg_net、pgmq、TimescaleDB 等）。
2. **自托管密钥回退链**仍在 compose 文件中（ENCRYPTION_KEY→JWT_SECRET→dev-secret），#1552 加固未完成。
3. **Model Gateway 强绑定 OpenRouter**；自托管需自带 OpenRouter key。
4. **Realtime 用 Socket.IO** 而非 PG 原生逻辑复制（与 Supabase Realtime 架构不同）。
5. **Sites 部署依赖 Vercel**（非自托管前端托管）。
6. **Compute（长驻容器）仍是 private preview**。
7. 项目年轻（repo 2025-07 创建），团队小，文档/社区薄；企业合规（SOC2/HIPAA）仅 Enterprise 定制。
8. Stars 数据注意：GitHub API 实测 **12,757 stars / 1,138 forks / 125 open issues**（2026-08-14），但官方页渲染缓存显示 1.4k、第三方 3 月文章称 2.3k——以 API 为准。开发高度活跃：~2,780 commits，pushed_at 2026-08-14（每日多次提交，含外部贡献者 PR），最新 release v1.5.6。

## 来源 URL（访问日期 2026-08-16）

- https://insforge.dev （官网）
- https://insforge.dev/pricing （定价）
- https://docs.insforge.dev/introduction （概览）
- https://docs.insforge.dev/llms.txt （文档索引）
- https://docs.insforge.dev/core-concepts/database/overview.md （DB/PostgREST/PG15/pgvector/RLS）
- https://docs.insforge.dev/agent-native/overview.md （CLI harness/branching/diagnostics/config-as-code）
- https://docs.insforge.dev/mcp-setup.md （MCP 工具清单）
- https://github.com/InsForge/InsForge （README、quickstart、compose）
- https://raw.githubusercontent.com/InsForge/InsForge/main/deploy/docker-compose/docker-compose.yml （容器/PG 版本/密钥回退）
- GitHub API: /repos/InsForge/InsForge（stars/forks/活跃度）；issues #890 #901 #905 #1552 #1763 #1785
- HN Algolia: story 48181342（62 分，2026-05）、45449787、44772898、45528161 等
- https://agent-finder.co/reviews/insforge （独立实测 7/10）
- https://www.developersdigest.tech/blog/agent-native-backends-insforge （怀疑论分析）
- https://stackbases.com/tools/insforge-backend-branching 、https://hokai.io/hub/tools/insforge 、https://www.funblocks.net/aitools/reviews/insforge-2 、https://chatgate.ai/post/insforge/ 、https://aitoolly.com/product/insforge
