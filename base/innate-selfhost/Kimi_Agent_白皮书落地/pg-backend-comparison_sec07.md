# 第七章 风险登记册与验证清单

本章把第二至六章分散的风险事实收敛为两张可直接使用的表：7.1 是按方案登记的风险台账（含严重度与缓解措施），7.2 是任何方案采用前都应跑完一遍的验证清单。7.3 以一段话收束全报告。

## 7.1 风险登记册

严重度口径：**高** = 可导致数据丢失/不可读、法务风险或生产不可用，采用前必须处置；**中** = 有明确缓解措施、不处置则随规模放大；**低** = 需知晓但可接受。每条风险均可回溯到第二章的事实来源。

| # | 方案 | 风险 | 严重度 | 缓解措施 |
|---|---|---|---|---|
| R1 | InsForge | **密钥回退链**：ENCRYPTION_KEY 未设置时静默回退用 JWT_SECRET 加密全部 secrets（#905 已关闭确认行为，#1552 fail-closed 加固仍 open）；轮转 JWT_SECRET 将致 secrets 永久不可读 | 高 | 部署时**显式设置独立 ENCRYPTION_KEY** 并纳入密钥管理（私有云场景用 `stable_secret`）；升级前核对 compose 是否仍含 `:-${JWT_SECRET:-...}` 回退链；跟踪 #1552 合并状态 |
| R2 | InsForge | 项目年轻（repo 2025-07 创建）、文档/社区薄、Compute 仍 private preview、MCPMark 基准为厂商自测未独立复现 | 中 | 限定用于原型与中小项目；关键路径自测（见 7.2）；不把厂商基准数字写入容量规划 |
| R3 | Nubase | **稚嫩且社区信号异常**：v0.1.4、开源两个月、620 stars 但 GitHub **0 issues**/5 PR、Reddit/HN/知乎零实质讨论——star 疑似主要来自营销/聚合站导流 | 高 | 不作生产采用，仅作技术观察对象；如需试用，隔离网络环境部署，不放真实数据 |
| R4 | Nubase | 第三方收录站 skillsllm 安全扫描记录显示 README 曾被标记 **3 处 "secret-exfiltration" 中危提示**（instruction 疑似引导发送凭据到外部端点，状态 PASSED，未定性为恶意）[^2^] | 中 | 接入任何 MCP/agent 工具链前人工审计其 prompts 与网络出口；凭据最小授权 |
| R5 | Nubase | 无公司信息（官网无公司名/团队页）、无定价页（/pricing 返回 504）、功能缺口（无 Realtime/备份/PITR/HA/SSO），官方自警"暴露公网前需审查管理端点" | 高 | 按"无供应商背书"对待：自建备份与监控，管理端点加网关鉴权后方可暴露 |
| R6 | Supabase 托管 | **计量成本不可预测**：20+ 计量项（磁盘 $0.125/GB、出口 $0.09/GB、MAU 超 100K 后 $0.00325/MAU、PITR $100/月 add-on），成本与"纯 Postgres"不可直接对比 [^3^] | 中 | 上线前用真实流量模型做月度账单推演；设用量告警；定期与"4C8G VPS €22/月组合栈"基准对账 |
| R7 | Supabase 托管 | **托管锁定**：备份/PITR、分支、高级指标、ETL、管理 API 为平台专属；迁出需重建 Auth/Storage/Realtime 整套周边栈 | 中 | 数据层坚持标准 SQL 与 pg_dump 可导出形态；对 GoTrue/Storage/Realtime 的使用面做接口封装；每年做一次退出成本测算（见 7.2） |
| R8 | Supabase（托管/自托管） | 扩展决策随官方镜像走：**PG17 镜像已弃用 TimescaleDB**（推荐 pg_partman + 原生分区） | 低 | 依赖扩展前先确认目标镜像清单；自托管可自建镜像补回，但计入运维成本 |
| R9 | ParadeDB pg_search | **AGPL-3.0**：网络服务（SaaS）场景触发开源义务，且 AWS RDS 不支持安装 [^5^] | 高（商用场景） | 商用采购前法务确认 AGPL 义务或购买商业授权；对锁定敏感的组合栈可用 tsvector/lakebase_bm25 系方案替代 |
| R10 | TimescaleDB | **TSL 双轨**：连续聚合、列压、保留策略等高级功能在 Timescale License 下，自用免费但**禁止作为托管 DBaaS 转售**；2.29.0 起移除 PG15 支持 | 中 | 逐功能核对所用特性归属 Apache 还是 TSL（可用 `oss` 标签镜像规避）；有转售/托管业务模型的须法务确认；存量 PG15 用户安排升级 |
| R11 | 开源组合栈 | **运维自担**：无托管备份/PITR、PG 大版本升级无 runbook、监控需自建；组合本身无统一社区 | 中 | 自建 pgBackRest 备份 + 恢复演练制度化；升级前在副本环境演练；把运维工时计入 TCO 对比 |
| R12 | 任意托管 PG | **托管扩展政策风险**：Neon 2026-03-19 起对新项目禁用 pg_search、存量 2026 年 9 月移除并导向自家 `lakebase_text`——托管商可单方面改变扩展供给 [^7^] | 中 | 核心查询能力避免绑定单一托管商独有扩展；优先选用可自安装的扩展；把"扩展清单变更"列入供应商监控项 |

