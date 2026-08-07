# Tracing: fire-skills 去重 devops 副本并让 skill-spark CLI 支持安装到 workbuddy

## Task Entry (2026-08-02 16:00:16)

- **Issue**: #2
- **Title**: fire-skills 去重 devops 副本并让 skill-spark CLI 支持安装到 workbuddy
- **Started At**: 2026-08-02 16:00:16
- **Status**: in_progress

### Original Task Description

```markdown
1. 删除 fire-skills 中 skills/devops/ 重复副本（5个devops技能+dev-workflow安装脚本），devops-skill 仓库作为唯一来源；更新 scripts/dev-workflow.sh 指向外部源，更新 README/categories/index/docs。
2. 优化 skill-spark CLI 使其可安装技能到 workbuddy：在 agents.ts 注册 workbuddy agent（~/.workbuddy/skills）；给 add 命令增加 --agent 选项以定向安装；在 installations.ts 为 workbuddy 做路径改写（.agents/skills/、~/.claude/skills/ → ~/.workbuddy/skills/）；同步 clean-skills.sh。
3. 构建 skill-spark，用 CLI 测试安装 devops-skill 的技能到 ~/.workbuddy/skills/ 并验证可用性。
```

