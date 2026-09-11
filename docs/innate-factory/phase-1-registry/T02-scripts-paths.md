# T02 — 脚本路径更新

> Sprint 1 ｜ 状态：done（2026-09-10）

## 步骤

1. `scripts/scan-innate-apps.py`：`REGISTRY = ROOT_DIR / "registry" / "apps.yaml"`，docstring 与 argparse 描述同步更新
2. `scripts/clone-innate.py`：`DEFAULT_REGISTRY` 同上，docstring 同步
3. `scripts/scan.py`：仅更新头部注释里对旧文件名的引用（无行为改动；根 registry.yaml 管理不动）

## 执行记录

- 三处路径 + 注释更新完成；`clone.py` 头部/footer 对旧文件名的引用一并改为 `registry/apps.yaml`
- `scripts/pre-commit.sh` 改为扫描并 stage `registry/apps.yaml`（避免再删旧路径）
- **配套 skill 落点**：`SCAN_DIRS = ["innate-apps", "base", "skills"]`。`skills/` 是全部配套 skill 的目录（含迁入的 `wip-skills`）；根 `registry.yaml` 仍由 scan.py 扫描同一 `skills/`（spark-cli 红线，本 sprint 不改其 SCAN_DIRS）

## 验收

`python3 scripts/scan-innate-apps.py` 正常读写新路径；第二次 scan 零 diff。
