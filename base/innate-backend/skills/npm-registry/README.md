# npm-registry / Innate Private NPM Registry Skill

为 `innate-apps`（含 `innate-fe-base` 等 pnpm 工程）提供一个**本地私有 npm 仓库**，
用于托管 `@innate/*` 私有包，并通过简单认证控制发布/拉取。

## 能力

- 一键启动 / 停止 Verdaccio（独立于全局配置）
- 简单认证：`htpasswd`（sha1），关闭自助注册，用户由脚本预置
- 发布 `@innate/*` 包到私有仓库
- 客户端 `.npmrc` 认证片段生成

## 前置条件

- Node.js（用于 `login` 生成 sha1 哈希与 `.npmrc` `_auth`）
- Verdaccio：**推荐 `npm install -g verdaccio`**（pnpm 全局安装会导致
  `verdaccio-htpasswd` 插件解析失败，见 SKILL.md §6）

## 使用

```bash
cd base/innate-backend

./scripts/npm-registry.sh login --user innate --password <password>
./scripts/npm-registry.sh start
./scripts/npm-registry.sh status
./scripts/npm-registry.sh stop

# 发布（在包目录内，包需 private:false）
./scripts/npm-registry.sh publish --package @innate/ui
```

详见 [`SKILL.md`](./SKILL.md)。
