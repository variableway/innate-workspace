# 第六章 SQLite Local Memory × PostgreSQL 的协同与演进

前五章比较的是"中枢侧"的方案选型；本章回答一个更前瞻的问题：当团队已经有（或将有）PG 底座，又想用 SQLite 做 local-first 的 AI 记忆，两者如何分工、同步、共同演进？结论先行：**这不是二选一，而是"端侧真相源 + 中枢系统记录"的双层架构**——SQLite 赢在它天然是端侧的唯一选项（零部署、离线、隐私），PG 赢在它天然是中枢的唯一选项（多租户、审计、共享）。本报告项目内已交付的 memweave 参考实现（FTS5+向量混合搜索、时间衰减、MMR、WAL 多 Agent 并发、Markdown 真相源，pytest 7/7 通过）将作为全章的工程参照 [^21^]。

## 6.1 分工模型：端侧真相源 × 中枢系统记录

分工的第一性原理是"数据的物理归属"：随人/随设备走的数据放 SQLite，随组织/随系统走的数据放 PG。memweave 的设计把这条边界落实得很干净——`memory.db` 单文件 + `memory/*.md` Markdown 真相源可以 git 管理、整体拷走，这是 PG 永远做不到的部署形态；而跨用户共享、合规审计、服务多租户，则是 SQLite 永远无法承担的角色。

| 数据类别 | 放哪边 | 为什么 |
|---|---|---|
| 个人偏好、对话上下文、Agent 工作记忆 | SQLite（memweave） | 隐私敏感、离线可写、随设备迁移、零成本 |
| Markdown 记忆真相源 | SQLite 侧文件系统 | 可 git diff、可人工审阅，PG 里反而不可读 |
| 用户账号、权限、计费、审计日志 | PG | 多租户强一致、RLS、合规留痕 |
| 跨团队共享的知识沉淀、已脱敏记忆聚合 | PG | 需要共享检索与权限治理 |
| 高频写、低价值的临时观察 | SQLite（异步汇聚） | 避免端侧写入打爆中枢连接池 |

一句话判词：**SQLite 是"我的记忆"，PG 是"我们的事实"**；混淆两者（把个人记忆直接写中枢，或把共享事实留在端侧）是最常见的架构错误。

## 6.2 同步与互操作路径（按可实现性排序）

**路径一：应用层批量同步（今天就能做，推荐起点）。** 用 Python 脚本定期把 memweave 的实体 UPSERT 进 PG，简单、可控、易调试：

```python
import sqlite3, psycopg
src = sqlite3.connect("memweave-data/memory.db")
dst = psycopg.connect("postgresql://app@hub/central")
rows = src.execute(
    "SELECT session_id,key,value,confidence,updated_at FROM memory_entities").fetchall()
with dst.cursor() as cur:
    cur.executemany("""
        INSERT INTO memory_hub(session_id,key,value,confidence,updated_at)
        VALUES (%s,%s,%s,%s,%s)
        ON CONFLICT (session_id,key) DO UPDATE
        SET value=EXCLUDED.value, updated_at=EXCLUDED.updated_at
        WHERE memory_hub.updated_at < EXCLUDED.updated_at""", rows)
dst.commit()
```

要点：以 `(session_id, key)` 为幂等键，用 `updated_at` 做 last-write-wins 裁决——与 memweave 内置的冲突检测语义对齐，同步天然幂等，可放心跑在 cron 里。

**路径二：DuckDB 作为查询胶水（本周就能做，分析场景首选）。** DuckDB 可同时 ATTACH SQLite 文件和 PG 库，一条 SQL 完成跨库联合查询，无需落地任何管道 [^24^]：

```sql
ATTACH 'memweave-data/memory.db' AS mem (TYPE SQLITE);
ATTACH 'postgresql://app@hub/central' AS hub (TYPE POSTGRES);
SELECT e.key, e.value, u.plan
FROM mem.memory_entities e
JOIN hub.users u ON u.session_id = e.session_id
WHERE e.confidence > 0.8;
```

要点：这是"读侧互操作"的最优解——分析师/Agent 需要联合查询时即席执行，不需要预先同步；配合第五章的 DuckDB 嵌入式 OLAP 定位，它在这里扮演的是"联邦查询胶水"而非存储层。

**路径三：PG FDW / 逻辑复制（长期方向，谨慎评估）。** 理论上可用 `sqlite_fdw` 让 PG 直接挂载端侧库、或以逻辑复制订阅端侧变更流；但现实中端侧设备不常驻、网络不稳定，FDW 的推拉模型并不适合"离线优先"拓扑。此路径更适合"端侧常驻在线"的特殊形态（如门店网关设备），一般团队建议止步于路径一/二。

## 6.3 扩展层演进：记忆逻辑下沉进 PG

memweave 的三块核心记忆逻辑——时间衰减（`0.95^days × (1+0.1·access_count)`）、MMR 多样性重排、冲突合并——目前是约百行级 Python。白皮书已明确判断：SQLite 方案牺牲 mem0 的开箱即用，换取数据主权，记忆逻辑层"需 100-200 行 Python 自行实现" [^20^]。关键在于，这 100-200 行代码是**可迁移资产而非沉没成本**：

