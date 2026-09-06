"""时间衰减与 MMR 多样性重排（对应白皮书 1.4 节公式）。"""

from __future__ import annotations

from datetime import datetime, timezone

import numpy as np


def _to_dt(ts) -> datetime:
    """将时间戳统一解析为带时区的 datetime。"""
    if isinstance(ts, datetime):
        return ts if ts.tzinfo else ts.replace(tzinfo=timezone.utc)
    s = str(ts).replace("Z", "+00:00")
    dt = datetime.fromisoformat(s)
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def temporal_decay(updated_at, access_count: int, half_life_rate: float = 0.95) -> float:
    """时间衰减因子（白皮书 1.4 公式）：

        score_factor = 0.95 ** days_since(updated) * (1 + access_count * 0.1)

    参数：
        updated_at: 最后更新时间（datetime 或 ISO 字符串）
        access_count: 历史访问次数
        half_life_rate: 每日保留率，默认 0.95
    """
    days = max(0.0, (datetime.now(timezone.utc) - _to_dt(updated_at)).total_seconds() / 86400.0)
    return (half_life_rate ** days) * (1.0 + access_count * 0.1)


def mmr(candidates: list[dict], query_emb: np.ndarray, lambda_: float = 0.7, k: int = 10) -> list[dict]:
    """标准 MMR（Maximal Marginal Relevance）重排。

    每个候选 dict 需包含：
        - "score": 与查询的相关性分数（越大越好）
        - "embedding": 候选向量（np.ndarray）

    选择准则：
        argmax [ lambda_ * rel(c) - (1 - lambda_) * max_sim(c, 已选集合) ]

    参数：
        lambda_: 相关性/多样性权衡，0.7 表示偏相关性
        k: 最终返回数量
    """
    if not candidates or k <= 0:
        return []
    query_emb = np.asarray(query_emb, dtype=np.float32).ravel()

    # 预计算候选向量矩阵并归一化，便于余弦相似度
    embs = np.stack([np.asarray(c["embedding"], dtype=np.float32).ravel() for c in candidates])
    norms = np.linalg.norm(embs, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    embs = embs / norms
    q = query_emb / (np.linalg.norm(query_emb) or 1.0)

    # 直接使用原始相关性分数（上游混合打分与余弦同处 [0,1] 量纲）
    rel = np.array([float(c.get("score", 0.0)) for c in candidates], dtype=np.float32)

    selected: list[int] = []
    remaining = set(range(len(candidates)))
    while remaining and len(selected) < k:
        best_idx, best_val = None, -np.inf
        for i in remaining:
            redundancy = max(float(embs[i] @ embs[j]) for j in selected) if selected else 0.0
            val = lambda_ * float(rel[i]) - (1.0 - lambda_) * redundancy
            if val > best_val:
                best_idx, best_val = i, val
        selected.append(best_idx)
        remaining.discard(best_idx)
    return [candidates[i] for i in selected]
