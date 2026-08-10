#!/usr/bin/env python3
"""扫描 skills/ base/ projects/ 目录，发现 GitHub 仓库并写入 registry.yaml。

扫描规则：
  - 顶层条目如果是 GitHub 仓库 → 记录
  - 顶层条目不是仓库 → 往下扫描 1 层，记录该层所有 GitHub 仓库
"""

import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
SCAN_DIRS = ["skills", "base", "projects"]
REGISTRY = ROOT_DIR / "registry.yaml"


def is_git_repo(path: Path) -> bool:
    """支持独立 clone（.git 目录）和 submodule（.git 文件）。"""
    git = path / ".git"
    return git.is_dir() or git.is_file()


def get_github_url(path: Path) -> str | None:
    """返回目录的 GitHub origin URL，不是 GitHub 仓库则返回 None。"""
    if not is_git_repo(path):
        return None
    try:
        result = subprocess.run(
            ["git", "-C", str(path), "remote", "get-url", "origin"],
            capture_output=True,
            text=True,
            check=True,
        )
        url = result.stdout.strip()
        if "github.com" in url:
            return url
    except subprocess.CalledProcessError:
        pass
    return None


def scan_dir(name: str) -> list[dict]:
    """扫描一个顶层目录，返回发现的 GitHub 仓库列表。"""
    root = ROOT_DIR / name
    if not root.is_dir():
        return []

    found = []
    for entry in sorted(root.iterdir()):
        if not entry.is_dir() or entry.name.startswith("."):
            continue

        url = get_github_url(entry)
        if url:
            found.append(
                {
                    "name": entry.name,
                    "repo": url,
                    "path": f"{name}/{entry.name}",
                    "desc": "",
                }
            )
        else:
            # 往下扫描 1 层
            for sub in sorted(entry.iterdir()):
                if not sub.is_dir() or sub.name.startswith("."):
                    continue
                sub_url = get_github_url(sub)
                if sub_url:
                    found.append(
                        {
                            "name": sub.name,
                            "repo": sub_url,
                            "path": f"{name}/{entry.name}/{sub.name}",
                            "desc": "",
                        }
                    )
    return found


def read_existing() -> dict[str, dict]:
    """读取现有 registry，返回 path -> project 映射（保留 desc）。"""
    existing = {}
    if not REGISTRY.exists():
        return existing
    text = REGISTRY.read_text(encoding="utf-8")
    try:
        import yaml

        data = yaml.safe_load(text)
        for p in data.get("projects", []):
            existing[p.get("path", "")] = p
    except ImportError:
        import re

        entries = re.findall(
            r"-\s+name:\s*(.+)\n\s+repo:\s*(.+?)\n\s+path:\s*(.+?)(?:\n\s+desc:\s*(.+?))?(?:\n|$)",
            text,
        )
        for n, u, p, d in entries:
            existing[p.strip()] = {
                "name": n.strip(),
                "repo": u.strip(),
                "path": p.strip(),
                "desc": d.strip() if d else "",
            }
    return existing


def write_registry(projects: list[dict]) -> None:
    """写入 registry.yaml。"""
    lines = [
        "# 项目注册表",
        "# 由 scripts/scan.py 自动生成，可手动补充 desc 字段",
        "# clone.py 会读取此文件，按 path 字段 clone 到对应目录",
        "",
        "projects:",
    ]
    for p in projects:
        lines.append(f"  - name: {p['name']}")
        lines.append(f"    repo: {p['repo']}")
        lines.append(f"    path: {p['path']}")
        desc = p.get("desc", "")
        if desc:
            lines.append(f"    desc: {desc}")
        lines.append("")

    # 去掉最后空行
    if lines and lines[-1] == "":
        lines.pop()

    REGISTRY.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    existing = read_existing()
    discovered: list[dict] = []

    for d in SCAN_DIRS:
        found = scan_dir(d)
        discovered.extend(found)
        if found:
            print(f"[{d}] 发现 {len(found)} 个仓库:")
            for p in found:
                print(f"    {p['path']}  ->  {p['repo']}")
        else:
            print(f"[{d}] 未发现 GitHub 仓库")
        print()

    # 合并：保留已有的 desc
    by_path = {p["path"]: p for p in discovered}
    final = []
    for p in discovered:
        old = existing.get(p["path"])
        if old and old.get("desc"):
            p["desc"] = old["desc"]
        final.append(p)

    # 检查是否有旧 registry 中的项目已不存在
    removed = set(existing.keys()) - set(by_path.keys())
    if removed:
        print(f"[WARN] 以下项目在扫描中未找到（可能已删除）:")
        for r in sorted(removed):
            print(f"    {r}")
        print()

    write_registry(final)
    print(f"==> 已写入 {REGISTRY.relative_to(ROOT_DIR)}，共 {len(final)} 个项目")


if __name__ == "__main__":
    main()
