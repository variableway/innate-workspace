#!/usr/bin/env python3
"""Recursively scan innate-apps, base, and skills; write to registry/apps.yaml.

Same behavior as scripts/scan.py, but scoped to innate-related directories
(innate-apps apps, base templates, and companion skills) and their own registry.
See scan.py for the full scanning / merge rules.
"""

import argparse
from pathlib import Path

from scan import ROOT_DIR, run

SCAN_DIRS = ["innate-apps", "base", "skills"]
REGISTRY = ROOT_DIR / "registry" / "apps.yaml"
DEFAULT_DEPTH = 3


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Recursively scan innate-apps, base, and skills; merge git repos into registry/apps.yaml"
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
        synced_by="scripts/scan-innate-apps.py",
        consumed_by="clone-innate.py",
    )


if __name__ == "__main__":
    main()
