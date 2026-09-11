# 07 · Code Style: Defensiveness & Go Idiom / 代码风格：防御性与 Go 惯用法

> Bilingual. Code is shared. / 双语，代码共享。
>
> Read **after** the code-style essentials in `SKILL.md §3`. This file expands the two
> questions: "how defensive should Vine code be?" and "what Go style applies?".
> / 在 `SKILL.md §3` 之后阅读。本文件展开两个问题：Vine 代码该多防御？该用什么 Go 风格？

---

## 1. Vine's stance on defensive checks / Vine 对防御性检查的立场

Vine 的 `AGENTS.md` 是**明确反对**无差别防御性编程的：

> - Vine is an application framework, and most arguments are passed by code within
>   the project. **Do not add unnecessary nil or empty-value checks.**
> - Avoid **indiscriminate defensive checks** that do not belong to its contract.
> - **Do not add defensive behavior to production code solely to accommodate tests.**

Vine is a framework: most calls come from in-project code that already satisfies the
contract. Sprinkling `if x == nil` / `if len(s) == 0` everywhere is noise that hides
real bugs and fights the framework's intent. **A generic "always validate inputs"
section would contradict this** - so we don't add one.
/ Vine 是框架：多数调用来自项目内已满足契约的代码。到处撒 `if x == nil` / `if len(s) == 0`
是噪声，掩盖真实 bug、违背框架意图。**所以不写"一律校验入参"那种通用章节。**

What Vine **does** sanction is **checks at the right boundary, with the right tool**.
That is the legitimate, framework-aligned form of "defensive programming".
/ Vine 认可的是**在正确的边界、用正确的工具做检查**--这才是"防御性编程"在 Vine 里
合法的形态。

## 2. Three tiers of checking / 三层检查

| Tier / 层 | What / 是什么 | Tool / 工具 | On violation / 失败时 | Where / 位置 |
| --- | --- | --- | --- | --- |
| **A. Assembly / construction invariants** | 编程错误：构造期不变量（必填项、类型匹配、互斥选项）。Programming errors at construction. | `util/vpre` (`Check*` / `Must*`) | **panic**（fail-fast） | 公共 facade、构造器、bundle 组装 |
| **B. Business / protocol boundary failures** | 跨边界预期失败：资源不存在、入参语义非法、下游不可用。Expected failures across boundaries. | `core/ex`（`ex.New(...)` 或 panic-recover） | 返回 `ex.Error`（或边界 recover） | Rpc/Web/Event/Task handler、对外 API |
| **C. Internal method bodies** | 方法内部：契约已由调用方保证。Internal: contract guaranteed by caller. | **信任契约，不加冗余检查** | - | 业务/service 内部 |

### Tier A — `util/vpre` preconditions / 前置条件

`vpre` 是 Vine 自带的"框架风格前置检查"，**panic** 失败、fail-fast。用于**构造/组装期
编程错误**（不是运行时用户输入）。框架自身在 facade 边界用它，如 `standalone.NewBundled`
检查 `len(apps) > 0`、bundle 内 app 不能自带 option。

`vpre` is Vine's "framework-style precondition" helper - it **panics** (fail-fast) and
is for **construction/assembly programming errors**, not runtime user input. The
framework uses it at facade boundaries, e.g. `standalone.NewBundled` checks
`len(apps) > 0`.

```go title="internal/platform/database.go"
import "go.yorun.ai/vine/util/vpre"

func (*MainDatabase) InitOption(option *rdb.Option) {
    vpre.CheckNotEmpty(option.ConnURL, "rdb conn url is empty") // 构造期不变量 / construction invariant
    option.MaxOpenConn = 10
}
```

`vpre` 函数 / functions（均 panic on violation）:

| Function | Panics when / 当…时 panic |
| --- | --- |
| `Check(cond, tpl, args...)` / `CheckNot(...)` | cond 不满足期望 / not as expected |
| `CheckNotNil(val, ...)` / `CheckNil(val, ...)` | val 为 nil / not nil |
| `CheckNotEmpty(str, ...)` / `CheckEmpty(str, ...)` | str 为空 / not empty |
| `CheckOK(map, key, ...)` / `CheckNotOK(map, key, ...)` | key 缺失 / present |
| `CheckNilError(err, ...)` / `CheckNilErrorWithAction(err, action, ...)` | err != nil |
| `CheckFunc(cond, func() string)` | cond false（惰性消息 / lazy message） |
| `Must(cond)` / `MustNil(val)` / `MustNotNil(val)` / `MustEmpty(s)` / `MustNotEmpty(s)` | 断言变体 / assert variants |
| `MustNotReach()` | 执行到此处即不可达 / reached unreachable |
| `Panic(err)` / `Panicf(tpl, args...)` | 直接 panic / panic immediately |

