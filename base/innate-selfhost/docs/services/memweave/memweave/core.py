"""MemWeave 主类：SQLite Local-First AI 记忆层核心。

对应白皮书 1.1–1.7：
- 数据模型：memory_sessions / memory_entities / memory_chunks + FTS5
- 打开数据库即启用 WAL + synchronous=NORMAL（1.5 节多 Agent 并发）
- 混合搜索：BM25 * text_weight + 向量余弦 * vector_weight
- 时间衰减：0.95**days * (1+access_count*0.1)（1.4 节公式）
- MMR(lambda=0.7) 多样性重排；命中实体 access_count +1
- Markdown 为真相源：index_all 扫描 memory/*.md 重建索引
"""

from __future__ import annotations

import re
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

from .decay import mmr, temporal_decay
from .embeddings import Embedder


def _utcnow() -> str:
    """UTC 当前时间（ISO 格式字符串，便于排序与解析）。"""
    return datetime.now(timezone.utc).isoformat(timespec="microseconds")


# 建表 SQL（忠于白皮书 1.3 节数据模型）
_SCHEMA = """
CREATE TABLE IF NOT EXISTS memory_sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    agent_id TEXT,
    device_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS memory_entities (
    entity_id TEXT PRIMARY KEY,
    session_id TEXT,
    entity_key TEXT,
    entity_value TEXT,
    confidence REAL,
    source_agent TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    access_count INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS memory_chunks (
    chunk_id TEXT PRIMARY KEY,
    source_path TEXT,
    content TEXT,
    embedding BLOB,
    created_at TIMESTAMP
);
CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(content);
"""


