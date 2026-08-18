# 08 · CLI Application / 命令行应用

> Bilingual. Code is shared. Vine uses `urfave/cli/v3`; style reference is Vine's own
> `internal/cli/`. / 双语，代码共享。Vine 用 `urfave/cli/v3`；风格参考 Vine 自身的 `internal/cli/`。

---

## 1. Every Vine app is already a CLI / 每个 Vine 应用本身就是一个 CLI

调用 `app.New` / `standalone.New` / `linked.New` 时，构造器**内部**会调用 `appcli.Handle`
解析命令行参数与环境变量。所以你的应用二进制天生支持：

Every constructor internally calls `appcli.Handle` to parse CLI args + env vars, so your
binary already supports:

| Arg / Flag | Effect / 作用 |
| --- | --- |
| `version` | 打印 `runtime.Inspect()`（进程名/版本/实例 ID/构建信息等）后退出。Prints `runtime.Inspect()` and exits. |
| `help` | 显示应用参数帮助后退出。Shows app args help and exits. |
| `--log-level LEVEL` | 设置全局日志级别（`DEBUG`/`INFO`/`WARN`/`ERROR`），或 `VINE_LOG_LEVEL`. Global log level. |
| `--log-rule pattern=LEVEL` | 命名日志规则（可多次），或 `VINE_LOG_RULES`. Named log rules, repeatable. |
| `<unknown positional arg>` | 被忽略，应用照常启动（`errIgnoreArgs` 语义）。Ignored; app starts normally. |

```bash
./myapp version                  # 看版本/构建信息 / show version
./myapp --log-level DEBUG        # 调高日志级别 / bump log level
./myapp --log-rule 'app:**=DEBUG' --log-rule 'vine:core:rpc=INFO'
VINE_LOG_LEVEL=DEBUG ./myapp     # 等价于 --log-level / equivalent
```

> `appcli` 在 `internal/` 下，应用代码**不直接调用**它；通过构造器或 `app.With(...)` 间接使用。
> / `appcli` is `internal/`; app code uses it indirectly via constructors or `app.With(...)`.

## 2. Mode-specific flags & env / 模式相关 flag 与环境变量

每种构造器把 `Option` 字段也暴露成 flag + `VINE_*` 环境变量，二选一即可，**代码、flag、env 同源**：

Each constructor exposes its `Option` fields as flags + `VINE_*` env vars - code, flag,
and env are alternative sources for the same value.

| Constructor | Option field | Flag | Env var |
| --- | --- | --- | --- |
| `app.NewWithOption` | `LinkEndpoint` | `--link-endpoint` | `VINE_LINK_ENDPOINT` |
| `linked.NewWithOption` | `HubEndpoint` | `--hub-endpoint` | `VINE_HUB_ENDPOINT` |
| `linked.NewWithOption` | `IngressListen` | `--ingress-listen` | `VINE_INGRESS_LISTEN` |
| `standalone.NewWithOption` | `SQLiteFile` | `--db-sqlite-file` | `VINE_DB_SQLITE_FILE` |
| `standalone.NewWithOption` | `PostgresURL` | `--db-postgres-url` | `VINE_DB_POSTGRES_URL` |
| `standalone.NewWithOption` | `SeedYAMLFile` | `--seed-yaml-file` | `VINE_SEED_YAML_FILE` |
| `standalone.NewWithOption` | `DashboardURL` | `--dashboard-url` | `VINE_DASHBOARD_URL` |

优先级：代码里显式传的 `Option` 字段 > flag > env（见 `applyOption`：非空覆盖）。
/ Priority: explicit `Option` field in code > flag > env.

```bash
# 三种等价写法 / three equivalent forms
VINE_LINK_ENDPOINT=http://127.0.0.1:7079 ./checkout-app
./checkout-app --link-endpoint http://127.0.0.1:7079
# 代码里 app.NewWithOption[*App](app.Option{LinkEndpoint: "http://127.0.0.1:7079"})
```

## 3. Custom app flags / 自定义 flag

自定义 flag：嵌入 `app.FlagModel`，在构造时用 `app.With(&MyFlag{...})` 传入，再 `inject:""`
进 spec/模块。flag 值也可来自 env（构造器统一经 `appcli.Handle` 解析）。

```go title="internal/application/app.go"
type RegionFlag struct {
    app.FlagModel
    Region string
}

type CheckoutApp struct {
    app.Application
    app.ServicerEnabled
    Flag *RegionFlag `inject:""`
}

func (a *CheckoutApp) DIInit() {
    // AppFlag 注入后可读；自定义 flag 同理可在此归一化
    if a.Flag.Region == "" {
        a.Flag.Region = "cn"
    }
}
```