## 7.2 采用前验证清单

以下六项按执行顺序排列，任何方案（含托管版）在进入生产前都应打勾；Nubase 等稚嫩项目须全部通过且结果留档，成熟托管服务至少完成 3–6 项：

- [ ] **Fresh install 跑通**：在干净机器/干净账号从零部署到"第一个真实 API 调用成功"，记录耗时与卡点。预期坑位：InsForge 的密钥配置、Nubase 的未验证安装路径、组合栈的容器实机启动（本项目 compose 仅通过 YAML 解析验证）。
- [ ] **密钥显式化**：枚举全部 secret（数据库口令、JWT_SECRET、ENCRYPTION_KEY、网关 token），确认每一处都有独立、持久、可轮转的赋值，无默认值回退链；私有云场景用 `stable_secret` 类机制托管。
- [ ] **备份恢复演练**：不是"备份配置好了"，而是实际做一次**恢复**——从备份还原到独立实例并校验数据行数与关键业务查询。Supabase 托管用户须确认 PITR 是否为付费 add-on；自托管与组合栈用 pgBackRest 建立基线。
- [ ] **压测基线**：对核心读写路径压出 p95 延迟与吞吐基线（CRUD、搜索、实时通道各一），并与方案宣称数字（尤其厂商自测基准）对照；Nubase 的每租户 HikariCP 池、InsForge 的 Socket.IO Realtime 是各自未经公开验证的重点项。
- [ ] **许可证法务确认**：逐项确认 pg_search（AGPL-3.0 网络条款）、TimescaleDB（TSL 转售限制）、各平台主体许可证（Apache-2.0/MIT）在自身业务模型下的义务；商用 SaaS 场景对 AGPL 组件给出"购买商业授权 / 替换组件 / 自研规避"三选一的明文结论。
- [ ] **退出成本测算**：演练一次 `pg_dump` 全量导出与异机恢复，估算重建周边栈（Auth/Storage/Realtime/搜索）的人日与双跑期成本，写入采购决策文档——退出成本是锁定风险的量化形态，应每年复测。

## 7.3 总结论

回到全报告最初的问题——"哪个 PG 系 AI 原生后端最好"——本报告的答案是：**没有最好的 BaaS，只有与你的规模、应用类型、锁定容忍度相匹配的栈**。Supabase 以生态和省心守住基准位，InsForge 在 agent 操作面上开辟了新的竞争轴，Nubase 提醒我们"AI 原生"叙事下仍需核实稚嫩与异常信号，ParadeDB 与 TimescaleDB 证明数据库层的能力分化仍在加速——而贯穿五章评分、风险台账与验证清单的同一条结论是：**PostgreSQL 生态真正的护城河不是任何单一平台，而是可组合性**——每一层可独立替换、数据始终是物理库、退出路径永远存在，这才是对供应商决策风险（密钥回退、许可证变更、扩展弃用）最根本的对冲。

---

## 来源

（以下 URL 均于 2026-08-16 访问）

[^1^]: GitHub InsForge issues #905 / #1552 / #890：https://github.com/InsForge/InsForge/issues ；compose 回退链 https://raw.githubusercontent.com/InsForge/InsForge/main/deploy/docker-compose/docker-compose.yml
[^2^]: https://skillsllm.com/skill/nubase （安全扫描记录）；https://github.com/OtterMind/Nubase （0 issues / 620 stars）；https://ossinsight.io/analyze/OtterMind/Nubase
[^3^]: https://selfhost.dev/blog/supabase-pricing-explained/ ；https://queryglow.com/blog/supabase-self-hosted （计量项、平台专属功能）
[^4^]: https://basekick.net/blog/timescaledb-alternatives-2026 （Supabase PG17 弃用 TimescaleDB）
[^5^]: https://docs.paradedb.com/deploy/self-hosted/extension ；https://pgxn.org/dist/pg_search/0.18.5/pg_search/README.html （AGPL-3.0、RDS 不支持）
[^6^]: https://www.tigerdata.com/legal/licenses ；https://github.com/timescale/timescaledb/releases （TSL 双轨、2.29.1、PG15 支持移除）
[^7^]: https://neon.com/docs/extensions/pg_search ；https://neon.com/docs/extensions/migrate-pg-search-to-lakebase-text （Neon 弃用 pg_search 事件）
