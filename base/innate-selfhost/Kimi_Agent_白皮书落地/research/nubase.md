# Nubase（nubase.ai）真实性核查与功能盘点

访问日期：2026-08-16

## 结论（一句话）

**Nubase 是真实存在的开源产品**：官网宣称的功能与 GitHub 仓库 [OtterMind/Nubase](https://github.com/OtterMind/Nubase)（约 620 star / 73 fork / 106 commits / 10 contributors，Java 76.1%，Apache-2.0，2026-06-08 首次开源发布，至 2026-08-11 仍活跃提交）一一对应，且有 npm 包 `nubase_cli`、Docker 镜像 `ottermind/nubase`、在线文档站和中文 README 佐证；此前"查无实据"的营销白皮书描述（Java 单体 + AI 记忆层 + AI Gateway 的 BaaS）大体属实但表述过时——真实定位是"开源、AI 原生的自托管后端 + 部署层，含 8 大模块"，不是 Java 单体而是 Spring Boot 后端 + Next.js Studio 前端 + 多租户 PostgreSQL 架构。注意：它非常早期（v0.1.4，2026-06 才开源），star 数 600+ 但 issue 数为 0，社区讨论（Reddit/HN/知乎）基本缺席，热度存在营销推动的迹象。

## 官网宣称功能清单

### 来源：nubase.ai/features（功能页，"Eight modules. One backend. Generate → live."）

1. **Database**：每个项目独立 PostgreSQL 数据库（非共享实例的 schema）；全量 SQL 访问；默认 RLS；自动为每张表生成 REST API。架构线索：`RoutingDataSource` + 每租户 HikariCP 连接池；`GuardianDataSource` 拒绝未认证 DB 访问；每租户加密凭据/JWT 密钥/角色映射；`/rest/v1/*` 用 Java 实现的 PostgREST 兼容层（非独立 PostgREST 进程）；schema 元数据缓存经 PostgreSQL NOTIFY 刷新；RLS 用 `SET LOCAL ROLE` + `request.jwt.claims` GUC 变量；`@RequireServiceRole` AOP 守卫。
2. **Auth**：Supabase GoTrue 兼容——email/password、OAuth（Google/GitHub，可扩展）、JWT 签发、refresh-token 轮换、MFA/TOTP、OTP、magic link、匿名登录；每租户独立 JWT 密钥；双层 apikey（租户级 ref claim + 用户级 Bearer）；管理端点 `POST /auth/v1/admin/init/database`。
3. **Storage**：S3 兼容对象存储（AWS S3 / Cloudflare R2 / MinIO / LocalStack），元数据存 Postgres `storage.objects` 带 RLS；公有/私有 bucket、签名 URL、大小与 MIME 限制；每租户 key 前缀；可选 AWS S3 Vectors 存储文档向量。
4. **Assets**：生成前端的静态 CDN，agent 通过 MCP `assets_upload` 上传静态文件并以公有 CDN 服务，与项目 token 模型一致。
5. **Functions**：边缘函数部署 AI 写的后端逻辑，`/functions/v1/{slug}` + `verify_jwt`；esbuild 打包 TypeScript，版本化；本地执行器或 Cloudflare Workers for Platforms；每函数密钥加密存储、调用日志、限流；MCP `functions_deploy`。
6. **AI Gateway**：OpenAI 兼容 `/v1` 与 Anthropic 兼容 `/v1/messages`；流式 + token 计数透传；跨厂商模型路由；每项目 `nbk_` key 签发/吊销；token/请求/成本用量分析（按 key、按模型、按日）。
7. **Memory**：一等公民 LLM 记忆层，mem0 兼容 API；`POST /mem/v1/memories`（infer=true 时 LLM 抽取事实并输出 ADD/UPDATE/DELETE/NONE）；混合检索 pgvector 余弦 top-K + BM25（ts_rank_cd）+ 实体加权（mem0 v3 spread-attenuated 算法）；中文支持 zhparser；完整审计历史、实体存储、批量删除/租户重置；Chat 支持 OpenAI/Anthropic/OpenAI 兼容（DashScope、DeepSeek、Moonshot、vLLM、Ollama）。
8. **cron**：crontab（UTC，5/6 字段）调度，目标为 edge_function 或具名 db_function；控制平面行级 claim 防重复执行；运行历史；MCP `cron_create`。

### 来源：nubase.ai（首页）

- "Turn AI-written code into real apps"；一个 Docker 镜像自托管整套栈（Postgres + Redis + API + Studio）；多项目控制平面；Bring your own model；Apache-2.0 免费；"Get started free"。

### 来源：nubase.ai/docs 及 /docs/concepts、/docs/getting-started

- 双令牌模型（apikey JWT 标识租户+角色；Bearer JWT 标识终端用户）；每租户独立物理 Postgres 库（`public.*` 业务表 + `auth.*` + `storage.*` + `mem.*`）；Quickstart 需 Postgres 15 + pgvector + Redis，`mvn spring-boot:run` 启动，Studio 为 Next.js。

### 来源：nubase.ai/compare/firebase（对比页）

- 定位 vs Firebase：开源 Apache-2.0、自托管、PostgreSQL + SQL + REST、内置 AI 记忆层；承认 Firebase 在 Realtime/移动 SDK/全托管方面更强。另有 vs Supabase 对比表（README 中）：自托管 Supabase 单项目 vs Nubase 多项目独立数据库；Nubase 无 Realtime。

### 定价 / 公司信息

- **无独立 pricing 页**（https://nubase.ai/pricing 访问返回 504 超时；导航中也无 pricing 链接）。官网口径统一为"Free, self-hosted, Apache-2.0, free forever"，GitHub README 提到 AI Gateway 有 billing 相关提交（`feat(billing): 添加AI网关计费系统`），暗示未来可能有托管付费。
- **公司信息缺失**：官网仅署名 "© 2026 Nubase. Made with care by the Nubase team."，无公司名、地址、团队页。GitHub 组织为 "OtterMind"（个人型组织，无公司主页）。无公司注册信息线索。中文提交信息（如 `feat(billing): 添加AI网关计费系统`）、README.zh-CN、zhparser 支持、WeChat OAuth 指向中文团队背景。
- 注意同名混淆：nubase.dev（内部工具低代码）、nubaseweb.com（设计 agency）、npm `@nubase/cli`（无关旧包）均与本项目无关。

## 可验证性证据

| 项目 | 结果 |
|---|---|
| GitHub | ✅ 有：https://github.com/OtterMind/Nubase，620 stars / 73 forks / 106 commits / 10 contributors / 5 releases（最新 v0.1.4，2026-06-16）/ 6 branches / 7 tags；语言 Java 76.1% + TypeScript 21.4% + PLpgSQL；Apache-2.0；首次开源提交 2026-06-08，最近提交 2026-08-11（活跃）。代码结构含 src/、frontend/（Next.js Studio）、docs/、docker/all-in-one/、cloudflare/functions-dispatcher/ |
| npm | ✅ 有：`nubase_cli`（README 徽章 + 多处文档引用；本次未直接打开 npm 页核实版本） |
| Docker | ✅ 宣称有 `ottermind/nubase` 镜像（README 有 Docker Hub badge） |
| 官方文档 | ✅ 有：nubase.ai/docs（概念、quickstart、memory、架构等）+ 仓库 docs/ 目录（architecture.md、product-overview.md、supabase-comparison.md、assets.md 等） |
| 第三方收录 | ✅ 有：openapps.pro（2026-06-08）、uuaihub.com（中文，2026-06-27）、skillsllm.com（2026-06-18，含安全扫描记录）、ossinsight.io 分析页 |
| Reddit / HN / 知乎 | ❌ 未检索到实质社区讨论（搜索 "Nubase OtterMind reddit OR hackernews" 与 "nubase.ai 知乎 OR 掘金" 均只返回官网/聚合站内容） |
| Issues/社区活跃度 | ⚠️ GitHub Issues 显示 0 条 open、仅 5 个 PR、4 watchers——与 620 star 相比社区互动异常低，star 可能主要来自营销/聚合站导流 |
| 安全观察 | ⚠️ skillsllm.com 的扫描记录显示 README 曾被标记 3 处 "secret-exfiltration" 中等风险提示（instruction 疑似引导发送凭据到外部端点），状态仍为 PASSED；建议在报告中提示读者自行评估 MCP 工具安全面 |

## 与 Supabase / InsForge 的可比点

| 维度 | Supabase | Nubase | 备注 |
|---|---|---|---|
| 数据库 | PostgreSQL + PostgREST | 每项目独立 PostgreSQL，Java 重写 PostgREST 兼容层 `/rest/v1/*` | Nubase 的多租户"database-per-project"是核心差异；自托管 Supabase 官方仅单项目 |
| Auth | GoTrue | GoTrue 兼容 API（含 MFA/TOTP/OTP/magic link/OAuth/SAML SSO），每租户独立 JWT 密钥 | 对 Supabase 用户迁移成本低 |
| 存储 | S3 兼容 | S3/R2/MinIO 兼容 + 可选 S3 Vectors | 接近对等 |
| Edge Functions | Deno | 本地执行器或 Cloudflare Workers for Platforms，esbuild 打包 TS | 实现对齐 InsForge 的 Deno Deploy 思路但走 Cloudflare |
| AI 能力 | 非核心（Vector 为扩展） | **内置一等公民 Memory（mem0 风格）+ AI Gateway（OpenAI/Anthropic 兼容、按项目 key、成本统计）** | 与 InsForge 的 "AI 原生 BaaS" 叙事直接对位 |
| 部署层 | 无（前端需另托管） | Assets 静态 CDN + Functions + cron，agent 可 generate→live 全链路 | 相对 Supabase/InsForge 的差异化卖点 |
| Agent 接口 | 有 MCP（官方） | MCP 桥 `nubase_cli`，skill 一键安装到 Claude Code/Codex | 同类打法 |
| 技术栈 | Elixir/Go/TypeScript | Spring Boot 3.2 + Java 17 + Next.js Studio + PostgreSQL/pgvector + Redis | 与白皮书"Java + 记忆层 + AI Gateway"描述吻合 |
| 成熟度 | 成熟生产级 | v0.1.x，缺 Realtime、备份/PITR、HA、SSO/SCIM；官方自警"暴露公网前需审查管理端点" | 不宜与 Supabase 直接做生产可比 |
| 许可/价格 | Apache-2.0 / 托管计费 | Apache-2.0，自托管免费，无定价页 | |

## 引用来源（均于 2026-08-16 访问）

- https://nubase.ai/features — 功能清单（8 模块逐条）
- https://nubase.ai/ — 首页定位语
- https://nubase.ai/docs 、https://nubase.ai/docs/concepts 、https://nubase.ai/docs/getting-started — 官方文档
- https://nubase.ai/compare/firebase — 对比页
- https://github.com/OtterMind/Nubase — 仓库主页（star/fork/commit/release/语言统计）
- https://github.com/OtterMind/Nubase/blob/main/README.md 、README.zh-CN.md — 官方自述、Supabase 对比表、Roadmap
- https://github.com/OtterMind/Nubase/blob/main/docs/architecture.md 、product-overview.md 、supabase-comparison.md 、assets.md — 架构文档
- https://ossinsight.io/analyze/OtterMind/Nubase — 第三方仓库分析
- https://openapps.pro/apps/nubase 、https://www.uuaihub.com/tool/nubase 、https://skillsllm.com/skill/nubase — 第三方收录/扫描
- https://nubase.ai/pricing — 访问超时（504），记录为"无定价页"证据
