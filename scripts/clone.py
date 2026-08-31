#!/usr/bin/env python3
"""Read registry.yaml / registry.json and batch clone / update projects by declared path."""

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
    text = path.read_text(encoding="utf-8")

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

    print(f"[ERROR] Unsupported registry format: {suffix}")
    sys.exit(1)


def is_git_repo(path: Path) -> bool:
    git = path / ".git"
    return git.is_dir() or git.is_file()


def run_git(args: list[str], cwd: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=cwd,
        capture_output=True,
        text=True,
    )


def update_repo(target: Path, repo: str) -> str:
    """Fetch and fast-forward the existing repo. Returns status label."""
    remote = run_git(["remote", "get-url", "origin"], target)
    if remote.returncode == 0:
        current = remote.stdout.strip()
        if current.rstrip("/").removesuffix(".git") != repo.rstrip("/").removesuffix(".git"):
            print(f"[WARN] {target.relative_to(ROOT_DIR)} origin is {current}, registry is {repo}")
    else:
        run_git(["remote", "add", "origin", repo], target)

    fetch = run_git(["fetch", "--prune", "origin"], target)
    if fetch.returncode != 0:
        print(f"[ERROR] fetch failed: {target.relative_to(ROOT_DIR)}")
        print(fetch.stderr.strip())
        return "error"

    # Prefer upstream branch; fall back to origin/main or origin/master.
    upstream = run_git(["rev-parse", "--abbrev-ref", "@{u}"], target)
    if upstream.returncode == 0:
        target_ref = upstream.stdout.strip()
    else:
        for candidate in ("origin/main", "origin/master"):
            check = run_git(["rev-parse", "--verify", candidate], target)
            if check.returncode == 0:
                target_ref = candidate
                break
        else:
            print(f"[WARN] {target.relative_to(ROOT_DIR)} has no usable remote branch, skipping update")
            return "skipped"

    before = run_git(["rev-parse", "HEAD"], target).stdout.strip()
    pull = run_git(["merge", "--ff-only", target_ref], target)
    if pull.returncode != 0:
        # Dirty or diverged: leave working tree alone, report clearly.
        print(f"[WARN] {target.relative_to(ROOT_DIR)} cannot fast-forward to {target_ref}")
        detail = (pull.stderr or pull.stdout).strip()
        if detail:
            print(f"       {detail}")
        return "skipped"

    after = run_git(["rev-parse", "HEAD"], target).stdout.strip()
    if before == after:
        print(f"[OK]    {target.relative_to(ROOT_DIR)} is up to date")
        return "ok"
    print(f"[PULL]  {target.relative_to(ROOT_DIR)} {before[:7]} -> {after[:7]}")
    return "updated"


def main() -> None:
    registry = find_registry()
    if not registry:
        print("[ERROR] cannot find registry.yaml / registry.json")
        sys.exit(1)

    print(f"==> Registry: {registry.name}")

    projects = parse_registry(registry)
    if not projects:
        print("==> No projects in registry")
        return

    print("==> Found the following projects:")
    for p in projects:
        print(f"    {p.get('name', '?')} -> {p.get('repo', '?')}  ({p.get('path', '?')})")
    print()

    cloned = updated = skipped = errors = 0
    for p in projects:
        name = p.get("name", "?")
        repo = p.get("repo", "")
        rel_path = p.get("path", "")

        if not repo or not rel_path:
            print(f"[SKIP] {name}: repo or path missing")
            skipped += 1
            continue

        target = ROOT_DIR / rel_path
        if is_git_repo(target):
            status = update_repo(target, repo)
            if status == "updated":
                updated += 1
            elif status == "ok":
                skipped += 1
            elif status == "error":
                errors += 1
            else:
                skipped += 1
        elif target.exists() and any(target.iterdir()):
            print(f"[SKIP] {rel_path} exists but is not a git repository")
            skipped += 1
        else:
            print(f"[CLONE] {repo} -> {rel_path}")
            target.parent.mkdir(parents=True, exist_ok=True)
            result = subprocess.run(["git", "clone", repo, str(target)])
            if result.returncode != 0:
                print(f"[ERROR] clone failed: {rel_path}")
                errors += 1
            else:
                cloned += 1

    print(
        f"\n==> Done: cloned {cloned}, updated {updated}, "
        f"skipped/up-to-date {skipped}, failed {errors}"
    )
    if errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
