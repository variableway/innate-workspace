# Plan: 轻量级 AI Agent Runtime + Plugin 模式深度调研

## 目标
深度调研"个人本地轻量级 AI Agent Runtime + Plugin 架构"方向，产出 Top 20 开源解决方案报告，重点关注：
1. 可构建 Rust/Tauri 基座的本地 plugin 模式
2. 支持 clone 应用源码 + AI Agent 修改后打包接入
3. 统一存储的系统层面设计

## Stage 1 — 深度调研（deep-research-swarm）
加载技能：`deep-research-swarm`
- 维度 A：现有 AI Agent Runtime / Platform 开源方案（如 Dify, Coze, LangChain 等之外的轻量级方案）
- 维度 B：Plugin 架构模式调研（Tauri 插件、VSCode 插件、Obsidian 插件、浏览器插件等）
- 维度 C：本地优先 (Local-first) + 统一存储方案（SQLite, CRDT, 文件系统等）
- 维度 D：Tauri 生态与 Rust 基座方案
- 维度 E：LazyCat/懒猫模式分析 + 其他类似私有云方案

## Stage 2 — 报告撰写（report-writing）
加载技能：`report-writing`
- 基于 Stage 1 调研结果，设计报告大纲
- 撰写多章节深度报告
- 包含 Top 20 开源方案排名、对比分析、架构建议

## Stage 3 — 格式化输出（docx）
加载技能：`docx`
- 将最终 Markdown 转换为 .docx 格式
- 输出最终文件

## 输出
- `/mnt/agents/output/ai-agent-runtime-plugin-research.docx`
