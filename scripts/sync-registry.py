#!/usr/bin/env python3
"""扫描 skills/ base/ projects/ 下的独立 git 仓库，同步更新 registry.yaml。

用法:
  python3 scripts/sync-registry.py           # 扫描并写回 registry.yaml
  python3 scripts/sync-registry.py --check   # 仅检查是否漂移，有差异则 exit 1
  python3 scripts/sync-registry.py --dry-run # 打印将要写入的内容，不落盘
  python3 scripts/sync-registry.py --prune   # 同时移除本地已不存在的注册项

扫描规则:
  - skills/<name>、base/<name>：仅一层
  - projects/<name>：若自身是 git 仓则登记，不再下探
  - projects/<category>/<name>：当 category 本身不是 git 仓时登记
  - 跳过无 origin remote 的目录，以及 EXCLUDE_PREFIXES
  - 已有 desc 优先保留；新建项尝试从 README 提取一句说明
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
REGISTRY_PATH = ROOT_DIR / "registry.yaml"

SCAN_SPECS = (
    ("skills", 1),
    ("base", 1),
    ("projects", 2),
)

# 本地收藏/聚合目录，不进入正式 registry
EXCLUDE_PREFIXES = (
    "projects/awesome",
)

SECTION_ORDER = ("skills", "base", "projects")


@dataclass
class Entry:
    name: str
    repo: str
    path: str
    desc: str = ""

    @property
    def section(self) -> str:
        return self.path.split("/", 1)[0]


def is_git_repo(path: Path) -> bool:
    git = path / ".git"
    return git.is_dir() or git.is_file()


def git_origin(path: Path) -> str | None:
    try:
        result = subprocess.run(
            ["git", "-C", str(path), "remote", "get-url", "origin"],
            check=False,
            capture_output=True,
            text=True,
        )
    except OSError:
        return None
    if result.returncode != 0:
        return None
    url = result.stdout.strip()
    return url or None


def normalize_repo_url(url: str) -> str:
    url = url.strip()
    if url.startswith("git@"):
        # git@github.com:org/repo.git -> https://github.com/org/repo.git
        m = re.match(r"git@([^:]+):(.+)", url)
        if m:
            host, path = m.group(1), m.group(2)
            if not path.endswith(".git"):
                path += ".git"
            return f"https://{host}/{path}"
    if url.startswith("https://") and not url.endswith(".git"):
        return url + ".git"
    return url


def excluded(rel_path: str) -> bool:
    return any(
        rel_path == prefix or rel_path.startswith(prefix + "/")
        for prefix in EXCLUDE_PREFIXES
    )


def read_desc_from_readme(path: Path) -> str:
    for name in ("README.md", "README.zh.md", "readme.md"):
        readme = path / name
        if not readme.is_file():
            continue
        try:
            lines = readme.read_text(encoding="utf-8", errors="ignore").splitlines()
        except OSError:
            continue
        title = ""
        for raw in lines:
            line = raw.strip()
            if not line or line.startswith("```"):
                continue
            if line.startswith("#"):
                if not title:
                    title = re.sub(r"^#+\s*", "", line).strip()
                continue
            # strip blockquote / bold markers lightly
            line = re.sub(r"^>\s*", "", line)
            line = re.sub(r"\*+", "", line)
            line = line.strip()
            if line:
                return line[:120]
        if title:
            return title[:120]
    return ""


def scan_repos() -> list[Entry]:
    found: list[Entry] = []
    warnings: list[str] = []

    for root_name, max_depth in SCAN_SPECS:
        root = ROOT_DIR / root_name
        if not root.is_dir():
            continue

        if max_depth == 1:
            candidates = sorted(p for p in root.iterdir() if p.is_dir())
        else:
            candidates = []
            for child in sorted(p for p in root.iterdir() if p.is_dir()):
                rel_child = child.relative_to(ROOT_DIR).as_posix()
                if excluded(rel_child):
                    continue
                if is_git_repo(child):
                    candidates.append(child)
                else:
                    # category folder: look one level down
                    for nested in sorted(p for p in child.iterdir() if p.is_dir()):
                        candidates.append(nested)

        for path in candidates:
            rel = path.relative_to(ROOT_DIR).as_posix()
            if excluded(rel):
                continue
            if not is_git_repo(path):
                continue
            origin = git_origin(path)
            if not origin:
                warnings.append(f"[WARN] skip {rel}: no origin remote")
                continue
            found.append(
                Entry(
                    name=path.name,
                    repo=normalize_repo_url(origin),
                    path=rel,
                    desc=read_desc_from_readme(path),
                )
            )

    for w in warnings:
        print(w, file=sys.stderr)
    return found


def load_registry(path: Path) -> list[Entry]:
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8")
    try:
        import yaml

        data = yaml.safe_load(text) or {}
        items = data.get("projects") or []
    except ImportError:
        items = []
        for m in re.finditer(
            r"-\s+name:\s*(.+)\n\s+repo:\s*(.+)\n\s+path:\s*(.+?)(?:\n\s+desc:\s*(.+))?(?:\n|$)",
            text,
        ):
            items.append(
                {
                    "name": m.group(1).strip(),
                    "repo": m.group(2).strip(),
                    "path": m.group(3).strip(),
                    "desc": (m.group(4) or "").strip(),
                }
            )

    entries: list[Entry] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name") or "").strip()
        repo = str(item.get("repo") or "").strip()
        rel = str(item.get("path") or "").strip()
        desc = str(item.get("desc") or "").strip()
        if not name or not repo or not rel:
            continue
        entries.append(Entry(name=name, repo=repo, path=rel, desc=desc))
    return entries


def merge_entries(
    existing: list[Entry],
    scanned: list[Entry],
    *,
    prune: bool,
) -> tuple[list[Entry], list[str]]:
    by_path = {e.path: e for e in existing}
    scanned_by_path = {e.path: e for e in scanned}
    actions: list[str] = []

    # update / add from scan
    for path, scanned_entry in scanned_by_path.items():
        old = by_path.get(path)
        if old is None:
            by_path[path] = scanned_entry
            actions.append(f"+ add    {path} ({scanned_entry.repo})")
            continue

        updated = Entry(
            name=scanned_entry.name or old.name,
            repo=scanned_entry.repo or old.repo,
            path=path,
            desc=old.desc or scanned_entry.desc,
        )
        if updated.repo != old.repo:
            actions.append(f"~ repo   {path}: {old.repo} -> {updated.repo}")
        if updated.name != old.name:
            actions.append(f"~ name   {path}: {old.name} -> {updated.name}")
        if not old.desc and updated.desc:
            actions.append(f"~ desc   {path}: filled from README")
        by_path[path] = updated

    if prune:
        for path in list(by_path):
            if path not in scanned_by_path:
                actions.append(f"- prune  {path}")
                del by_path[path]
    else:
        for path in by_path:
            if path not in scanned_by_path:
                actions.append(f"= keep   {path} (registered, not present locally)")

    # stable section order, then path
    section_rank = {name: i for i, name in enumerate(SECTION_ORDER)}

    def sort_key(entry: Entry) -> tuple[int, str]:
        return (section_rank.get(entry.section, 99), entry.path)

    merged = sorted(by_path.values(), key=sort_key)
    return merged, actions


def render_registry(entries: list[Entry]) -> str:
    lines = [
        "# 项目注册表",
        "# 由 scripts/sync-registry.py 扫描同步；也可手工追加。",
        "# clone.py 会读取此文件，按 path 字段 clone 到对应目录",
        "",
        "projects:",
    ]

    current_section: str | None = None
    for entry in entries:
        section = entry.section if entry.section in SECTION_ORDER else "other"
        if section != current_section:
            lines.append(f"  # === {section} ===")
            current_section = section
        lines.append(f"  - name: {entry.name}")
        lines.append(f"    repo: {entry.repo}")
        lines.append(f"    path: {entry.path}")
        if entry.desc:
            lines.append(f"    desc: {entry.desc}")
        lines.append("")

    # trailing newline only once
    text = "\n".join(lines).rstrip() + "\n"
    return text


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n", 1)[0])
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument(
        "--check",
        action="store_true",
        help="检查 registry 是否与扫描结果一致；有差异则 exit 1",
    )
    mode.add_argument(
        "--dry-run",
        action="store_true",
        help="打印将写入内容，不修改文件",
    )
    parser.add_argument(
        "--prune",
        action="store_true",
        help="移除本地已不存在（或不可扫描）的注册项",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="少打日志（hook 场景）",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    existing = load_registry(REGISTRY_PATH)
    scanned = scan_repos()
    merged, actions = merge_entries(existing, scanned, prune=args.prune)
    new_text = render_registry(merged)
    old_text = REGISTRY_PATH.read_text(encoding="utf-8") if REGISTRY_PATH.exists() else ""

    meaningful = [a for a in actions if not a.startswith("= keep")]
    changed = new_text != old_text

    if not args.quiet:
        print(f"==> scanned {len(scanned)} repos, registry has {len(merged)} entries")
        if meaningful:
            print("==> changes:")
            for a in meaningful:
                print(f"    {a}")
        elif changed:
            print("==> formatting drift (content equivalent set, text differs)")
        else:
            print("==> registry already up to date")

    if args.check:
        if changed:
            print("[FAIL] registry.yaml is out of date; run: python3 scripts/sync-registry.py")
            return 1
        return 0

    if args.dry_run:
        print(new_text)
        return 0

    if changed:
        REGISTRY_PATH.write_text(new_text, encoding="utf-8")
        if not args.quiet:
            print(f"==> wrote {REGISTRY_PATH.relative_to(ROOT_DIR)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
