# Projects

具体项目，按类型分类。

## 工具类

自研开发工具，辅助 AI Agent 协作与开发流程。

| 项目 | 本地路径 | GitHub | 说明 |
|------|----------|--------|------|
| innate-aiswitcher | `tooling/innate-aiswitcher` | [variableway/innate-aiswitcher](https://github.com/variableway/innate-aiswitcher) | 本地 LLM Provider 切换器（Go + PocketBase） |

> 原 `innate-meta-api` / `innate-vine-rest` 已合并进 **`base/innate-backend/innate-go`**（CLI `innate-go` + meta server + Vine REST sample + desktop Cargo 配置）。

## 项目产品类

完整的产品/系统项目。

| 项目 | 本地路径 | GitHub | 说明 |
|------|----------|--------|------|
| agent-kanban | `agent-kanban` | — | 多 AI Agent 统一看板系统（架构设计 + 双后端实现） |
| reset-from-zero | `reset-from-zero` | [variableway/reset-from-zero](https://github.com/variableway/reset-from-zero) | AI Agent 辅助的项目分析与重构集合 |

## 教程类

参考项目，用于学习和对标。

| 项目 | 本地路径 | GitHub | 说明 |
|------|----------|--------|------|
| Instatic | `references/Instatic` | [CoreBunch/Instatic](https://github.com/CoreBunch/Instatic) | 参考项目 |

## 克隆

项目已注册在根目录的 `registry.yaml` 中，运行：

```bash
python3 ../scripts/clone.py
```