```go title="cmd/checkout/main.go"
func main() {
    app.NewWithOption[*CheckoutApp](
        app.Option{LinkEndpoint: "http://127.0.0.1:7079"},
        app.With(&RegionFlag{Region: "cn"}), // 也支持 flag/env 注入 / also flag/env-injectable
    ).StartAndWait()
}
```

`With(flag)` 约束 / constraints: 非 nil、必须是指向 struct 的指针、每种 flag 只能传一次。
在 spec 的 `DIInit()` 里做归一化（`BindCommon` 太晚）。/ Normalize in `DIInit()`; `BindCommon` is too late.

## 4. Flag/env pairing convention / flag 与 env 配对约定

Vine 的惯例：**每个 flag 都配一个 `VINE_*` 环境变量**，用 `urfave/cli/v3` 的 `Sources` 一起声明。
flag 名 `kebab-case`，env 名 `VINE_UPPER_SNAKE`。/ Convention: every flag pairs with a
`VINE_*` env var via `Sources: ucli.EnvVars(...)`; flags are `kebab-case`, env is
`VINE_UPPER_SNAKE`.

```go
&ucli.StringFlag{
    Name:    "api-listen",
    Sources: ucli.EnvVars("VINE_API_LISTEN"),
    Value:   "127.0.0.1:7071", // 默认值 / default
    Usage:   "hub API listen address",
}
```

## 5. Building a CLI tool / subcommands / 构建独立 CLI 工具或子命令

Vine 是**服务框架**（`StartAndWait` 阻塞），但 `version`/`help` 这种"早退出"参数展示了子命令雏形。
要做一个真正的 CLI 工具（跑完即退、不强起服务），用 `urfave/cli/v3` 照 Vine 自身 `internal/cli/`
的范式写：薄 `main` + 可测试的 `run` + 工厂函数。

Vine is a **server framework** (`StartAndWait` blocks), but `version`/`help` show the
early-exit subcommand pattern. For a true one-shot CLI tool, follow Vine's own
`internal/cli/` shape: thin `main` + testable `run` + factory functions.

```go title="cmd/mytool/main.go"
package main

import "example.com/mytool/internal/cli"

func main() { cli.Main() }
```

```go title="internal/cli/cli.go"
package cli

import (
    "context"
    "fmt"
    "os"

    ucli "github.com/urfave/cli/v3"
)

type _RunResult struct{ exitCode int; stdout, stderr string } // `_` 前缀：Vine 非导出生产类型约定

func Main() {
    r := run(os.Args[1:])
    if r.stdout != "" { _, _ = fmt.Fprint(os.Stdout, r.stdout) }
    if r.stderr != "" { _, _ = fmt.Fprint(os.Stderr, r.stderr) }
    os.Exit(r.exitCode)
}

// run 不碰 os.Stdout/os.Exit，返回结果 -> 可单测 / doesn't touch OS; unit-testable
func run(args []string) (r _RunResult) {
    defer func() { // panic -> error result，边界 recover / panic to error at boundary
        if rec := recover(); rec != nil {
            r = _RunResult{exitCode: 1, stderr: fmt.Sprint(rec)}
        }
    }()
    var stdout, stderr strings.Builder
    cmd := newRootCommand()
    cmd.Writer, cmd.ErrWriter = &stdout, &stderr
    cmd.ExitErrHandler = func(context.Context, *ucli.Command, error) {}
    if err := cmd.Run(context.Background(), append([]string{"mytool"}, args...)); err != nil {
        return _RunResult{exitCode: 1, stdout: stdout.String(), stderr: stderr.String()}
    }
    return _RunResult{stdout: stdout.String(), stderr: stderr.String()}
}

func newRootCommand() *ucli.Command {
    return &ucli.Command{
        Name: "mytool", Usage: "my cli tool", Suggest: true, HideHelpCommand: true,
        Commands: []*ucli.Command{newExportCommand(), newImportCommand()},
    }
}
```

```go title="internal/cli/export.go"
var startExport = func(opts exportOpts) { // 测试可覆盖 / overridable in tests
    doExport(opts)
}

func newExportCommand() *ucli.Command {
    return &ucli.Command{
        Name: "export", Usage: "export data",
        Flags: []ucli.Flag{
            &ucli.StringFlag{Name: "out", Sources: ucli.EnvVars("MYTOOL_OUT"), Usage: "output path"},
        },
        Action: func(_ context.Context, cmd *ucli.Command) error {
            if cmd.Args().Len() > 0 {
                return fmt.Errorf("unexpected args for export")
            }
            startExport(exportOpts{Out: cmd.String("out")}) // 逻辑放包内、不在 Action 里堆 / logic in package
            return nil
        },
    }
}
```

