# T03 — innate-wip 撤副本改消费

> Sprint 2 ｜ 状态：todo ｜ 依赖：T02

## 步骤（顺序不可换）

1. wip 根 `.npmrc` 加 `@innate:registry=http://localhost:4873`
2. `apps/web` 依赖 `"@innate/ui": "workspace:*"` → `"~0.1.1"`
3. `pnpm remove` 后重装，确认来自 verdaccio（`pnpm why` / lockfile 指向 4873）
4. **构建验证绿**（`STATIC_EXPORT=true pnpm build`）
5. 绿了之后才删 `packages/ui` 目录 + 移出 pnpm-workspace（若有显式引用）

## 验收

- wip 构建绿；lockfile 中 `@innate/ui` resolution 指向 localhost:4873
- 仓库内 `@innate/ui` 源码副本只剩 fe-base 一份

## 风险

- verdaccio 未起就删副本 → 站点构建断：严格按"先消费验证、后删副本"
- CI（GitHub Actions）拉不到 localhost 的包 → CI 阶段用 GitHub Packages 平移或 cache 方案，见 T05 备注