- **时间衰减**本质是排序键上的一个标量函数，写成 PG 存储过程不过十余行 PL/pgSQL，或直接内联进 `ORDER BY`；配合 pgvector 的 `ORDER BY embedding <=> $q` 即可在同一查询里完成"向量召回 × 时间衰减"。
- **MMR** 是"贪心选下一个与已选集合最不相似的结果"，可用存储过程循环 + pgvector 距离算子实现，或作为 pgai 的后处理任务。
- **冲突合并** 的 `(session_id,key)` UPSERT 语义与 PG 的 `ON CONFLICT` 一一对应（见 6.2 代码），甚至因为 PG 有条件更新（`WHERE ... updated_at < EXCLUDED.updated_at`）而表达得更精确。
- **向量化回灌**：端侧 SQLite 可以只存文本，embedding 由 PG 侧的 pgai 任务统一生成（避免端侧跑模型），检索时混合 pg_search 的 BM25——这正是 ParadeDB"一个库做混合搜索"（2.4 节）的自然延伸 [^23^]。

概念映射上，**SQLite-Sync 的 CRDT ↔ PG 的逻辑复制**是对偶关系：前者解决"无中心的副本最终一致"，后者解决"有中心的变更分发"。一个系统里两者可以共存——端侧之间走 CRDT，端侧到中枢走 6.2 的 UPSERT 汇聚，中枢内部走逻辑复制。全章最有想象力的一点在此：**"记忆逻辑下沉"不是重写，而是同一套衰减/重排语义从 Python 层向数据库层的逐行平移，规模每上一个台阶就下沉一层，API 形状保持不变**——这正是 PG 扩展生态（第三章"可扩展性"维度）在记忆场景的直接兑现。

## 6.4 三阶段演进图

从单机到企业中枢的演进不需要一次到位，每一阶段的栈都是完整可用的，迁移由明确的信号触发：

| | 阶段一：单机 local-first | 阶段二：团队同步 | 阶段三：企业中枢 |
|---|---|---|---|
| **栈形态** | memweave 单文件（memory.db + Markdown 真相源），纯标准库即可运行 | memweave 端侧 × N + 6.2 路径一 UPSERT 汇聚进 PG + PostgREST 暴露只读 API | PG + pgvector + pgai 承接记忆逻辑（存储过程/pgai 任务），SQLite 退居端侧缓存与离线缓冲 |
| **记忆逻辑位置** | Python（100-200 行） | 仍在端侧；PG 侧只做汇聚与授权检索 | 下沉进 PG（PL/pgSQL + pgai 任务），端侧仅剩写入缓冲 |
| **迁移触发信号** | —— | 出现第二个需要共享记忆的用户/Agent；合规要求留存；单机备份成为心病 | 记忆条目 > 百万级或 QPS 超单机；需要跨租户治理/审计；端侧 embedding 质量成为瓶颈 |
| **数据迁移成本** | —— | 低：UPSERT 脚本即迁移工具，Markdown 真相源不动 | 中：schema 一次映射 + 逻辑重写为存储过程（语义不变）；Markdown 真相源仍可保留为导出格式 |

三点补充判断：① 阶段二是最容易被跳过也最值得停留的阶段——多数团队的"共享记忆"需求用 UPSERT + PostgREST 就能满足，不必过早引入 CRDT 或 FDW。② 阶段三不等于抛弃 SQLite：离线写入、端侧隐私这两个属性永远属于端侧，SQLite 从"真相源"降级为"缓存+缓冲"是健康的架构退位而非失败。③ 三阶段的 API 形状（write_memory / search）全程不变，这正是 6.3"逐层下沉"策略的回报——演进改的是数据位置，不是调用方代码。

---

### 来源

[^20^]: 白皮书《AI Memory and Backend Alternatives Whitepaper》第一部分（1.1–1.7：SQLite 记忆层架构、mem0 对比表、CRDT 同步、"记忆逻辑层 100-200 行 Python"结论），`/mnt/agents/upload/AI_Memory_and_Backend_Alternatives_Whitepaper.md`（访问日期 2026-08-16）。
[^21^]: memweave 参考实现说明（FTS5+向量混合搜索、时间衰减公式、MMR λ=0.7、WAL 多 Agent、Markdown 真相源、pytest 7/7），`/mnt/agents/output/ai-memory-backend/memweave/README.md`（访问日期 2026-08-16）。
[^23^]: 本报告第二章 2.4（ParadeDB pg_search 混合搜索）、2.6（组合栈参照与 memweave 衔接），`/mnt/agents/output/pg-backend-comparison_sec02.md`（访问日期 2026-08-16）。
[^24^]: DuckDB SQLite/Postgres 扩展 ATTACH 用法，DuckDB 官方文档 duckdb.org（访问日期 2026-08-16）。
