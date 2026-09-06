# scripts/ · 过程脚本归档说明

本目录统一归档「PG 系 AI 后端选型报告」制作过程中产生的全部过程脚本与证据截图。
原位置文件未删除（保持制品完整），此处均为复制件。

## 站点（site/）相关脚本

### qa.py
站点主 QA：双宽度（1280/1680）+ reduced-motion 变体慢滚全程扫描，收集 console error / pageerror，检查横向溢出与 et-book 字体加载，截取整页、封面与全部 8 个图表元素图（输出到 `qa/`）。
运行：`python3 qa.py [url]`，默认 url 为 `file://…/site/index.html`。

### qa2.py
站点补充 QA：滚动扫描 + 抽查 5 个 drill 下钻交互，验证图表点击下钻链路无报错。
运行：`python3 qa2.py`。

### qa-cover.py
封面四态专项 QA：拍摄封面 A 态（缸体递归），并依次点击 `#cover-mode` 按钮切换 X（分解）/ W（蓝图）/ D（开箱）三态并截图，最后点击矩阵一格做 drill 抽查。
运行：`python3 qa-cover.py`。

### bundle.py
打包器：把 site/index.html 引用的 css/ 与 js/ 全部内联，生成单文件版 `report-interactive.html`（file:// 可直接打开，319KB）。
运行：`cd site && python3 bundle.py [outfile]`。

## PDF 报告相关脚本

### build_html.py
把最终 Markdown 报告（pg-backend-comparison.agent.final.md）转成 Paged.js 排版用 HTML：抽取脚注来源列表、重建目录、剥离头块。输出 `report.html`。
运行：`python3 build_html.py`（需 `pip install markdown`）。

### report.html
build_html.py 的中间产物（PDF 排版源），归档备查。最终 PDF 为 `../pg-backend-comparison.pdf`。

### BUILD_LOG.md
交互站点构建日志：主题原子决策、图表选型、数据层、触碰文件清单与验证结果记录。

## 截图证据目录

### qa/
修复前各轮 QA 截图证据（封面四态、整页扫描、8 图表 × 双宽度 × reduced-motion 变体）。

### qa-after/
背景 canvas 修复的对比验证：`before/`（修复前基线：PPT 封面 / P2 / P5 / 封底 / 站点封面）、修复后重跑产物，以及 `qa_before.py`（基线截图脚本，可用 `python3 qa_after/qa_before.py <输出目录>` 复跑）。

## 其他仓库检查记录

- `/mnt/agents/output/ai-memory-backend/`：已检查，仅有 git 仓库本体（README.md / SPEC.md / baas/ / memweave/ 源码），`__pycache__` 之外无散落的过程脚本或临时文件，无需归档（scripts/codegen/ 因此为空缺）。
