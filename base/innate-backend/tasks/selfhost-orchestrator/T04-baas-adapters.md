# T04：InsForge 与 Supabase adapter

- **目标**：让同一 Go 控制面切换 BaaS，而不是同时运行两套业务后端。
- **依赖**：T01、T03

## 实现

1. 定义消费方 `BaaS` 接口：health、project/config、auth probe、database probe、optional realtime/storage probe。
2. 实现 InsForge adapter，先覆盖 Agent/MCP/项目 API smoke test；具体 endpoint、认证和版本放配置，不写死在 domain。
3. 实现 Supabase adapter，覆盖 supabase-js 所需 URL/key、Auth、RLS、Realtime、Storage smoke test。
4. 配置只允许一个 active adapter；启动时若同时启用两个，直接返回配置错误。
5. 两者可以共享同一 PostgreSQL 实例，但默认使用独立 database/role；不共用 metadata/auth/storage 表。

## 验收

- `selfhost validate` 能检查 adapter 配置和 secret 是否齐全。
- InsForge/Supabase contract tests 使用 mock server 可在 CI 运行。
- 真实环境各有一条手工 smoke test，且不修改另一套 BaaS 数据。
