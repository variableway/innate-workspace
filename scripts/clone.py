#!/usr/bin/env python3
"""读取 registry.yaml / registry.json，按声明的 path 批量 clone 项目。"""

import json
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent


def find_registry() -> Path | None:
    for name in ("registry.yaml", "registry.yml", "registry.json"):
        p = ROOT_DIR / name
        if p.exists():
            return p
    return None


def parse_registry(path: Path) -> list[dict]:
    suffix = path.suffix.lower()
    text = path.read_text()

    if suffix in (".yaml", ".yml"):
        try:
            import yaml

            data = yaml.safe_load(text)
            return data.get("projects", [])
        except ImportError:
            import re

            entries = re.findall(
                r"-\s+name:\s*(.+)\n\s+repo:\s*(.+?)\n\s+path:\s*(.+?)(?:\n|$)",
                text,
            )
            return [
                {"name": n.strip(), "repo": u.strip(), "path": p.strip()}
                for n, u, p in entries
            ]

    if suffix == ".json":
        data = json.loads(text)
        return data.get("projects", [])

    print(f"[ERROR] 不支持的注册表格式: {suffix}")
    sys.exit(1)


def main() -> None:
    registry = find_registry()
    if not registry:
        print("[ERROR] 找不到 registry.yaml / registry.json")
        sys.exit(1)

    print(f"==> 注册表: {registry.name}")

    projects = parse_registry(registry)
    if not projects:
        print("==> 注册表中没有项目")
        return

    print("==> 发现以下项目:")
    for p in projects:
        print(f"    {p.get('name','?')} -> {p.get('repo','?')}  ({p.get('path','?')})")
    print()

    cloned = skipped = 0
    for p in projects:
        name = p.get("name", "?")
        repo = p.get("repo", "")
        rel_path = p.get("path", "")

        if not repo or not rel_path:
            print(f"[SKIP] {name}: repo 或 path 缺失")
            skipped += 1
            continue

        target = ROOT_DIR / rel_path
        if (target / ".git").is_dir():
            print(f"[SKIP] {rel_path} 已存在")
            skipped += 1
        else:
            print(f"[CLONE] {repo} -> {rel_path}")
            target.parent.mkdir(parents=True, exist_ok=True)
            subprocess.run(["git", "clone", repo, str(target)], check=True)
            cloned += 1

    print(f"\n==> 完成: 克隆 {cloned} 个, 跳过 {skipped} 个")


if __name__ == "__main__":
    main()