> 原则 / rule: `vpre` 只用于"如果触发，就是调用方写错代码"的不变量。运行时可恢复的失败
> 用 `core/ex` 返回错误，不要用 panic。/ Use `vpre` only for invariants whose violation
> means the caller wrote wrong code. For runtime-recoverable failures, return an `ex.Error`.

### Tier B — `core/ex` boundary errors / 边界错误

跨 Rpc/Web/Event/Task 与业务代码的**预期失败**用 `core/ex` 携带稳定错误码。handler 里
**返回** `ex.Error`；需要中断执行流时用 panic-recover（`ex.PanicNew` + `ex.Recover`）。
详见 [02-modules §Errors](./02-modules.md#errors)。

Expected failures across boundaries use `core/ex` with stable codes. **Return** an
`ex.Error` from handlers; use panic-recover (`ex.PanicNew` + `ex.Recover`) to interrupt
flow. See [02-modules §Errors](./02-modules.md#errors).

```go title="internal/account/service.go"
func (s *UserService) Get(id string) (*User, ex.Error) {
    if id == "" {
        return nil, ex.New(ex.ValidationFailed, "empty id") // 预期失败，返回 / expected, return
    }
    u, ok := s.Users.First("id = ?", id)
    if !ok {
        return nil, ex.New(ex.NotFound, "user not found")
    }
    return u, nil
}
```

### Tier C — trust the contract internally / 内部信任契约

方法内部不要重复 `if err != nil { return }` 之外的无谓校验，不要为迁就测试给生产代码加
分支。理解方法职责后再决定是否需要检查；**不属于契约的检查不要加**。
/ Inside a method, don't add checks beyond normal error handling, and don't add branches
just to accommodate tests. Understand the responsibility first; **don't add checks that
don't belong to the contract**.

```go title="反例 / anti-pattern"
// 不要这样 / don't: 这些都是契约已保证的，纯噪声 / contract-guaranteed, pure noise
func (s *UserService) Create(name string) *User {
    if s == nil { return nil }          // s 由 DI 注入，不可能 nil
    if s.Users == nil { return nil }    // DAO 由组件暴露，构造期已校验
    if name == "" && false { /* ... */ } // 为测试硬塞的分支 / test-only branch
    return s.Users.Create(&User{Name: name})
}
```

### Decision table / 决策表

| You want to… / 想做… | Use / 用 |
| --- | --- |
| 构造/组装期断言不变量（编程错误） | `vpre.Check*` / `Must*`（panic） |
| 标记不可达分支 | `vpre.MustNotReach()` |
| handler 报告预期业务失败 | `ex.New(code, msg)` 返回 |
| 深层调用中断执行流、边界统一 recover | `ex.PanicNew(...)` + `ex.Recover(recover())` |
| 边界只捕业务异常、系统错误 rethrow | `ex.RecoverApplication(recover())` |
| 包装底层 error 链 | `ex.New(code, msg, ex.WithCause(err))` |
| 方法内部对契约已保证的入参做校验 | **不要加** / don't |
| 为通过测试给生产代码加防御 | **不要加**（改测试 / 用 fake / DI）/ don't |

---

## 3. Go style (general idiom, Vine-compatible) / Go 风格（通用惯用法，与 Vine 兼容）

Vine 没有 `.golangci.yml` / `.editorconfig`；风格权威是 `gofmt` + `go vet` + `AGENTS.md`
约定。下面是通用 Go 惯用法，**与 Vine 特有约定叠加**（Vine 约定优先）。

Vine has no lint config; authority is `gofmt` + `go vet` + `AGENTS.md`. Below is general
Go idiom, **layered under** Vine-specific conventions (Vine wins on conflict).

### Errors / 错误

- **返回错误，不要忽略**：`if err != nil { return ... }`，早返回。/ Return errors, return early.
- **包装带上下文**：`fmt.Errorf("load user %s: %w", id, err)`，保留 `%w` 以便 `errors.Is/As`。
  / Wrap with context, keep `%w`.
- **边界用 `ex.Error`**：跨 Rpc/Web/Event/Task 返回 `ex.New(code, ...)`，不要把裸 `error`
  丢过协议边界。/ Use `ex.Error` across boundaries.
- **panic 仅用于真正不可恢复的编程错误**（用 `vpre`）；预期失败返回 error。运行时别用 panic
  做流程控制（除非走 `core/ex` 的 panic-recover 边界）。/ Panic only for unrecoverable
  programming errors; expected failures return errors.

### Interfaces / 接口

- **接受接口，返回具体类型**（小接口、定义在使用方）。/ Accept interfaces, return concretes.
- 接口保持小、按需定义；不要预先抽象。/ Keep interfaces small, define where used.

### context.Context

- **`context.Context` 作为方法首个参数**：`func F(ctx context.Context, ...)`. / First param.
- **不要把 context 存进 struct**（框架拥有的执行对象除外）。/ Don't store in struct.
- **保留注入的 context**：调下游时用它，trace 与剩余超时靠它传播；**不要**用
  `context.Background()` 替换活跃请求 context（见 `SKILL.md` 黄金法则）。/ Preserve the
  injected context for downstream calls; never replace with `context.Background()`.

### Naming / 命名

- 导出符号**必须有 GoDoc**；包名小写、单数、不 stutter（避免 `user.User`）。/ GoDoc on
  exports; lowercase package names, no stutter.
- **缩写统一大小写**：Vine 特例用 `Rpc`（不是 `RPC`）。/ Acronyms consistent; Vine uses `Rpc`.
- 局部变量会遮蔽 `type` 关键字时用 `kind`。/ Use `kind` to avoid shadowing `type`.
- **Vine 特例**：包内非导出**生产类型**加 `_` 前缀（如 `_App`、`_Config`），仅类型；
  测试 fixture 可用 `testApp`、`configRepoSpy`。/ Vine: prefix unexported production types
  with `_`.

### Pointers / construction / 指针与构造

- **当前 Go**：创建指针优先 `new(SomeStruct{Field: "v"})`。Vine JSON 用 `encoding/json/v2`，
  UUID 用标准库 `"uuid"`，不要 `github.com/google/uuid`。/ Prefer `new(literal)`; json/v2; stdlib uuid.
- 修改状态或结构体较大用指针 receiver；同一类型 receiver 类型保持一致。/ Pointer receivers
  for mutation/large; be consistent.

### Concurrency / 并发

- **每个 goroutine 都要有 owner + 取消 + join**（见 [02-modules worker 范式](./02-modules.md)）。
  / Every goroutine needs an owner, cancellation, and join.
- **长循环和不可逆操作前检查 context 取消**（Event/Task 重投可能让两次执行重叠）。
  / Check ctx cancellation before long loops / irreversible work.
- **不要**用裸 `go func(){...}()` 而不管生命周期。/ No fire-and-forget goroutines.

### Packages & layout / 包与布局

- 业务代码按业务能力分包（`internal/account/`、`internal/checkout/`）；`main` 只选构造器并启动。
  / Package by business capability; `main` only assembles.
- 不导入 `internal/`；只用 `app`/`core/*`/`infra/*`/`util/*` facade。/ Don't import `internal/`.
- 测试与源码同目录（`service.go` ↔ `service_test.go`）；共享 setup 放 `test_helper_test.go`。
  / Tests beside source.
- 避免裸 `init()`；需要初始化用 `DIInit()` 或显式构造。/ Avoid `init()`; use `DIInit()`.

### Generated code / 生成代码

- `skeled/` 是构建产物，改 `.skel` 后用 `skelc` 重新生成，**绝不手改**。/ Generated code is
  build output; regenerate, never hand-edit.
- 协议边界（header/Redis key/JSON/CBOR/Skel schema）变更要同步所有生产者/消费者/测试/文档。
  / Protocol-boundary changes update all sides together.

### Validation toolchain / 校验工具链

```bash
gofmt -w .            # 格式化 / format
git diff --check      # 检查空白 / whitespace
go vet ./...          # 公共 API/并发/反射变更后跑 / after API/concurrency changes
go test ./...         # 测试 / tests
```

---

## 4. Quick do / don't / 速查

**Do / 推荐**
- 构造期不变量用 `vpre.Check*` fail-fast。
- 边界预期失败用 `core/ex` 返回稳定 code。
- 错误早返回、带上下文包装、保留 `%w`。
- 保留注入的 context 调下游。
- 每个 goroutine 有 owner + 取消 + join。

**Don't / 避免**
- 方法内部对契约已保证的入参加 nil/空值检查。
- 为迁就测试给生产代码加防御分支。
- 用 `context.Background()` 替换活跃请求 context。
- 裸 `go func()` 不管理生命周期。
- 跨边界丢裸 `error` 而非 `ex.Error`。
- 手改 `skeled/` 生成代码。
