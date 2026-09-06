#!/usr/bin/env python3
"""Recursively scan directories, discover git repos and write to registry.yaml.

Scanning rules:
  - Recursively scan SCAN_DIRS (skills / base / projects / references),
    max 3 levels by default, adjustable with --depth N, 0 = unlimited
  - A directory is recorded if it is a git repo with an origin remote;
    no hosting platform restriction (GitHub / Gitee / GitLab etc.).
    SSH URLs in the form git@host:path are normalized to https://host/path
  - Recursion continues inside repos (a repo may nest independently cloned repos)
  - When the same repo appears at multiple paths, only the registered path is kept

Merge rules (source of truth is actual directory contents):
  - Existing entry matches by path -> keep name/desc, refresh repo
  - No path match but repo URL matches -> treated as a repo move, path updated automatically
  - No match at all (directory no longer exists) -> entry removed by default
    (--keep-missing keeps it)
  - --regenerate ignores the existing registry and rebuilds entirely from scan results
    (existing desc / name is not preserved, use with caution)

The innate-apps and base directories have their own registry
(registry-innate.yaml), handled by scripts/scan-innate-apps.py.
"""

import argparse
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
SCAN_DIRS = ["skills", "base", "projects", "references"]
REGISTRY = ROOT_DIR / "registry.yaml"
DEFAULT_DEPTH = 3

# Directory names skipped during recursion (build artifacts / dependency dirs,
# they contain nothing we want to register)
IGNORE_DIRS = {"node_modules", "venv", ".venv", "__pycache__", "dist", "build"}


def is_git_repo(path: Path) -> bool:
    """Supports standalone clones (.git directory) and submodules (.git file)."""
    git = path / ".git"
    return git.is_dir() or git.is_file()


def normalize_url(url: str) -> str:
    """git@host:owner/repo.git -> https://host/owner/repo.git"""
    if url.startswith("git@") and ":" in url:
        host, path = url[4:].split(":", 1)
        url = f"https://{host}/{path}"
    return url


def url_key(url: str) -> str:
    """Normalized comparison key for URLs: ignores protocol differences, trailing / and .git suffix."""
    return normalize_url(url).rstrip("/").removesuffix(".git")


def get_remote_url(path: Path) -> str | None:
    """Return the directory's origin remote URL (normalized), or None if absent."""
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
        if url:
            return normalize_url(url)
    except subprocess.CalledProcessError:
        pass
    return None


def scan_dir(name: str, max_depth: int) -> list[dict]:
    """Recursively scan one top-level directory and return the discovered git repos.

    Depth is counted from the top-level directory's direct children: 1 = direct children.
    max_depth = 0 means unlimited.
    A git repo is recorded and recursion continues inside it (nested standalone clones possible).
    """
    root = ROOT_DIR / name
    if not root.is_dir():
        return []

    found = []

    def walk(d: Path, depth: int) -> None:
        for entry in sorted(d.iterdir()):
            if not entry.is_dir() or entry.name.startswith(".") or entry.name in IGNORE_DIRS:
                continue
            url = get_remote_url(entry)
            if url:
                found.append(
                    {
                        "name": entry.name,
                        "repo": url,
                        "path": entry.relative_to(ROOT_DIR).as_posix(),
                        "desc": "",
                    }
                )
            # Keep descending even into repos: nested standalone clones must be found
            if max_depth == 0 or depth < max_depth:
                walk(entry, depth + 1)

    walk(root, 1)
    return found


def read_existing(registry: Path) -> list[dict]:
    """Read the existing registry entry list (preserving original order)."""
    if not registry.exists():
        return []
    text = registry.read_text(encoding="utf-8")
    try:
        import yaml

        data = yaml.safe_load(text)
        return data.get("projects", []) or []
    except ImportError:
        import re

        entries = re.findall(
            r"-\s+name:\s*(.+)\n\s+repo:\s*(.+?)\n\s+path:\s*(.+?)(?:\n\s+desc:\s*(.+?))?(?:\n|$)",
            text,
        )
        return [
            {
                "name": n.strip(),
                "repo": u.strip(),
                "path": p.strip(),
                "desc": d.strip() if d else "",
            }
            for n, u, p, d in entries
        ]


