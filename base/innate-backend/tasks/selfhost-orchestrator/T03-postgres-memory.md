# T03：PostgreSQL/pgvector 与 MemoryStore

- **目标**：Go 总控拥有共享 memory 投影和运行审计；memweave 继续作为本地离线实现。
- **依赖**：T01

## 实现

1. 在 `internal/selfhost/domain` 定义消费方接口：`MemoryStore` 的 `Write/Search/Forget`、`RunStore` 的 `Create/Finish/List`。
2. 用 Vine RDB component 连接开发 Postgres，使用 GORM；迁移只管理 `agent_runs`、`memory_items` 和索引。
3. embedding 维度默认 384，记录 `embedding_model`；不同维度必须拒绝写入。
4. 实现 scope/filter、`workspace_id`、`user_id`、`agent_id`、`session_id` 和 logical key 的幂等 UPSERT。
5. 增加 memweave adapter 的进程边界（CLI/HTTP 均可），不把 Python 代码嵌入 Go。

## 验收

- Postgres CRUD、cosine search、scope 过滤和 RLS smoke test 通过。
- 断网本地写入，恢复后重复同步不会产生重复 memory。
- `go vet ./...`、`go test ./...` 通过。
