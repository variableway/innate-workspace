# innate-works

个人 AI 辅助开发工作空间，按用途分三个目录。

## 目录结构

| 目录 | 用途 |
|------|------|
| [`skills/`](skills/) | AI Agent Skill 集合，放所有可复用的 Skill 仓库 |
| [`base/`](base/) | 基础代码模板与脚手架 |
| [`projects/`](projects/) | 具体项目，按类型分子目录存放 |

各目录详见其下的 README。

## 克隆 / 更新

所有子项目统一在 `registry.yaml` 中注册，并由 `.gitmodules` 提供 submodule URL 映射。

```bash
# 推荐：按 registry 克隆缺失项目，并拉取各仓库最新代码（fast-forward）
python3 scripts/clone.py

# 仅初始化/对齐到父仓库锁定的 commit（可能不是各子仓最新）
git submodule update --init
```

> 注意：不要依赖 `git submodule update` 获取“最新代码”；它只会 checkout 父仓库记录的固定 SHA。要最新请用 `scripts/clone.py`。