def section_of(path: str) -> str:
    """The section an entry belongs to.

    references/ keeps its prefix and is grouped by second-level dir
    (e.g. references/fe). innate-apps/ is grouped by its category folder
    name (e.g. tooling). Other paths are grouped by first-level dir.
    """
    parts = path.split("/")
    if len(parts) > 1 and parts[0] in ("references", "innate-apps"):
        if parts[0] == "innate-apps":
            return parts[1]
        return f"{parts[0]}/{parts[1]}"
    return parts[0]


def write_registry(
    projects: list[dict],
    registry: Path,
    synced_by: str = "scripts/scan.py",
    consumed_by: str | None = "clone-references.py",
) -> None:
    """Write a registry grouped by section."""
    order: list[str] = []
    groups: dict[str, list[dict]] = {}
    for p in projects:
        key = section_of(p.get("path", ""))
        if key not in groups:
            groups[key] = []
            order.append(key)
        groups[key].append(p)

    lines = [
        "# Project registry",
        f"# Synced by {synced_by}: source of truth is actual dir contents; entries are added/moved/deleted and desc is preserved",
    ]
    if consumed_by:
        lines.append(f"# {consumed_by} reads this file and clones each project into its path field")
    lines.append("")
    lines.append("projects:")
    for key in order:
        lines.append(f"  # === {key} ===")
        for p in groups[key]:
            lines.append(f"  - name: {p['name']}")
            lines.append(f"    repo: {p['repo']}")
            lines.append(f"    path: {p['path']}")
            if p.get("desc"):
                lines.append(f"    desc: {p['desc']}")
            lines.append("")

    # Drop the trailing blank line
    if lines and lines[-1] == "":
        lines.pop()

    registry.write_text("\n".join(lines) + "\n", encoding="utf-8")


# Default desc filled per section when a newly discovered entry lacks desc
DESC_BY_SECTION = {
    "references/content": "Content creation reference projects",
    "references/docs": "Documentation reference projects",
    "references/fe": "Frontend reference projects",
    "references/harness": "Harness/DSH plugin and tool reference projects",
    "references/papers": "Papers reference projects",
    "references/projects": "Reference projects",
    "references/router": "Router-related reference projects",
    "references/skills-hub": "Skill-related reference projects",
    "references/solutions": "Solutions reference projects",
    "references/tooling": "Tooling reference projects",
    "references/tutorials": "Tutorials/learning materials reference projects",
    "tooling": "Personal tooling apps",
    "content": "Content-related apps",
    "base": "Innate base/template projects",
}


def merge(
    existing: list[dict],
    discovered: list[dict],
    keep_missing: bool = False,
) -> tuple[list[dict], dict]:
    """Merge existing and discovered entries, returning (final list, change stats).

    Old entries whose directory no longer exists are removed by default;
    they are kept when keep_missing=True.
    """
    discovered_by_path = {p["path"]: p for p in discovered}
    discovered_by_url = {url_key(p["repo"]): p for p in discovered}

    final: list[dict] = []
    matched_paths: set[str] = set()
    moved: list[str] = []
    missing: list[dict] = []

    for old in existing:
        # Match by path first; if the path changed, match by repo URL (repo moved)
        new = discovered_by_path.get(old.get("path", ""))
        if new is None:
            new = discovered_by_url.get(url_key(old.get("repo", "")))
        if new is not None:
            entry = dict(new)
            if old.get("name"):
                entry["name"] = old["name"]
            if old.get("desc"):
                entry["desc"] = old["desc"]
            elif not entry.get("desc"):
                entry["desc"] = DESC_BY_SECTION.get(section_of(entry["path"]), "")
            if new["path"] != old.get("path"):
                moved.append(f"{old['path']} -> {new['path']}")
            final.append(entry)
            matched_paths.add(new["path"])
        else:
            # Directory no longer exists: remove by default (--keep-missing keeps it)
            missing.append(old)
            if keep_missing:
                final.append(old)

    # Append new entries to the end of their section; keep only one path per repo
    added: list[dict] = []
    dup: list[str] = []
    final_urls = {url_key(p["repo"]) for p in final}
    for p in discovered:
        if p["path"] in matched_paths:
            continue
        key = url_key(p["repo"])
        if key in final_urls:
            dup.append(p["path"])
            continue
        final_urls.add(key)
        if not p.get("desc"):
            p["desc"] = DESC_BY_SECTION.get(section_of(p["path"]), "")
        added.append(p)
        final.append(p)

    return final, {
        "moved": moved,
        "missing": missing,
        "added": added,
        "dup": dup,
    }


