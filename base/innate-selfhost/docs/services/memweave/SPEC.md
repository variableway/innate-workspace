# SPEC — AI Memory & Backend（白皮书工程实现）

源文档：/mnt/agents/upload/AI_Memory_and_Backend_Alternatives_Whitepaper.md（唯一事实来源，接口与公式必须忠于它）

## 项目结构
```
ai-memory-backend/
├── memweave/                  # Stage 1 产物（branch: feat/memweave）
│   ├── memweave/
│   │   ├── __init__.py        # 导出 MemWeave
│   │   ├── core.py            # MemWeave 主类
│   │   ├── embeddings.py      # 本地 embedding（sentence-transformers 可选，哈希向量兜底）
│   │   ├── decay.py           # 时间衰减 + MMR
│   │   └── cli.py             # python -m memweave ...
│   ├── tests/test_memweave.py
│   ├── pyproject.toml
│   └── README.md
├── baas/                      # Stage 2 产物（branch: feat/baas）
│   ├── docker-compose.yml
│   ├── init.sql
│   ├── .env.example
│   └── README.md
└── SPEC.md
```

## Stage 1 — memweave（SQLite Local-First 记忆层）
对应白皮书 1.1–1.7。SQLite Cloud C 扩展不可得，用标准库 sqlite3 实现等效能力。

### 数据模型（忠于 1.3 节）
- memory_sessions(session_id PK, user_id NOT NULL, agent_id, device_id, created_at, last_active)
- memory_entities(entity_id PK, session_id, entity_key, entity_value, confidence, source_agent, created_at, updated_at, access_count DEFAULT 0)
- memory_chunks(chunk_id PK, source_path, content, embedding BLOB float32, created_at) + FTS5 虚拟表 memory_fts(content) 做 BM25 全文检索
- 打开数据库即执行 `PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;`

### MemWeave 类接口（core.py）
```python
class MemWeave:
    def __init__(self, root: str): ...            # root 含 memory.db 与 memory/*.md；自动建表、WAL
    def create_session(self, session_id, user_id, agent_id=None, device_id=None): ...
    def write_memory(self, agent_id, session_id, facts: list[dict]) -> list[str]:
        # facts: [{key, value, confidence}]；冲突检测：同 session+key 已存在则 UPDATE（保留历史 updated_at），否则 INSERT；
        # 每条 fact 同时写入 memory_chunks + FTS + embedding（对应 1.4 写入流程）
    def search(self, query: str, session_id: str|None=None, max_results=10,
               vector_weight=0.6, text_weight=0.4) -> list[dict]:
        # 混合搜索：FTS5 BM25 分数 * text_weight + 向量余弦相似度 * vector_weight 融合排序
        # 再叠加时间衰减：score *= 0.95**days_since(updated) * (1+access_count*0.1)（1.4 节公式）
        # 最后 MMR 重排（lambda=0.7）保证多样性；命中实体的 access_count +1
        # session_id 非空时实现会话隔离
    def index_all(self): ...   # 扫描 memory/*.md，按 Markdown 标题分块写入 chunks+FTS+embedding（Markdown 为真相源）
    def export_markdown(self, session_id) -> str: ...  # 将 session 实体导出为 Markdown
```

### embeddings.py
- 优先 `from sentence_transformers import SentenceTransformer`（模型 all-MiniLM-L6-v2）；导入失败或下载失败时自动降级为确定性哈希向量（384 维，token 哈希 + 归一化），保证零依赖可运行。
- 接口：`embed(texts: list[str]) -> np.ndarray (n, dim)`，`dim` 属性。

### decay.py
- `temporal_decay(updated_at, access_count, half_life_rate=0.95)` → 0.95**days * (1+0.1*access_count)
- `mmr(candidates, query_emb, lambda_=0.7, k=10)` → 标准 MMR 重排

### cli.py
`python -m memweave init|add|search|index|export`（argparse），输出可读表格。

### 测试（tests/test_memweave.py，pytest，必须全绿）
1. 建库建表 + WAL 模式生效
2. write_memory 新增与冲突更新（同 key 第二次写入→更新且 updated_at 变化）
3. 混合搜索能召回相关记忆；session 隔离生效（别的 session 查不到）
4. 时间衰减使新记忆排名高于旧记忆（同内容不同时间）
5. MMR 输出数量与去重多样性
6. index_all 索引 memory/*.md 后可被 search 命中
7. 多线程并发写入（模拟多 Agent，WAL 不丢数据，≥4 线程 × 20 条）

## Stage 2 — baas（去 Supabase 化自托管 BaaS，对应白皮书 2.2 Skill 2 / 方案 B / Tier 2）
- docker-compose.yml：paradedb/paradedb:latest（db）+ postgrest/postgrest + authentik（ghcr.io/goauthentik/server）+ minio + mercure（dunglas/mercure）+ traefik 反代；健康检查、depends_on、命名卷、端口 5432/3000/9000/9001/8000。
- init.sql（挂入 db 初始化）：`CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS pg_search;`、示例多租户表 tenants/documents（embedding vector(384)）、Row Level Security 策略示例、pg_cron 定时任务注释示例。
- .env.example + README.md（启动步骤、各组件替代了 Supabase 的哪个组件、成本说明）。

## 质量门
- Stage 1：`cd memweave && python -m pytest -q` 全绿（不依赖 sentence-transformers 也要绿）
- Stage 2：`docker compose config -q` 通过（无 docker 时用 python yaml 解析校验）
- 全程中文注释/文档
