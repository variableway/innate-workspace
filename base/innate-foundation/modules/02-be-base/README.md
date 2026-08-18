# 02-be-base — 后端基础任务

任务索引仍在本目录；**可执行代码**在：

[`base/innate-backend/innate-go`](../../../innate-backend/innate-go/)

- CLI：`innate-go`
- Meta CRUD server：`innate-go server meta`
- Vine REST 样例：`innate-go/samples/vine-rest`
- Skill：[`base/innate-backend/skills/backend-go`](../../../innate-backend/skills/backend-go/)

## 栈

**Go + Vine**（参考 `base/references/backend/golang-backend/vine-skill`）。

## 快速开始

```bash
cd base/innate-backend/innate-go
task build
task run:server          # meta CRUD
task run:vine            # Vine standalone REST (:18081)
```

## 任务索引

| 任务 | 说明 | 优先级 |
|------|------|--------|
| [T01-rest-standalone.md](tasks/T01-rest-standalone.md) | Standalone REST 服务样例 | P0 |
| [T02-cli-sample.md](tasks/T02-cli-sample.md) | CLI 样例 | P0 |
| [T03-api-conventions.md](tasks/T03-api-conventions.md) | REST / 错误模型约定 | P0 |
| [T04-linked-mode.md](tasks/T04-linked-mode.md) | Linked 模式样例 | P1 |
| [T05-separated-mode.md](tasks/T05-separated-mode.md) | Separated 模式样例 | P2 |
| [T06-be-starter-skill.md](tasks/T06-be-starter-skill.md) | 编写 be-starter skill | P1 |
| [T07-prepare-registry.md](tasks/T07-prepare-registry.md) | 升格门槛 / registry 材料 | P2 |
