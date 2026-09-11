# T02 — 模板内置 Agent 起步件

> Sprint 3 ｜ 状态：todo ｜ 依赖：T01

## 内容

1. **AGENTS.md**（仓根）：仓库结构速览、命令表（dev/build/verify/sync:*）、static export 约束（动态路由需 generateStaticParams 兜底）、plugin registry 规则
2. **`.agents/skills/{{app-name}}-dev/SKILL.md`**：frontmatter（name/description 触发词）+ 按需加载的 references/（数据管道、插件开发、部署）；对齐 skill-creator 格式惯例
3. **`.npmrc`**：`@innate:registry=http://localhost:4873`（生成即连通基座）

## 设计要点

- 仓库级 skill 随 app 版本化，agent 在仓内自动发现（ZCode/Claude Code/OpenCode 均识别），零安装
- SKILL.md 是跨 harness 事实标准——DeepSeek 系 harness 适配时知识不重写

## 验收

模板生成的 app 里，任一 harness 进仓能答出"怎么构建/验证/加插件"三问。
