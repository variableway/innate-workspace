# T07：观测、审计与恢复

- **目标**：让总控具备可诊断、可恢复的开发运维能力。
- **依赖**：T02、T03

## 实现

1. 使用 `core/logger` 输出 JSON/text；敏感字段通过 `core/redact` 处理。
2. 为每个 operation 记录 trace、service、profile、duration、exit/status。
3. 增加 `selfhost doctor`：Docker、网络、端口、volume、Postgres、pgvector、active BaaS、Ollama 探针。
4. 增加 `selfhost backup`/`restore` 对 `pg_dump`、memweave 数据和 manifest 做版本化封装。
5. 记录 schema/embedding 版本，恢复后先执行只读校验。

## 验收

- 失败日志不含密码、JWT、Authorization header。
- fresh install、backup、destroy、restore、health check 流程可重复。
- 至少一条 p95 运行/搜索指标和一条恢复演练记录。