## 6. Style reference: Vine's own CLI / 风格参考：Vine 自身的 CLI

> Vine 自身的 CLI（`internal/cli/`、`internal/appcli/`）是良好 Go CLI 风格的范例，可作为参考。
> 下面的评价有源码依据。/ Vine's own CLI is a good Go CLI style reference; the assessment below
> is grounded in its source.

**值得借鉴 / worth emulating:**

- **薄 `main`**：`cmd/vine/main.go` 仅 4 行，只 `cli.Main()`；逻辑在包内、可测。
  / Thin `main`: 4 lines, only `cli.Main()`; logic in package, testable.
- **可测试的 run 边界**：`run(args) _RunResult{exitCode, stdout, stderr}` 不直接写 `os.Stdout`、
  不直接 `os.Exit`；只有 `Main()` 接触真实 OS。CLI 逻辑无需子进程即可单测。**这是最值得抄的一点。**
  / Testable run boundary: returns a result struct; only `Main()` touches the OS. Unit-testable
  without subprocess. **The standout pattern.**
- **工厂函数**：`newHubCommand()` / `newHubServeCommand()` 等返回 `*ucli.Command`，命令树可组合。
  / Factory functions return `*ucli.Command`; composable tree.
- **flag + env 配对**：每个 flag 配 `VINE_*` env，用 `Sources: ucli.EnvVars(...)` 一起声明。
  / Flag + env paired via `Sources`.
- **可覆盖的启动变量**：`var startHubApp = func(flags){...}`，测试可替换以断言 flag 而不真起服务。
  / Overridable start var for testability.
- **panic -> error 边界**：`defer recoverAsErrorResult(&result)`。
- **错误带上下文**：`fmt.Errorf("unexpected args for %s", commandHubServe)`。
- **一致命名**：`commandHub`/`commandHubServe`、`FlagHubAPIListen`/`EnvHubAPIListen` 成对前缀。
  / Consistent paired naming.
- **`_` 前缀非导出生产类型**：`_RunResult` 遵循其 AGENTS.md 约定。

**诚实的瑕疵 / honest trade-offs:**

- `argsStdout`/`argsStderr`/`argsExit` 是包级变量（为可测），算轻度全局状态，但是常见且合理的
  Go CLI 测试手法。/ Package-level IO vars for testability - mild global state, but a common
  justified pattern.
- `helpFlagMu` 互斥 + `ucli.HelpFlag = nil` 是绕开 urfave/cli/v3 全局 `HelpFlag` 的小补丁，
  属库设计所迫。/ HelpFlag mutex workaround forced by urfave/cli/v3 global state.
- `_` 前缀非导出类型是 Vine 特有约定，**项目外少见**；如果团队不采用 Vine 的 AGENTS，可换成普通命名。
  / The `_`-prefix convention is Vine-specific and unusual elsewhere.

## 7. Do / Don't

**Do / 推荐**
- `main` 只调一个 `cli.Main()`，逻辑放包内。/ Keep `main` thin.
- 让 `run(args)` 返回结果结构，不碰 `os.Stdout`/`os.Exit`。/ Return a result from `run`.
- 每个 flag 配 `VINE_*` env，用 `Sources` 一起声明。/ Pair flags with env.
- 子命令用工厂函数 `newXxxCommand()`。/ Factory functions per subcommand.
- 把业务逻辑放包内函数，`Action` 只做参数装配与调用。/ Keep logic in package funcs; `Action` assembles args.
- 可覆盖的 `var startXxx = func(...)` 便于测试断言。/ Overridable start var for tests.

**Don't / 避免**
- 在 `Action` 里堆业务逻辑或直接 `os.Exit`。/ Don't pile logic in `Action` or call `os.Exit` there.
- 只给 flag 不给 env（Vine 惯例两者成对）。/ Don't add a flag without its env var.
- 让 CLI 逻辑只能靠子进程 e2e 测（用 `_RunResult` 模式可单测）。/ Don't make CLI logic
  subprocess-only-testable.
- 直接导入 `internal/appcli` 或 `internal/cli`（应用代码用 `app.With`/构造器；自建 CLI 时抄范式而非导包）。
  / Don't import `internal/*`; copy the pattern, don't import the package.
