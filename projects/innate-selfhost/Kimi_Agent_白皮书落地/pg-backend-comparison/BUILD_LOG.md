# BUILD_LOG · PG 系 AI 后端选型报告 → 交互式站点

## 目标
把 pg-backend-comparison.agent.final.md（中文研究报告）做成 McKinsey 级交互式单页站点，严格遵循 interactive-research-report-en 技能（语言偏差：中文；QA「0 残留中文」条目不适用）。

## 关键决策
- **主题原子**：PostgreSQL 磁盘缸体 × Slonik 大象徽记（PG 品牌蓝 #336791 为封面真实材质色豁免）。A=缸体自相似递归（当前缸体缩成上一层 3×3 阵列中心单元）；B=五层真实材质分解（网关/自动API/周边服务/扩展层/数据库内核缸体）；C=同几何 X 射线蓝图；D=B 引擎 + 开箱时间线（板条箱 FRAGILE·POSTGRES 喷字 → 爆盖 → 五层弹出）。
- **签名图表选型**（按数据形状）：总分 → 六维分段阶梯（数量×构成双编码）；权重敏感性 → P18 裁决天平（侧性/倾斜/虚线悬空砝码/共享证伪条）；5×6 评分 → P5 矩阵热表；方案关键数字 → P9 小倍数三面板（对数 stars/月价/版本）；规模分层 → 对数 DAU 成本曲线（推演值标 [derived]，虚线）；金融三层 → P8 2.5D 价值栈；SQLite×PG → 三阶段轨道图（规模对数轴 × 记忆逻辑位置 × 触发旗标）；风险 → 12 行台账表（严重度徽标 + 逐行 drill）。
- **数据层**：js/data.js（window.RPT：matrix/keyNumbers/tiers/costCurves/apps/finStack/evolution/risks/checklist）；js/sources.js（K1–K41 锚点，四类分级，逐条带日期；srcLine() 供 drill 回溯）。
- **右栏 P14**：章节徽标 + 8 段阶段条 + 大读数 + 五方案总分迷你条，随 data-win 滚动切换；≤1180px 隐藏。

## 触碰文件
site/{index.html, css/{style.css(主题拷贝), fonts.css(拷贝), site.css}, js/{utils.js(拷贝), data.js, sources.js, cover.js, cover-exploded.js, cover-wire.js, dashboard.js, chart-score.js, chart-cards.js, chart-matrix.js, chart-verdict.js, chart-cost.js, chart-stack.js, chart-evo.js, chart-risk.js, main.js}, bundle.py}；../report-interactive.html（单文件版 319KB）；qa.py / qa2.py / qa-cover.py（QA 脚本）；qa/（截图证据）。

## 验证结果（全过）
- node --check × 16 模块：全 OK。
- playwright 1680 + 1280 双宽全程慢滚：0 pageerror / 0 console error / 0 横向溢出；reduced-motion 同过；document.fonts.check('16px et-book') = true（三轮均 true）。
- 单文件版 file:// 打开：0 pageerror / 0 console error / 0 溢出。
- drill 抽查 5/5 回溯 sources.js：总分段→K19；stars≈92k→K22；矩阵格→K1/K22；风险 R1→K9；正文 ◆K34→K34 锚点。
- 修复记录：成本曲线末端标签重叠（交错 dy）；Supabase stars 标签出界（缩短为 ≈92k，全文入 drill）；演进图左标签裁切（mL 70→96）；封面内核大象徽记过小（0.14→0.34 并贴朝前侧面正中）。

## 残余风险
- 成本曲线为推演模型（图内已标 [derived]、虚线），非厂商报价。
- D 开箱时间线（0.5s 爆盖等）以截图验证了终态与无错运行，逐帧动效靠人工浏览器复查更佳。
- ≤980px 超窄屏未单独验收（门禁口径为 1680/1280）。
