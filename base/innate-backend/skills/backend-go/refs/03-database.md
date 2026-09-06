# 03 · Database & Redis / 数据库与缓存

> Bilingual. Code is shared. ORM = **GORM**; Redis client = **go-redis**.
> / 双语，代码共享。ORM 为 GORM；Redis 客户端为 go-redis。

---

## RDB / 关系数据库

RDB 组件连接 PostgreSQL 或 SQLite，把类型安全的 DAO 注入业务对象。每个数据库组件声明
一个连接和一组 DAO。连接在组件启动时建立，应用停止后释放；同 `ConnURL` 的组件共享底层连接池。

The RDB component connects to PostgreSQL or SQLite and injects type-safe DAOs. Each
component declares one connection and a set of DAOs. The connection opens at component
start and closes after the app stops; components with the same `ConnURL` share the pool.

### Declare the component / 声明组件

```go title="internal/platform/database.go"
type MainDatabase struct {
    rdb.Database
}

func (*MainDatabase) InitOption(option *rdb.Option) {
    option.ConnURL = "postgres://demo:demo@127.0.0.1:5432/app"
    // 或 SQLite / or SQLite: option.ConnURL = "sqlite://./app.sqlite"
    option.MaxOpenConn = 10
}

func (*MainDatabase) InitDao(add rdb.TypeAdder) {
    add(rdb.T[*UserDao]())
    add(rdb.T[*OrderDao]())
}
```

```go title="internal/application/components.go"
func (*DemoApp) InitComponents(add app.TypeAdder) {
    add(app.T[*MainDatabase]())
}
```

`rdb.Option` 字段 / fields: `ConnURL string`, `MaxOpenConn int`.

> ⚠️ **Migrations / 迁移**: Vine 只开库并构造 DAO，**不**调用 GORM `AutoMigrate`、不建业务表。
> 生产/共享数据库应使用审核过的独立迁移；local-first 策略见下文。`standalone.Option.SQLiteFile`
> 属于 **Hub**，与业务数据库无关。/ Vine opens the DB and builds DAOs; it does **not**
> AutoMigrate or create tables. Use reviewed deployment migrations for production/shared
> databases; see the local-first policy below. `standalone.Option.SQLiteFile` is **Hub's**
> database, unrelated to the business DB.

### Model / 模型

- `rdb.Model`：软删除（带 `DeletedAt gorm.DeletedAt`）。
- `rdb.DeletableModel`：物理删除（无 `DeletedAt`）。

```go title="internal/account/user.go"
type User struct {
    rdb.Model // Id, CreatedAt, UpdatedAt, DeletedAt（软删除 / soft delete）
    Name  string `gorm:"column:name"`
    Email string `gorm:"column:email"`
}

type AuditLog struct {
    rdb.DeletableModel // Id, CreatedAt, UpdatedAt（物理删除 / physical delete）
    Action string `gorm:"column:action"`
}
```

`rdb.Model` 字段 / fields:

```go
type Model struct {
    Id        int            `gorm:"column:id;primaryKey"`
    CreatedAt time.Time      `gorm:"column:created_at;autoCreateTime"`
    UpdatedAt time.Time      `gorm:"column:updated_at;autoUpdateTime"`
    DeletedAt gorm.DeletedAt `gorm:"column:deleted_at"`
}
```

`rdb.Dao[M]` is intentionally limited to Vine's model contract. `M` must embed
`rdb.Model` or `rdb.DeletableModel`, which supplies the framework's unexported model
methods and integer `Id`. Existing UUID/string/composite primary-key schemas do not fit
this contract. Do not change a compatible production schema merely to use the helper;
use a Domain-owned Gorm store over `*gorm.DB` instead. / `rdb.Dao[M]` 只适用于 Vine
的整数 ID model contract。UUID/string/composite 主键的既有 schema 不应为了套用 helper
而改表，应使用 Domain-owned Gorm store 直接操作 `*gorm.DB`。

### Dao / 数据访问对象

DAO 用**指向 model 的指针**作为泛型参数。生成的 DAO 绑定**当前执行 context 与 logger**
（GORM 操作跟随执行的取消与关联日志）。

```go title="internal/account/user.go"
type UserDao struct {
    rdb.Dao[*User]
}
```

`Dao[M]` 方法 / methods:

