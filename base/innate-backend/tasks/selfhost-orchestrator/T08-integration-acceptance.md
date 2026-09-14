# T08：集成验收与发布

- **目标**：把任务组收敛为可供其他项目调用的 Go CLI 和文档。
- **依赖**：T01–T07

## 验收矩阵

| 场景 | 必须通过 |
|---|---|
| 仅本地 runtime + memweave | 可离线运行和搜索 |
| Postgres + pgvector | memory 写入、向量检索、scope 过滤 |
| InsForge profile | Agent/MCP/项目 API smoke |
| Supabase profile | Auth/RLS/Realtime/Storage smoke |
| Bun/Deno runner | 权限、超时、取消、审计 |
| 恢复 | pg_dump + memweave + manifest 可恢复 |

## 交付

1. 更新 `base/innate-backend/README.md`、`innate-go/README.md`、Taskfile。
2. 为每个 CLI 命令提供 `--help` 和 JSON 输出示例。
3. 运行 `gofmt`、`go vet ./...`、`go test ./...`、`git diff --check`。
4. 在无 Docker/无 Deno/无 Ollama 的机器上验证 graceful degradation。
