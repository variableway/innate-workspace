# Skill templates vs innate-go

`templates/` 是 **skill 侧脚手架**（agent 新建应用时拷贝）。可运行的完整实现已经在
[`innate-go`](../../../innate-go/)，**不要**在本目录再放一份业务代码。

| 旧名 / 看起来像独立工程 | 真正落点 | 拷贝吗 |
| --- | --- | --- |
| `innate-meta-api` | `innate-go` 的 `internal/metaapi` + `innate-go server meta` | 否。改/跑都走 innate-go |
| `innate-vine-rest` | `innate-go/samples/vine-rest`（完整 REST demo） | 否。当**参考实现**读，不要 `cp -r` 当新项目 |
| 新建 Vine standalone 应用 | **本目录** [`vine-standalone/`](./vine-standalone/) | 是。拷到目标模块后改 `module` 名，再 `go get go.yorun.ai/vine@latest` |

## Agent 规则

1. **跑样例 / 改 Innate 后端基础工程** → `base/innate-backend/innate-go`。
2. **给用户新建一个 Vine 应用** → 复制 `templates/vine-standalone/`，再按
   [refs/04-standalone-dev.md](../refs/04-standalone-dev.md) 扩。
3. **不要**把 `innate-go` 嵌进 skill，也不要把 skill 脚手架当成第二个 git module。
4. 写代码用**当前最新** Vine API（`SKILL.md` §2d）。不要写死 Vine / Go / skelc 次版本号。

## Install landing

[`installed-README.md`](./installed-README.md) 是 skill 安装后的目录说明模板（`--copy` 安装时可由 installer 使用）。
