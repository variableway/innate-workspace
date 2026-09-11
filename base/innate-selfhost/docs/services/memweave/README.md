# memweave —— SQLite Local-First AI 记忆层

对应白皮书《AI 原生后端与本地记忆层技术方案》第一部分（1.1–1.7）。
零云依赖、单文件可迁移、多 Agent 可共享的本地记忆层：**纯标准库 `sqlite3` + `numpy` 即可运行全部功能**。

## 特性

- **数据模型**（忠于白皮书 1.3 节）
  - `memory_sessions`：会话注册表（user/agent/device）
  - `memory_entities`：结构化实体，支持冲突检测与合并
  - `memory_chunks` + FTS5 虚拟表 `memory_fts`：向量 BLOB（float32）+ BM25 全文检索
  - 打开数据库即执行 `PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;`
- **混合搜索**：FTS5 BM25 × `text_weight(0.4)` + 向量余弦相似度 × `vector_weight(0.6)` 融合排序
- **时间衰减**：`score *= 0.95 ** days_since(updated) * (1 + access_count * 0.1)`（1.4 节公式）
- **MMR 多样性重排**：`lambda = 0.7`，抑制雷同结果
- **会话隔离**：`search(..., session_id=...)` 只返回该会话的记忆；命中实体 `access_count +1`
- **Markdown 真相源**：`index_all()` 扫描 `memory/*.md`，按标题分块重建索引（可 git diff）
- **多 Agent 并发**：WAL 模式 + 每线程独立连接 + 写锁串行化，并发写入不丢数据
- **Embedding 自适应**：优先 sentence-transformers（all-MiniLM-L6-v2），
  缺失时自动降级为 **384 维确定性哈希向量**（token 哈希 + L2 归一化），功能完整可用

## 安装

```bash
pip install -e .            # 最小依赖：仅 numpy
pip install -e .[semantic]  # 可选：启用 sentence-transformers 语义向量
pip install -e .[test]      # 测试依赖
```

## Python API

```python
from memweave import MemWeave

mw = MemWeave("./memweave-data")              # 自动建库、建表、启用 WAL
mw.create_session("sess_1", user_id="u1", agent_id="agent_a")

# 写入（冲突检测：同 session+key 已存在则 UPDATE，否则 INSERT）
mw.write_memory("agent_a", "sess_1", [
    {"key": "技术栈", "value": "喜欢 Python 和 SQLite", "confidence": 0.9},
])

# 混合搜索（向量 0.6 + BM25 0.4 → 时间衰减 → MMR）
results = mw.search("用户喜欢什么技术栈", session_id="sess_1", max_results=10)

mw.index_all()                       # 索引 memory/*.md（Markdown 真相源）
print(mw.export_markdown("sess_1"))  # 导出会话记忆为 Markdown
```

## 命令行

```bash
python -m memweave --root ./data init
python -m memweave --root ./data add --session s1 --user u1 --agent a1 \
    --key 偏好 --value 深色模式 --confidence 0.9
python -m memweave --root ./data search "深色模式" --session s1
python -m memweave --root ./data index
python -m memweave --root ./data export --session s1
```

## 测试

```bash
cd memweave && python -m pytest -q   # 7 项测试，零外部依赖全绿
```

覆盖：建库建表与 WAL、冲突检测更新、混合搜索与会话隔离、时间衰减排序、
MMR 多样性、`index_all` 召回、4 线程 × 20 条并发写入不丢数据。

## 目录结构

```
memweave-data/
├── memory.db        # 单文件数据库（向量 + 全文 + 原始数据）
└── memory/*.md      # Markdown 真相源（可 git 管理）
```
