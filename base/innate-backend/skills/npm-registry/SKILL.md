---
name: npm-registry
description: |
  Innate 私有 npm 仓库（Verdaccio）技能。何时使用：在 innate-apps / innate-fe-base 等 pnpm
  工程中使用 @innate 私有包、搭建私有 npm 仓库、配置简单认证（htpasswd）、启动/停止 Verdaccio、
  发布（publish）或安装（pull）@innate 包、排查私有包解析/认证问题。
  Innate private npm registry (Verdaccio) skill. Use when: consuming @innate private
  packages from pnpm workspaces, standing up a private npm registry, configuring simple
  htpasswd auth, starting/stopping Verdaccio, publishing or pulling @innate packages,
  or debugging private-package resolution/auth.
---

# npm-registry — Innate 私有 npm 仓库（Verdaccio）

> **Innate 落点**: `base/innate-backend/skills/npm-registry`
> 可执行脚本: `base/innate-backend/scripts/npm-registry.sh`
> 配置模板: [`templates/verdaccio-config.yaml`](./templates/verdaccio-config.yaml)
> 客户端示例: [`templates/.npmrc.example`](./templates/.npmrc.example)

## 1. 心智模型 / Mental model

Verdaccio 是一个本地/私有 npm 仓库（registry），可缓存上游 npm 包，也可托管 `@innate/*`
私有包。核心三件事：

| 关注点 | 机制 |
| --- | --- |
| 私有包托管 | `storage/` 存 tarball + 元数据 |
| 认证 | `auth.htpasswd`（sha1），`max_users: -1` 关闭自助注册，用户由脚本预置 |
| 上游代理 | `uplinks.npmmirror`，`@innate/*` 不设 proxy（防依赖混淆） |

认证链路：**服务端** `htpasswd` 校验用户名/密码 → **客户端** `.npmrc` 里 `//localhost:4873/:_auth=<base64(user:pass)>`
让 pnpm/npm 免交互发布与安装。

## 2. 目录与文件 / Layout

| 路径 | 说明 |
| --- | --- |
| `scripts/npm-registry.sh` | 唯一操作入口：`config` / `login` / `start` / `stop` / `status` / `publish` |
| `templates/verdaccio-config.yaml` | 配置模板（`{{STORAGE}}`/`{{HTPASSWD}}` 占位，由脚本渲染） |
| `templates/.npmrc.example` | 客户端认证 `.npmrc` 示例 |

运行态（默认 `~/.innate/verdaccio`，可用 `INNATE_REGISTRY_HOME` 覆盖）：

```
~/.innate/verdaccio/
├── config.yaml     # 渲染后的配置
├── storage/        # 包 tarball + 元数据
├── htpasswd        # 认证库
├── verdaccio.pid   # 进程 ID
└── verdaccio.log   # 运行日志
```

## 3. 快速开始 / Quick start

```bash
cd base/innate-backend

# 1) 预置认证用户（默认 innate / innate，可覆盖）
./scripts/npm-registry.sh login --user innate --password <password>

# 2) 启动
./scripts/npm-registry.sh start          # http://127.0.0.1:4873

# 3) 状态 / 停止
./scripts/npm-registry.sh status
./scripts/npm-registry.sh stop

# 4) 发布（在包目录内）
cd ../innate-fe-base/packages/ui
../../innate-backend/scripts/npm-registry.sh publish --package @innate/ui
```

## 4. 认证机制 / Auth

- 服务端：`login` 用 Node 内置 `crypto` 生成 `{SHA}` 行写入 `htpasswd`；配置 `algorithm: sha1`。
- 客户端：`login` 输出 `//localhost:4873/:_auth=<base64>`，写进消费方 `.npmrc`（推荐只作用域
  `@innate:registry`，见 [`.npmrc.example`](./templates/.npmrc.example) 的 Option B）。

## 5. 发布 @innate 包 / Publishing

`@innate/*` 包默认 `private: true`。要发布需：

1. 包 `package.json`：`"private": false`。
2. 提供可被消费的入口与构建产物（见下）。
3. `npm publish --registry http://localhost:4873/`（`npm-registry.sh publish` 已封装）。

> 注意：当前 `@innate/ui` 的 `main`/`types` 直接指向 `./src/index.ts`（源码）。registry
> 拉包需编译产物，生产发布前应加构建步骤（推荐 `tsup`），产出 `dist/` 并让 `main`/`types`/
> `exports`/`files` 指向 `dist`。验证认证/发布链路时可先按源码发布。

## 6. 常见问题 / Troubleshooting

| 症状 | 原因 / 处理 |
| --- | --- |
| `package not found, try to install verdaccio-htpasswd` | Verdaccio 经 pnpm 全局安装时插件解析失败；改用 `npm i -g verdaccio` |
| `publish` 返回 401 | `.npmrc` 缺 `_auth`，或 htpasswd 用户未创建；先 `login` |
| 依赖混淆 / 拉错源 | 私有 scope 未单独声明 `@innate:registry`，或模板里 `@innate/*` 误配了 `proxy` |

## 7. 黄金法则 / Golden rules

1. **私有 scope 不设 proxy**：`@innate/*` 永远不要配置 `proxy`，避免依赖混淆。
2. **认证走 htpasswd，不要开自助注册**：`max_users: -1`，用户只由 `login` 预置。
3. **配置模板不直接运行**：`{{...}}` 由脚本渲染成绝对路径后再交给 Verdaccio。
4. **客户端只作用域私有包**：`.npmrc` 用 `@innate:registry`，其余依赖走常规源。
