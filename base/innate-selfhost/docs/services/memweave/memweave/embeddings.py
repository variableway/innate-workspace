"""本地 embedding 模块。

优先使用 sentence-transformers（all-MiniLM-L6-v2）；
导入失败或模型加载失败时自动降级为 384 维确定性哈希向量，
保证零外部依赖也能运行全部功能。
"""

from __future__ import annotations

import hashlib
import re

import numpy as np

# 哈希向量维度：与 all-MiniLM-L6-v2 保持一致，便于将来无缝替换
_HASH_DIM = 384


class _HashEmbedder:
    """确定性哈希向量：token 哈希 + L2 归一化（零依赖兜底方案）。"""

    def __init__(self, dim: int = _HASH_DIM):
        self.dim = dim

    def encode(self, texts: list[str]) -> np.ndarray:
        vecs = np.zeros((len(texts), self.dim), dtype=np.float32)
        for i, text in enumerate(texts):
            # 按中英字符/单词切 token；中文按字处理保证可检索性
            tokens = re.findall(r"[A-Za-z0-9_]+|[一-鿿]", text.lower())
            if not tokens:
                tokens = [text]  # 空文本兜底，保证向量可计算
            for tok in tokens:
                digest = hashlib.sha256(tok.encode("utf-8")).digest()
                # 用哈希前 4 字节决定槽位，第 5 字节决定符号，模拟随机投影
                slot = int.from_bytes(digest[:4], "little") % self.dim
                sign = 1.0 if digest[4] % 2 == 0 else -1.0
                vecs[i, slot] += sign
        # L2 归一化，使点积即余弦相似度
        norms = np.linalg.norm(vecs, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        return vecs / norms


class _STEmbedder:
    """sentence-transformers 封装（可选增强）。"""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        from sentence_transformers import SentenceTransformer

        self._model = SentenceTransformer(model_name)
        self.dim = int(self._model.get_sentence_embedding_dimension())

    def encode(self, texts: list[str]) -> np.ndarray:
        arr = self._model.encode(texts, normalize_embeddings=True)
        return np.asarray(arr, dtype=np.float32)


class Embedder:
    """统一 embedding 入口：自动选择后端。

    接口：
        embed(texts: list[str]) -> np.ndarray, 形状 (n, dim)
        dim 属性：向量维度
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        try:
            self._backend = _STEmbedder(model_name)
            self.backend = "sentence-transformers"
        except Exception:
            # 导入失败或模型下载失败 → 降级为哈希向量
            self._backend = _HashEmbedder(_HASH_DIM)
            self.backend = "hash"
        self.dim = self._backend.dim

    def embed(self, texts: list[str]) -> np.ndarray:
        """将文本列表编码为 (n, dim) 的 float32 矩阵。"""
        if not texts:
            return np.zeros((0, self.dim), dtype=np.float32)
        return self._backend.encode(list(texts))
