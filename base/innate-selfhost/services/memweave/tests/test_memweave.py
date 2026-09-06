"""memweave Stage 1 测试套件（SPEC 7 项，全部不依赖 sentence-transformers）。"""

import sqlite3
import threading
import time
from datetime import datetime, timedelta, timezone

import numpy as np
import pytest

from memweave import MemWeave, mmr, temporal_decay


@pytest.fixture()
def mw(tmp_path):
    """每个测试独立的记忆根目录。"""
    m = MemWeave(str(tmp_path / "mem"))
    yield m
    m.close()


# 1. 建库建表 + WAL 模式生效
def test_init_schema_and_wal(mw):
    conn = sqlite3.connect(mw.db_path)
    mode = conn.execute("PRAGMA journal_mode;").fetchone()[0]
    assert mode.lower() == "wal"
    tables = {r[0] for r in conn.execute(
        "SELECT name FROM sqlite_master WHERE type IN ('table','virtual table')")}
    assert {"memory_sessions", "memory_entities", "memory_chunks", "memory_fts"} <= tables
    conn.close()
    # synchronous 是连接级 pragma：在 MemWeave 自身连接上验证 NORMAL(=1)
    sync = mw._conn().execute("PRAGMA synchronous;").fetchone()[0]
    assert sync == 1  # NORMAL


# 2. write_memory 新增与冲突更新
def test_write_insert_and_conflict_update(mw):
    mw.create_session("s1", "u1", agent_id="a1")
    ids1 = mw.write_memory("a1", "s1", [{"key": "偏好", "value": "深色模式", "confidence": 0.9}])
    assert len(ids1) == 1
    time.sleep(0.01)
    # 同 session+key 第二次写入 → 更新而非新增
    ids2 = mw.write_memory("a1", "s1", [{"key": "偏好", "value": "浅色模式", "confidence": 0.95}])
    assert ids2 == ids1  # entity_id 不变
    conn = mw._conn()
    rows = conn.execute(
        "SELECT entity_value, updated_at, created_at FROM memory_entities WHERE entity_id = ?",
        (ids1[0],)).fetchall()
    assert len(rows) == 1
    assert rows[0]["entity_value"] == "浅色模式"
    assert rows[0]["updated_at"] > rows[0]["created_at"]  # updated_at 变化
    # chunk 同步更新且 FTS 可检索新值
    chunk = conn.execute("SELECT content FROM memory_chunks WHERE chunk_id = ?", (ids1[0],)).fetchone()
    assert "浅色模式" in chunk["content"]


# 3. 混合搜索召回 + 会话隔离
def test_hybrid_search_and_session_isolation(mw):
    mw.create_session("s1", "u1", agent_id="a1")
    mw.create_session("s2", "u1", agent_id="a1")
    mw.write_memory("a1", "s1", [
        {"key": "技术栈", "value": "喜欢 Python 和 SQLite", "confidence": 0.9},
        {"key": "饮食", "value": "不吃香菜", "confidence": 0.8},
    ])
    mw.write_memory("a1", "s2", [{"key": "技术栈", "value": "只用 Java", "confidence": 0.9}])
    results = mw.search("Python 技术栈", session_id="s1")
    assert results, "应能召回相关记忆"
    top = results[0]["content"]
    assert "Python" in top
    # 会话隔离：s1 的结果里不能出现 s2 的记忆
    assert all("Java" not in r["content"] for r in results)
    assert all("session:s1" in r["source_path"] for r in results)
    # 命中实体 access_count +1
    ent = mw._conn().execute(
        "SELECT access_count FROM memory_entities WHERE session_id='s1' AND entity_key='技术栈'"
    ).fetchone()
    assert ent["access_count"] >= 1


