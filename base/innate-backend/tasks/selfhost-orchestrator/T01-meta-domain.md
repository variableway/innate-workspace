# T01-META：Meta CRUD 统一为 Domain

- **目标**：把当前 `internal/store` 的业务规则从裸 HTTP 入口中抽出，供普通 sidecar、Vine standalone Web 和未来 Rpc 共同使用。
- **依赖**：T01 contract/CLI；T00 版本门禁必须完成

## 实现

1. 将表白名单、JSON 校验、Create/Get/List/Update/Delete、审计抽成 Domain-owned `TableCRUD`/`MetaStore` use case。
2. 保持现有 `/healthz` 与 `/api/meta/{table}` HTTP contract，先用 adapter 接入，避免一次性破坏桌面客户端。
3. 增加 `skel/`：`MetaRecord`、`MetaStoreService`、`MetaCrudWeb`、`ClientActor`、config；用当前 skelc 生成 `skeled/`。
4. Vine Web handler 只调用 Domain port；跨 App 通过生成 Rpc client，不注入另一个 App 的 DAO。
5. 第一阶段保留 SQLite 实现；第二阶段将同一 port 接到 Vine RDB/Postgres/pgvector。

## 验收

- 普通 sidecar 和 Vine standalone 对同一组 CRUD contract tests 结果一致。
- Domain 包不依赖 `net/http`、Gin、Vine Portal 或 CLI。
- 生成代码 compiler version 满足 `skel.MinSkelcVersion()`。
- 不为动态表生成每表一个 Skel data 类型；继续使用 `table + json`。
