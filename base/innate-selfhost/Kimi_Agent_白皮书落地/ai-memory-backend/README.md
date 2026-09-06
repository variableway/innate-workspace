# AI Memory & Backend — 白皮书工程实现

《AI 原生后端与本地记忆层技术方案白皮书》（2026-08-13）的可运行落地实现。

## 目录结构

| 目录 | 对应白皮书章节 | 内容 |
|------|---------------|------|
| `memweave/` | 第一部分（1.1–1.7） | SQLite Local-First AI 记忆层，纯 Python 实现 |
| `baas/` | 第二部分（2.2 / 2.4 Tier 2 / 2.5 方案 B） | 去 Supabase 化自托管 BaaS Docker Compose 栈 |
| `baas/lazycat/` | 同上 | 懒猫私有云（LazyCat）LPK 打包配置 + 一键部署脚本 |
| `SPEC.md` | — | 实现契约（接口、数据模型、公式） |

## 快速开始

### 1. memweave —— 本地记忆层

```bash
cd memweave
pip install numpy pytest        # 可选增强：pip install sentence-transformers
python -m pytest -q             # 7 项测试全绿

PYTHONPATH=. python -m memweave init --root ./demo
PYTHONPATH=. python -m memweave add --root ./demo --session sess_1 --user u1 --agent a1 \
    --fact '{"key":"用户偏好","value":"喜欢深色模式","confidence":0.95}'
PYTHONPATH=. python -m memweave search --root ./demo --query "用户喜欢什么" --session sess_1
PYTHONPATH=. python -m memweave index --root ./demo   # 索引 memory/*.md（Markdown 真相源）
PYTHONPATH=. python -m memweave export --root ./demo --session sess_1
```

已实现白皮书核心机制：FTS5 BM25 + 向量混合搜索（0.4/0.6 权重）、时间衰减
`0.95^days × (1+0.1×access_count)`、MMR 重排（λ=0.7）、会话隔离、冲突检测更新、
WAL 多 Agent 并发、Markdown 真相源分块索引。

> 说明：白皮书中 SQLite Cloud 的 ai/memory/vector/sync 为商业 C 扩展，本实现以标准库
> sqlite3 + numpy 提供等效能力；本地 embedding 优先 sentence-transformers，缺失时自动
> 降级为确定性哈希向量，零外部依赖可运行。

### 2. baas —— 自托管 BaaS

```bash
cd baas
cp .env.example .env            # 修改密码与密钥
docker compose up -d
```

组件映射：ParadeDB→Postgres、PostgREST→REST API、Authentik→GoTrue、
Mercure→Realtime、MinIO→Storage、Traefik→Kong。详见 `baas/README.md`。

> PostgREST 为**可选层**（自动 REST API）：可删除/替换（Hasura、pREST）或
> `docker compose up -d --scale postgrest=0` 停用，详见 `baas/lazycat/README.md`。

**懒猫私有云部署**：

```bash
cd baas/lazycat
npm install -g @lazycatcloud/lzc-cli
bash deploy.sh          # 打包 LPK 并安装到默认盒子；--build 只打包
```

## 验证状态
- `memweave`：pytest 7/7 通过（含 4 线程 × 20 条并发写入测试）
- `baas`：compose YAML 解析通过（运行环境无 docker，未实际启动容器）
