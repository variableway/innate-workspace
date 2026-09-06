#!/usr/bin/env python3
"""Clone / update the innate registry (registry-innate.yaml): apps under innate-apps/ plus base templates.

Same behavior as clone.py, but scoped to innate-related projects. Missing repos
are cloned into their declared path; already-existing repos are updated with
`git pull` (fetch + fast-forward merge). See clone.py for the shared logic.
"""

import argparse
from pathlib import Path

from clone import ROOT_DIR, run

DEFAULT_REGISTRY = ROOT_DIR / "registry-innate.yaml"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Batch clone / update innate-related projects declared in registry-innate.yaml"
    )
    parser.add_argument(
        "--registry",
        type=Path,
        default=DEFAULT_REGISTRY,
        help=f"Registry file to use (default: {DEFAULT_REGISTRY.name})",
    )
    args = parser.parse_args()
    run(args.registry)


if __name__ == "__main__":
    main()