# 4. 时间衰减：同内容新记忆排名高于旧记忆
def test_temporal_decay_ranking(mw):
    mw.create_session("s1", "u1", agent_id="a1")
    old_id = mw.write_memory("a1", "s1", [{"key": "旧笔记", "value": "相同的部署经验", "confidence": 1.0}])[0]
    new_id = mw.write_memory("a1", "s1", [{"key": "新笔记", "value": "相同的部署经验", "confidence": 1.0}])[0]
    # 手工把旧记忆的 updated_at 拨回 30 天前
    old_time = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat(timespec="microseconds")
    mw._conn().execute("UPDATE memory_entities SET updated_at = ? WHERE entity_id = ?",
                       (old_time, old_id))
    mw._conn().commit()
    # 衰减公式本身
    assert temporal_decay(datetime.now(timezone.utc), 0) == pytest.approx(1.0, abs=0.01)
    assert temporal_decay(datetime.now(timezone.utc) - timedelta(days=10), 5) == pytest.approx(
        0.95 ** 10 * 1.5, rel=1e-3)
    results = mw.search("相同的部署经验", session_id="s1")
    assert len(results) >= 2
    scores = {r["chunk_id"]: r["score"] for r in results}
    assert scores[new_id] > scores[old_id], "新记忆分数应高于 30 天前的旧记忆"


# 5. MMR 输出数量与去重多样性
def test_mmr_diversity():
    rng = np.random.default_rng(42)
    query = rng.normal(size=384).astype(np.float32)
    base = rng.normal(size=384).astype(np.float32)
    candidates = []
    # 5 个几乎重复的候选（与 query 高相关但彼此雷同）
    for i in range(5):
        candidates.append({"id": f"dup{i}", "score": 0.9 - i * 0.01,
                           "embedding": base + rng.normal(scale=0.01, size=384).astype(np.float32)})
    # 5 个彼此不同的候选（相关性略低）
    for i in range(5):
        candidates.append({"id": f"div{i}", "score": 0.8,
                           "embedding": rng.normal(size=384).astype(np.float32)})
    ranked = mmr(candidates, query, lambda_=0.7, k=5)
    assert len(ranked) == 5  # 数量正确
    dup_count = sum(1 for c in ranked if c["id"].startswith("dup"))
    assert dup_count <= 3, f"MMR 应抑制雷同结果，实际重复项 {dup_count} 个"
    assert any(c["id"].startswith("div") for c in ranked), "应包含多样性结果"


# 6. index_all 索引 memory/*.md 后可被 search 命中
def test_index_all_markdown_truth(mw):
    md_dir = mw.root / "memory"
    (md_dir / "notes.md").write_text(
        "# 项目决策\n\n我们决定使用 SQLite 作为本地记忆存储。\n\n"
        "# 风险提示\n\n向量检索在大规模数据下需要量化。\n", encoding="utf-8")
    (md_dir / "guide.md").write_text(
        "# 部署指南\n\n使用 WAL 模式支持多 Agent 并发写入。\n", encoding="utf-8")
    n = mw.index_all()
    assert n >= 3  # 至少 3 个标题分块
    results = mw.search("WAL 多 Agent 并发")
    assert results, "Markdown 分块应可被 search 命中"
    assert any("WAL" in r["content"] for r in results)
    # 幂等：重复索引不会产生重复 chunk（uuid5 确定性 chunk_id）
    mw.index_all()
    count = mw._conn().execute("SELECT COUNT(*) c FROM memory_chunks").fetchone()["c"]
    assert count == n


# 7. 多线程并发写入（≥4 线程 × 20 条，WAL 不丢数据）
def test_concurrent_writes(mw):
    n_threads, n_facts = 4, 20
    mw.create_session("shared", "u1", agent_id="a0")

    def worker(tid):
        agent = f"agent_{tid}"
        mw.create_session(f"sess_{tid}", "u1", agent_id=agent)
        facts = [{"key": f"k{tid}_{i}", "value": f"线程{tid}的事实{i}", "confidence": 0.9}
                 for i in range(n_facts)]
        ids = mw.write_memory(agent, f"sess_{tid}", facts)
        assert len(ids) == n_facts

    threads = [threading.Thread(target=worker, args=(t,)) for t in range(n_threads)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    conn = mw._conn()
    total = conn.execute("SELECT COUNT(*) c FROM memory_entities").fetchone()["c"]
    assert total == n_threads * n_facts, f"并发写入丢数据：{total}"
    chunks = conn.execute("SELECT COUNT(*) c FROM memory_chunks").fetchone()["c"]
    assert chunks == n_threads * n_facts
    fts = conn.execute("SELECT COUNT(*) c FROM memory_fts").fetchone()["c"]
    assert fts == n_threads * n_facts
    # 并发后检索仍可用
    results = mw.search("线程2的事实5", session_id="sess_2")
    assert results and "线程2的事实5" in results[0]["content"]
