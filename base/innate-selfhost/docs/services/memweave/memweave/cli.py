"""memweave 命令行入口：python -m memweave init|add|search|index|export"""

from __future__ import annotations

import argparse
import sys

from .core import MemWeave


def _print_table(headers: list[str], rows: list[list[str]]):
    """以可读表格形式输出结果。"""
    widths = [len(h) for h in headers]
    for r in rows:
        for i, cell in enumerate(r):
            widths[i] = max(widths[i], len(str(cell)))
    fmt = "  ".join(f"{{:<{w}}}" for w in widths)
    print(fmt.format(*headers))
    print(fmt.format(*["-" * w for w in widths]))
    for r in rows:
        print(fmt.format(*[str(c) for c in r]))


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(prog="memweave", description="SQLite Local-First AI 记忆层")
    parser.add_argument("--root", default="./memweave-data", help="记忆根目录（含 memory.db 与 memory/*.md）")
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("init", help="初始化数据库与目录")

    p_add = sub.add_parser("add", help="写入一条记忆")
    p_add.add_argument("--session", required=True)
    p_add.add_argument("--user", default="cli-user")
    p_add.add_argument("--agent", default="cli")
    p_add.add_argument("--key", required=True)
    p_add.add_argument("--value", required=True)
    p_add.add_argument("--confidence", type=float, default=1.0)

    p_search = sub.add_parser("search", help="混合搜索记忆")
    p_search.add_argument("query")
    p_search.add_argument("--session", default=None)
    p_search.add_argument("--max", type=int, default=10)

    sub.add_parser("index", help="索引 memory/*.md（Markdown 真相源）")

    p_export = sub.add_parser("export", help="导出会话记忆为 Markdown")
    p_export.add_argument("--session", required=True)

    args = parser.parse_args(argv)
    mw = MemWeave(args.root)

    if args.cmd == "init":
        print(f"已初始化：{mw.db_path}（embedding 后端：{mw.embedder.backend}，维度 {mw.embedder.dim}）")
    elif args.cmd == "add":
        mw.create_session(args.session, args.user, agent_id=args.agent)
        ids = mw.write_memory(args.agent, args.session,
                              [{"key": args.key, "value": args.value, "confidence": args.confidence}])
        _print_table(["entity_id", "key", "value"], [[ids[0], args.key, args.value]])
    elif args.cmd == "search":
        results = mw.search(args.query, session_id=args.session, max_results=args.max)
        _print_table(
            ["score", "chunk_id", "content"],
            [[f"{r['score']:.4f}", r["chunk_id"], r["content"][:60]] for r in results],
        )
    elif args.cmd == "index":
        n = mw.index_all()
        print(f"已索引 {n} 个 Markdown 分块")
    elif args.cmd == "export":
        sys.stdout.write(mw.export_markdown(args.session))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
