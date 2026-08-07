# innate-works

个人 AI 辅助开发工作空间，按用途分三个目录。

## 目录结构

| 目录 | 用途 |
|------|------|
| [`skills/`](skills/) | AI Agent Skill 集合，放所有可复用的 Skill 仓库 |
| [`base/`](base/) | 基础代码模板与脚手架 |
| [`projects/`](projects/) | 具体项目，按类型分子目录存放 |

各目录详见其下的 README。

## 克隆

所有子项目统一在 `registry.yaml` 中注册。新增项目追加条目后：

```bash
python3 scripts/clone.py
```

## Registry 同步

扫描 `skills/`、`base/`、`projects/` 下带 `origin` 的独立 git 仓库，自动更新 `registry.yaml`：

```bash
python3 scripts/sync-registry.py           # 写回 registry.yaml
python3 scripts/sync-registry.py --check   # 仅检查是否漂移
python3 scripts/sync-registry.py --dry-run # 预览
python3 scripts/sync-registry.py --prune   # 同时删除本地已不存在的注册项
```

安装本地 pre-commit hook 后，在 innate-works 提交时会先同步并自动 `git add registry.yaml`：

```bash
bash scripts/install-git-hooks.sh
```