| Method | Signature | 说明 / Note |
| --- | --- | --- |
| `Create` | `Create(model M) M` | 插入并回填主键 / insert, backfill PK |
| `Update` | `Update(model M, patch Patch) M` | 按 patch 更新 / update by patch map |
| `Delete` | `Delete(model M)` | Model 软删 / DeletableModel 物理删 / soft or physical |
| `First` | `First(conditions ...any) (M, bool)` | 取首条 / first match |
| `List` | `List(conditions ...any) []M` | 列表 / list matches |
| `Query` | `Query(conditions ...any) *Query[M]` | 链式查询 / chainable query |
| `GormDB` | `GormDB() *gorm.DB` | 取底层 *gorm.DB 做事务/原生查询 / raw handle |

`Patch` 是 `map[string]any`，用于 `Update` 的部分字段更新。/ `Patch` is `map[string]any`.

`Query[M]` 链式方法 / chainable methods: `Limit(int)`, `Offset(int)`, `Order(string)`,
`First() (M, bool)`, `List() []M`, `Count() int`.

```go title="internal/account/service.go"
type UserService struct {
    Users *UserDao `inject:""`
}

func (s *UserService) Create(name, email string) *User {
    return s.Users.Create(&User{Name: name, Email: email})
}

func (s *UserService) Get(id int) (*User, bool) {
    return s.Users.First("id = ?", id)
}

func (s *UserService) Rename(id int, newName string) (*User, bool) {
    u, ok := s.Users.First("id = ?", id)
    if !ok {
        return nil, false
    }
    return s.Users.Update(u, rdb.Patch{"name": newName}), true
}

func (s *UserService) Recent(limit int, offset int) []*User {
    return s.Users.Query("deleted_at IS NULL").
        Order("created_at DESC").
        Limit(limit).
        Offset(offset).
        List()
}
```

### Transactions / 事务

需要事务时，通过 `GormDB()` 拿到底层 `*gorm.DB`，用标准 GORM 事务写法。注意：DAO 的便捷
方法不跨你手工开的 `Transaction` 回调；在事务内用 `tx` 直接操作或用 `tx.Model(...)`。

For transactions, get the raw `*gorm.DB` via `GormDB()` and use standard GORM
transaction semantics. The DAO convenience methods don't share your manual `Transaction`
callback; operate on `tx` directly inside it.

```go title="internal/checkout/service.go"
func (s *CheckoutService) PlaceOrder(o *Order, u *User) error {
    db := s.Orders.GormDB() // 任意一个 DAO 都能拿到同一个 *gorm.DB / any DAO yields the same handle
    return db.Transaction(func(tx *gorm.DB) error {
        if err := tx.Create(o).Error; err != nil {
            return err
        }
        if err := tx.Model(&User{}).Where("id = ?", u.Id).Update("balance", u.Balance).Error; err != nil {
            return err
        }
        return nil
    })
}
```

> DAO 注入到 handler 时，其 context 跟随当前请求；注入到 module/组件（singleton）时则绑定
> 应用根 context。把事务/查询放在执行作用域对象里。/ A DAO injected into a handler follows
> the request context; one injected into a module binds the app root context. Keep
> transactional work in execution-scoped objects.

### Existing schemas and migration policy / 既有 Schema 与迁移策略

- Production/shared databases: run reviewed, versioned migrations as an explicit
  deployment step before instances serve traffic.
- Local-first single-process applications: the owning Domain Module may run an explicit,
  compatibility-reviewed `AutoMigrate` before the HTTP/Rpc adapter starts.
- Keep records and migrations with the owning Domain. A shared database Component may
  expose `*gorm.DB`, but must not import Domain records or workflows.

/ 生产或共享数据库使用独立、版本化迁移；local-first 单进程应用可以由 owning Domain Module
在服务启动前执行经过兼容性审查的 `AutoMigrate`。共享数据库 Component 只提供连接，不应知道
Domain records、迁移或 workflow。

---

## Redis

Redis 组件提供 go-redis 命令、类型安全缓存、分布式锁。声明 endpoint 和要注入的
Cache/Locker 类型即可。Redis 组件本身是应用 singleton，命令接受显式 context；而注入的
cache/locker helper 会**捕获创建它的 context**。

The Redis component provides go-redis commands, type-safe caches, and distributed
lockers. Declare the endpoint and the Cache/Locker types you want. The Redis component
is an app singleton whose commands take an explicit context; injected cache/locker
helpers **capture the context used to create them**.

### Declare the component / 声明组件