def run(
    scan_dirs: list[str],
    registry: Path,
    depth: int = DEFAULT_DEPTH,
    keep_missing: bool = False,
    regenerate: bool = False,
    synced_by: str = "scripts/scan.py",
    consumed_by: str | None = "clone-references.py",
) -> None:
    """Scan the given directories and merge the results into a registry file."""
    existing = [] if regenerate else read_existing(registry)
    discovered: list[dict] = []
    for d in scan_dirs:
        found = scan_dir(d, depth)
        discovered.extend(found)
        if found:
            print(f"[{d}] found {len(found)} repos (depth={depth}):")
            for p in found:
                print(f"    {p['path']}  ->  {p['repo']}")
        else:
            print(f"[{d}] no git repos found")
        print()

    final, changes = merge(existing, discovered, keep_missing=keep_missing)

    if changes["added"]:
        print(f"[added] {len(changes['added'])}:")
        for p in changes["added"]:
            print(f"    {p['path']}  ->  {p['repo']}")
    if changes["moved"]:
        print(f"[moved] {len(changes['moved'])} (matched by repo URL, path updated):")
        for m in changes["moved"]:
            print(f"    {m}")
    if changes["dup"]:
        print(f"[dedup] {len(changes['dup'])} (same as an already-registered repo, skipped):")
        for p in changes["dup"]:
            print(f"    {p}")
    if changes["missing"]:
        action = "kept" if keep_missing else "removed"
        print(f"[{action}] {len(changes['missing'])} directories no longer exist:")
        for p in changes["missing"]:
            print(f"    {p['path']}")
    print()

    write_registry(final, registry, synced_by=synced_by, consumed_by=consumed_by)
    print(
        f"==> Wrote {registry.relative_to(ROOT_DIR)}, "
        f"total {len(final)} projects (original {len(existing)}, "
        f"added {len(changes['added'])}, removed {0 if keep_missing else len(changes['missing'])})"
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Recursively scan directories, discover git repos and merge them into registry.yaml"
    )
    parser.add_argument(
        "dirs",
        nargs="*",
        default=None,
        help=f"Top-level directories to scan, default: {' '.join(SCAN_DIRS)}",
    )
    parser.add_argument(
        "--depth",
        type=int,
        default=DEFAULT_DEPTH,
        help=f"Recursion depth (1 = direct children only), 0 = unlimited, default: {DEFAULT_DEPTH}",
    )
    parser.add_argument(
        "--keep-missing",
        action="store_true",
        help="Keep entries whose directory no longer exists instead of removing them (default: remove)",
    )
    parser.add_argument(
        "--regenerate",
        action="store_true",
        help="Ignore the existing registry and rebuild entirely from scan results (existing name/desc not preserved)",
    )
    args = parser.parse_args()
    run(
        args.dirs or SCAN_DIRS,
        REGISTRY,
        depth=args.depth,
        keep_missing=args.keep_missing,
        regenerate=args.regenerate,
    )


if __name__ == "__main__":
    main()