class MemWeave:
    """SQLite Local-First 记忆层。

    参数：
        root: 记忆根目录，内含 memory.db 与 memory/*.md（自动创建）
    """

    def __init__(self, root: str):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        (self.root / "memory").mkdir(exist_ok=True)  # Markdown 真相源目录
        self.db_path = self.root / "memory.db"
        self.embedder = Embedder()
        # WAL 下多线程：每线程独立连接；写操作用锁串行化，避免 busy 竞争
        self._local = threading.local()
        self._write_lock = threading.Lock()
        with self._conn() as conn:
            # 打开数据库即执行 WAL pragma（SPEC 要求）
            conn.execute("PRAGMA journal_mode=WAL;")
            conn.execute("PRAGMA synchronous=NORMAL;")
            conn.executescript(_SCHEMA)
            conn.commit()

    # ---------- 连接管理 ----------
    def _conn(self) -> sqlite3.Connection:
        """获取当前线程的独立连接（check_same_thread=False 语义的线程本地实现）。"""
        conn = getattr(self._local, "conn", None)
        if conn is None:
            conn = sqlite3.connect(
                self.db_path,
                timeout=30.0,  # WAL 写冲突时自动重试等待
                check_same_thread=False,
            )
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA journal_mode=WAL;")
            conn.execute("PRAGMA synchronous=NORMAL;")
            conn.execute("PRAGMA busy_timeout=30000;")
            self._local.conn = conn
        return conn

    def close(self):
        conn = getattr(self._local, "conn", None)
        if conn is not None:
            conn.close()
            self._local.conn = None

    # ---------- 会话 ----------
    def create_session(self, session_id, user_id, agent_id=None, device_id=None):
        """创建（或刷新）会话；重复创建仅刷新 last_active。"""
        now = _utcnow()
        with self._write_lock, self._conn() as conn:
            conn.execute(
                """INSERT INTO memory_sessions
                       (session_id, user_id, agent_id, device_id, created_at, last_active)
                   VALUES (?, ?, ?, ?, ?, ?)
                   ON CONFLICT(session_id) DO UPDATE SET
                       last_active = excluded.last_active""",
                (session_id, user_id, agent_id, device_id, now, now),
            )
            conn.commit()
        return session_id

    # ---------- 写入 ----------
    def write_memory(self, agent_id, session_id, facts: list[dict]) -> list[str]:
        """写入结构化事实列表，返回 entity_id 列表。

        facts: [{key, value, confidence}]
        冲突检测：同 session+key 已存在则 UPDATE（保留历史 updated_at 变化），
        否则 INSERT；每条 fact 同时写入 memory_chunks + FTS + embedding。
        """
        entity_ids: list[str] = []
        with self._write_lock, self._conn() as conn:
            for fact in facts:
                key = str(fact["key"])
                value = str(fact["value"])
                confidence = float(fact.get("confidence", 1.0))
                # Step 2: 冲突检测（同一 session + key 是否已存在）
                row = conn.execute(
                    "SELECT entity_id, entity_value FROM memory_entities "
                    "WHERE session_id = ? AND entity_key = ?",
                    (session_id, key),
                ).fetchone()
                now = _utcnow()
                if row:
                    # 更新值，updated_at 变化（历史语义由时间戳体现）
                    entity_id = row["entity_id"]
                    conn.execute(
                        """UPDATE memory_entities
                           SET entity_value = ?, confidence = ?,
                               source_agent = ?, updated_at = ?
                           WHERE entity_id = ?""",
                        (value, confidence, agent_id, now, entity_id),
                    )
                else:
                    entity_id = f"ent_{uuid.uuid4().hex[:12]}"
                    conn.execute(
                        """INSERT INTO memory_entities
                               (entity_id, session_id, entity_key, entity_value,
                                confidence, source_agent, created_at, updated_at, access_count)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)""",
                        (entity_id, session_id, key, value, confidence,
                         agent_id, now, now),
                    )
                entity_ids.append(entity_id)
                # Step 3: 写入搜索索引（chunk + FTS + embedding）
                self._add_chunk(
                    conn,
                    chunk_id=entity_id,
                    source_path=f"agent:{agent_id}|session:{session_id}|type:entity",
                    content=f"{key}: {value}",
                )
            conn.execute(
                "UPDATE memory_sessions SET last_active = ? WHERE session_id = ?",
                (_utcnow(), session_id),
            )
            conn.commit()
        return entity_ids

    def _add_chunk(self, conn, chunk_id: str, source_path: str, content: str):
        """写入 chunk + embedding + FTS（已存在则覆盖更新）。"""
        emb = self.embedder.embed([content])[0]
        now = _utcnow()
        conn.execute(
            """INSERT INTO memory_chunks (chunk_id, source_path, content, embedding, created_at)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(chunk_id) DO UPDATE SET
                   source_path = excluded.source_path,
                   content = excluded.content,
                   embedding = excluded.embedding""",
            (chunk_id, source_path, content, emb.astype(np.float32).tobytes(), now),
        )
        rowid = conn.execute(
            "SELECT rowid FROM memory_chunks WHERE chunk_id = ?", (chunk_id,)
        ).fetchone()["rowid"]
        # FTS5 外部内容表：先删后插，保持同步
        conn.execute("DELETE FROM memory_fts WHERE rowid = ?", (rowid,))
        conn.execute("INSERT INTO memory_fts (rowid, content) VALUES (?, ?)", (rowid, content))

    # ---------- 检索 ----------
    def search(self, query: str, session_id: str | None = None, max_results=10,
               vector_weight=0.6, text_weight=0.4) -> list[dict]:
        """混合搜索：FTS5 BM25 * text_weight + 向量余弦 * vector_weight，
        再叠加时间衰减，最后 MMR(lambda=0.7) 重排；命中实体 access_count +1。
        session_id 非空时实现会话隔离。
        """
        conn = self._conn()
        query_emb = self.embedder.embed([query])[0]

        # 1) 向量候选：全量扫描（本地规模足够快），计算余弦相似度
        vec_scores: dict[str, float] = {}
        dim = self.embedder.dim
        q = query_emb / (np.linalg.norm(query_emb) or 1.0)
        for row in conn.execute(
            "SELECT chunk_id, embedding FROM memory_chunks WHERE embedding IS NOT NULL"
        ):
            emb = np.frombuffer(row["embedding"], dtype=np.float32)
            if emb.size != dim:
                continue
            n = np.linalg.norm(emb)
            if n == 0:
                continue
            vec_scores[row["chunk_id"]] = float(q @ (emb / n))

        # 2) FTS 候选：BM25 分数（FTS5 rank 越小越好，取负转为越大越好）
        fts_scores: dict[str, float] = {}
        fts_query = self._fts_query(query)
        if fts_query:
            try:
                for row in conn.execute(
                    """SELECT c.chunk_id, bm25(memory_fts) AS rank
                       FROM memory_fts f
                       JOIN memory_chunks c ON c.rowid = f.rowid
                       WHERE memory_fts MATCH ?
                       ORDER BY rank LIMIT 50""",
                    (fts_query,),
                ):
                    fts_scores[row["chunk_id"]] = -float(row["rank"])
            except sqlite3.OperationalError:
                pass  # 查询无法解析为 FTS 表达式时仅用向量通道

        # 3) 归一化并融合两个通道
        cand_ids = set(vec_scores) | set(fts_scores)
        if not cand_ids:
            return []
        vmax = max((abs(v) for v in vec_scores.values()), default=0.0) or 1.0
        tmin = min(fts_scores.values(), default=0.0)
        tmax = max(fts_scores.values(), default=0.0)
        tspan = (tmax - tmin) or 1.0

        candidates = []
        for chunk_id in cand_ids:
            row = conn.execute(
                "SELECT chunk_id, source_path, content FROM memory_chunks WHERE chunk_id = ?",
                (chunk_id,),
            ).fetchone()
            if row is None:
                continue
            # 会话隔离：source_path 中的 session 段必须匹配
            if session_id is not None and f"session:{session_id}|" not in row["source_path"]:
                continue
            v = (vec_scores.get(chunk_id, 0.0) + 1.0) / 2.0  # 余弦映射到 [0,1]
            t = (fts_scores.get(chunk_id, tmin) - tmin) / tspan if chunk_id in fts_scores else 0.0
            hybrid = vector_weight * v + text_weight * t

            # 4) 叠加时间衰减（实体记忆用 updated_at/access_count；md chunk 用 created_at）
            ent = conn.execute(
                "SELECT updated_at, access_count FROM memory_entities WHERE entity_id = ?",
                (chunk_id,),
            ).fetchone()
            if ent is not None:
                decay = temporal_decay(ent["updated_at"], ent["access_count"])
            else:
                crow = conn.execute(
                    "SELECT created_at FROM memory_chunks WHERE chunk_id = ?", (chunk_id,)
                ).fetchone()
                decay = temporal_decay(crow["created_at"], 0)
            score = hybrid * decay

            emb_row = conn.execute(
                "SELECT embedding FROM memory_chunks WHERE chunk_id = ?", (chunk_id,)
            ).fetchone()
            candidates.append({
                "chunk_id": chunk_id,
                "source_path": row["source_path"],
                "content": row["content"],
                "score": score,
                "embedding": np.frombuffer(emb_row["embedding"], dtype=np.float32)
                if emb_row["embedding"] is not None else np.zeros(dim, dtype=np.float32),
            })

        if not candidates:
            return []

        # 5) MMR 重排（lambda=0.7）保证多样性
        ranked = mmr(candidates, query_emb, lambda_=0.7, k=max_results)

        # 6) 命中实体的 access_count +1（影响后续衰减）
        hit_entities = [c["chunk_id"] for c in ranked]
        with self._write_lock:
            wconn = self._conn()
            wconn.executemany(
                "UPDATE memory_entities SET access_count = access_count + 1 WHERE entity_id = ?",
                [(e,) for e in hit_entities],
            )
            wconn.commit()

        for c in ranked:
            c.pop("embedding", None)  # 对外不暴露原始向量
        return ranked

    @staticmethod
    def _fts_query(query: str) -> str:
        """把自由文本转为安全的 FTS5 MATCH 表达式（OR 连接，提高召回）。"""
        tokens = re.findall(r"[A-Za-z0-9_]+|[一-鿿]", query.lower())
        return " OR ".join(f'"{t}"' for t in tokens[:32])

    # ---------- Markdown 真相源 ----------
    def index_all(self):
        """扫描 memory/*.md，按 Markdown 标题分块写入 chunks+FTS+embedding。"""
        indexed = 0
        with self._write_lock, self._conn() as conn:
            for md in sorted((self.root / "memory").glob("**/*.md")):
                rel = md.relative_to(self.root).as_posix()
                text = md.read_text(encoding="utf-8")
                for i, block in enumerate(self._split_by_headings(text)):
                    content = block.strip()
                    if not content:
                        continue
                    chunk_id = f"md_{uuid.uuid5(uuid.NAMESPACE_URL, f'{rel}#{i}').hex[:12]}"
                    self._add_chunk(conn, chunk_id=chunk_id, source_path=rel, content=content)
                    indexed += 1
            conn.commit()
        return indexed

    @staticmethod
    def _split_by_headings(text: str) -> list[str]:
        """按 Markdown 标题（# 开头）分块；标题行归入其后的块。"""
        blocks, current = [], []
        for line in text.splitlines():
            if re.match(r"^#{1,6}\s", line) and current:
                blocks.append("\n".join(current))
                current = [line]
            else:
                current.append(line)
        if current:
            blocks.append("\n".join(current))
        return blocks

    # ---------- 导出 ----------
    def export_markdown(self, session_id) -> str:
        """将 session 实体导出为 Markdown 文档。"""
        conn = self._conn()
        sess = conn.execute(
            "SELECT * FROM memory_sessions WHERE session_id = ?", (session_id,)
        ).fetchone()
        rows = conn.execute(
            "SELECT * FROM memory_entities WHERE session_id = ? ORDER BY updated_at DESC",
            (session_id,),
        ).fetchall()
        lines = [f"# 会话记忆导出：{session_id}", ""]
        if sess:
            lines += [
                f"- 用户：{sess['user_id']}",
                f"- Agent：{sess['agent_id'] or '-'}",
                f"- 创建时间：{sess['created_at']}",
                f"- 最近活跃：{sess['last_active']}",
                "",
                "## 记忆实体",
                "",
            ]
        for r in rows:
            lines.append(
                f"- **{r['entity_key']}**：{r['entity_value']}"
                f"（置信度 {r['confidence']:.2f}，访问 {r['access_count']} 次，"
                f"更新于 {r['updated_at']}，来源 {r['source_agent'] or '-'}）"
            )
        return "\n".join(lines) + "\n"
