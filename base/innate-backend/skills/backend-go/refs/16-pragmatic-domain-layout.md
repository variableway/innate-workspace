# 16 · Pragmatic Domain Layout / 务实的领域布局

Use this reference when designing a new Domain package or simplifying a layered
`model/service/impl/repository/runtime/adapter` tree. DDD defines ownership,
language, invariants, and dependency direction; it does not require one package
per architectural noun. / 设计新 Domain 或精简过度分层目录时使用。DDD 约束的是业务归属、
语言、不变量和依赖方向，不要求每个架构名词都对应一个 package。

## Start with the smallest working shape / 从最小可行结构开始

For a small bounded context, prefer one business package plus only the leaf adapters
that really isolate a framework or external system:

```text
internal/domain/recording/
  module.go             # Vine ownership and lifecycle
  service/              # business model, use cases, consumer-owned ports
  http/                 # Gin delivery adapter
  persistence/          # Gorm records and store
  proxy/                 # external capture system adapter
```

The `http`, `persistence`, and `proxy` packages are Domain-owned adapters even without
an intermediate `adapter/` directory. Add that classification directory only when it
materially improves navigation. / 即使没有 `adapter/` 中间目录，这些叶子 package 仍是
Domain-owned adapters；只有分类目录确实提升可导航性时才增加它。

For a very small feature, keep model, use cases, and storage in one package. Split a
package only when there is a real boundary: framework isolation, lifecycle ownership,
independent change rate, a dependency cycle, or sustained file/navigation difficulty.

## Complexity budget / 复杂度预算

Every package, interface, mapping type, and factory adds ongoing cognitive cost. Start
simple and require evidence for each addition:

| Proposed abstraction | Adopt when / 采用条件 |
| --- | --- |
| New package | It creates an enforceable dependency or ownership boundary |
| Interface | A consumer needs a fake/second implementation, or must isolate an external system |
| Separate persistence model | Existing schema or persistence concerns differ from the business model |
| Aggregate/value object/domain event | A real invariant, state transition, or asynchronous fact requires it |
| Shared platform package | Two or more Domains use it and it does not know their business models |

Do not add abstractions only for hypothetical framework/database replacement. Prefer
splitting a long file inside the same package before splitting the package. / 不为假设性的
框架或数据库替换预付复杂度；优先在同 package 内拆文件，再考虑拆 package。

## Interface and naming gate / 接口与命名门槛

- Define an interface in the package that consumes it, not beside its implementation.
- Return a concrete type from constructors unless callers must receive an interface.
- Use distinct role and implementation names: `Store` / `GormStore`, `Recorder` /
  `Proxy`; avoid two types both named `Repository` in different layers.
- Keep one cohesive port when it is one transactional boundary. Do not split it into
  many one-method interfaces merely to look more "clean".
- Delete empty marker packages and forwarding-only `impl` packages.

## Model and DTO gate / 模型与 DTO 门槛

- A business model must contain the state or behavior used by the Domain; an empty
  `models/` directory communicates no boundary and should not exist.
- Reuse a model at an HTTP boundary while the wire contract and business contract are
  intentionally identical. Introduce request/response DTOs when validation, security,
  versioning, or representation actually diverges.
- Keep Gorm records separate when preserving a legacy schema, storage encoding, or
  database-specific tags. Do not force the business model to inherit the storage model.

## Ownership rules / 归属规则

- A database/proxy/filesystem implementation used by one Domain belongs to that Domain.
- `internal/platform` contains only process-wide, cross-Domain capabilities and must not
  import Domain models, records, migrations, or workflows.
- HTTP, CLI, Rpc, Event, Task, and Tauri are adapters over Domain behavior; they do not
  become alternate business implementations.
- A Vine Module owns Domain lifecycle. A reusable technical connection may be an
  application Component; schema and migrations remain with the owning Domain.

## Compatibility-first refactor / 兼容性优先重构

1. Record the current route, API/IPC, schema, CLI, lifecycle, and shutdown contracts.
2. Move ownership without changing behavior; keep integration tests at the boundaries.
3. Collapse duplicate packages and rename ports/implementations by role.
4. Split files mechanically inside stable packages when readability still requires it.
5. Add richer DDD constructs only when business rules demonstrate the need.

Treat complexity as a budget, not a target. / 把复杂度当预算，而不是目标。
