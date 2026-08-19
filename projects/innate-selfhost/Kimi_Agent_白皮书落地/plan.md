# Plan — PG 系 AI 后端方案全景对比报告（HTML + PPT + PDF）

## 用户需求
对比 Nubase、InsForge、ParadeDB、TimescaleDB、Supabase（+ SQLite local memory 组合演进），
评估维度：① 开发便利性 ② PostgreSQL 为基础 ③ 可扩展性 ④ 模块不锁定 ⑤ 可转化懒猫私有云部署 ⑥ 周边生态。
产出：不同规模/不同应用类型（CRUD、search、data-intensive、金融交易数据）的技术采用分析报告，
含 SQLite local-first memory 与 PG 底座的扩展协同演进展望。
交付物：Markdown 主报告 + HTML 交互版 + PPTX + PDF。

## Stage 1 — 调研验证（explore ×3 并行）
- A: Nubase —— nubase.ai/features 及公开渠道，验证真实性与宣称功能
- B: InsForge —— insforge.dev + docs.insforge.dev/introduction，架构与功能清单
- C: ParadeDB / TimescaleDB / Supabase 2026 年最新事实核查（版本、许可证、托管限制、已知坑）
输出：三份带来源的调研简报（/mnt/agents/output/research/*.md）

## Stage 2 — 报告撰写（report-writing 技能，writer 子代理）
输入：三份简报 + 本会话已积累的分析结论（baas/memweave 项目上下文）
结构：执行摘要 → 五方案逐卡 → 六维评分矩阵 → 规模分层选型（个人/中小/企业）
→ 应用类型方案（CRUD / search / data-intensive / 金融交易）
→ SQLite local memory × PG 的扩展协同演进 → 风险与验证清单 → 附录（来源）
输出：/mnt/agents/output/pg-backend-comparison/report.md（中文）

## Stage 3 — 制品产出（三格式并行）
- HTML：interactive-research-report-en 技能 → 交互式报告站点
- PPTX：guizang-ppt-skill（用户指定，优先于 kimi-slides）
- PDF：pdf 技能（HTML+Paged.js 路线）
质检后交付。

## 质量门
- 每个数字/事实必须有来源或标注"未验证"
- Nubase 若查无实据，按白皮书 2.3 节方式处理（营销文档 vs 可验证开源替代）