```go title="internal/platform/redis.go"
type User struct {
    ID   string `json:"id"`
    Name string `json:"name"`
}

type UserCache struct {
    redis.Cache[*User]
}

type UserLocker struct {
    redis.Locker
}

type MainRedis struct {
    redis.Redis
}

func (*MainRedis) InitOption(option *redis.Option) {
    option.Endpoint = "redis://127.0.0.1:6379/0"
}

func (*MainRedis) InitLockers(add redis.TypeAdder) {
    add(reflect.TypeFor[*UserLocker]()) // 也可用 redis.T[...] 风格 / or redis.T[...] style
}

func (*MainRedis) InitCaches(add redis.TypeAdder) {
    add(reflect.TypeFor[*UserCache]())
}
```

```go
func (*DemoApp) InitComponents(add app.TypeAdder) {
    add(app.T[*MainRedis]())
}
```

`redis.Option` 字段 / fields: `Endpoint string`.

### Cache / 缓存

`Cache[T]` 方法 / methods: `Get(key) (T, bool)`, `GetOrLoad(key, ttl, load) T`,
`Set(key, value, ttl)`, `Delete(key)`, `KeyPrefix() string`.

Cache/Locker 的 key 前缀默认由其完整 Go 类型名推导；只有当两个类型**故意**共用同一 Redis
命名空间时才覆写 `KeyPrefix()`。/ Cache/Locker prefixes are derived from the full Go type
by default; override `KeyPrefix()` only when two types intentionally share a namespace.

```go title="internal/account/service.go"
type UserService struct {
    Cache *UserCache `inject:""`
}

func (s *UserService) Load(userID string) (*User, bool) {
    return s.Cache.Get(userID)
}

func (s *UserService) LoadOrCompute(userID string) *User {
    return s.Cache.GetOrLoad(userID, 5*time.Minute, func() *User {
        // 缓存未命中时执行 / run on cache miss
        return loadFromDB(userID)
    })
}
```

### Locker / 分布式锁

锁默认带 TTL 并在持有期间刷新；`Lock.Context()` 在所有权失效时被取消，长任务必须监听它。
**坏锁不再属于你，`Unlock` 会 panic**；不要在可能超出租约的工作外层无脑 `defer lock.Unlock()`。
`IsBroken()` 只是状态观测，不是"后续 `Unlock` 不会 panic"的原子承诺（当前 API 没有
`TryUnlock`）。若该 fail-fast 契约不可接受，把它隔离到应用自有的恢复边界后，或选有需要语义的锁。
Redis 锁是协调租约，**不是**fencing token。

Locks have a TTL and refresh while held; `Lock.Context()` is canceled when ownership
becomes invalid. A **broken** lock is no longer owned and `Unlock` panics; don't
unconditionally `defer lock.Unlock()` around work that can outlive the lease. `IsBroken()`
is a state observation, not an atomic promise. Redis locks are coordination leases,
**not** fencing tokens.

```go title="internal/account/service.go"
type UserService struct {
    Locker *UserLocker `inject:""`
}

func (s *UserService) Rebuild(userID string) {
    lock, ok := s.Locker.Lock(userID)
    if !ok {
        return
    }

    if !s.rebuildWhileOwned(lock.Context(), userID) { // context 取消时返回 false
        return
    }
    if lock.IsBroken() {
        return
    }
    // 尽力预检：此处之后所有权仍可能变化 / best-effort pre-check; ownership can still change
    lock.Unlock()
}
```

---

## Choose SQLite vs PostgreSQL / 选 SQLite 还是 PostgreSQL

| Need / 需求 | Choose / 选择 |
| --- | --- |
| 本地开发、单进程、零依赖 | SQLite（`sqlite://./app.sqlite`） |
| 生产、并发、独立运维 | PostgreSQL（`postgres://...`） |

注意两个独立的数据库概念 / Note two separate DB concepts:
- **Hub 数据库**（`standalone.Option.SQLiteFile`/`PostgresURL` 或 `vine hub serve --db-*`）：
  存配置、注册、Portal 规则、证书。是控制面的真相源。
- **业务数据库**（`rdb.Database` 组件）：你的应用自己拥有的关系数据。两者各自独立声明。
  / Hub DB (config/registry) vs business DB (your app data) - declare separately.

## Key tech recap / 关键技术回顾

- ORM: **GORM** (`gorm.io/gorm`)，PostgreSQL 驱动 `gorm.io/driver/postgres`，SQLite 驱动
  `glebarez/sqlite`。Vine 用 `infra/rdb` 包装为 `Database`/`Dao`/`Model`/`Query`。
- Redis: **go-redis** (`redis/go-redis/v9`)，Vine 用 `infra/redis` 包装为
  `Redis`/`Cache[T]`/`Locker`。
- 序列化: CBOR (`fxamacker/cbor/v2`) + JSON，helper 在 `util/vcode`。
