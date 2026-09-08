# AgentForge Office Skill Suite — 应用开发计划

## 产品定位
一个基于 AgentForge Runtime 的办公文档处理 Skill 套件。用户通过自然语言描述需求，AI Agent 自动完成文档的生成、转换、编辑和可视化。

## 核心功能矩阵

| Skill | 输入 | 输出 | 依赖工具 |
|-------|------|------|----------|
| **Doc Writer** | Markdown / 自然语言 | DOCX | python-docx, pandoc, markitdown |
| **Slide Maker** | Markdown / 大纲 | PPTX | python-pptx, pandoc, mermaid.js |
| **Sheet Genius** | CSV / Markdown表格 / 自然语言 | XLSX | openpyxl, pandas, sheetjs |
| **HTML Builder** | Markdown / 自然语言 | HTML | pandoc, markdown-it |
| **Chart Visualizer** | 数据 / 自然语言 | PNG/SVG/Chart | mermaid.js, chart.js, echarts |
| **Format Converter** | 任意办公格式 | 任意办公格式 | pandoc, anytomd-rs, markitdown |

## 技术栈

```
AgentForge Runtime
├── Tauri v2 (UI层)
├── Rust Runtime (MCP Host)
├── Plugin Layer
│   ├── MCP: markitdown (MS) — DOCX/PPTX/XLSX → MD
│   ├── MCP: pandoc — 任意格式 ↔ 任意格式
│   ├── MCP: anytomd-rs — Rust原生文档→MD
│   ├── MCP: md_exporter — MD → DOCX/PPTX/XLSX
│   ├── MCP: mermaid-cli — 文本→图表 (甘特/看板/流程)
│   ├── MCP: chart-js-server — 数据→图表
│   ├── MCP: openpyxl-server — Excel操作
│   └── WASM: sheetjs — 浏览器端Excel读写
└── SQLite (统一存储)
```

## 开发阶段 (甘特图)

### Phase 1: 核心转换引擎 (Week 1-4)
- **W1-2**: MarkItDown MCP Server (DOCX/PPTX/XLSX → MD)
- **W2-3**: Pandoc MCP Server (全格式转换)
- **W3-4**: MD Exporter MCP Server (MD → DOCX/PPTX/XLSX)

### Phase 2: 可视化引擎 (Week 3-6)
- **W3-4**: Mermaid MCP Server (甘特图/看板/流程图)
- **W4-5**: Chart.js MCP Server (数据图表)
- **W5-6**: ECharts MCP Server (交互式图表)

### Phase 3: 高级功能 (Week 5-8)
- **W5-6**: Excel操作引擎 (公式/透视/筛选)
- **W6-7**: PPT模板系统 (母版/主题/动画)
- **W7-8**: 批量处理 + 工作流编排

### Phase 4: 产品化 (Week 7-10)
- **W7-8**: AI自然语言指令解析
- **W8-9**: UI界面 (文件管理/预览/历史)
- **W9-10**: 打包发布 + 文档
