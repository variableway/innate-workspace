# T01 — verdaccio selfhost

> Sprint 2 ｜ 状态：todo

## 步骤

1. `base/innate-selfhost/verdaccio/`：docker-compose（端口 4873，本地持久化 storage）+ `conf/config.yaml`
2. config 要点：`@innate/*` 允许 publish（`$authenticated` 或单人简化为本地免认证起步）；uplink npmjs 代理公共包（装依赖不绕路）
3. 消费侧 `.npmrc` 模板：`@innate:registry=http://localhost:4873`（进 app-content 模板与各 app 仓）
4. fe-base 内验证：`pnpm add` 一个假 `@innate/test` 包走通发布-安装回路

## 验收

publish + install 回路走通；公共包（react 等）仍从 npmjs 正常安装。

## 风险

- 本地免认证仅限本机使用；若日后暴露到局域网，加 `htpasswd` 认证再开放
