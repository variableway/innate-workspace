# T03 — 模板冒烟 CI

> Sprint 3 ｜ 状态：todo ｜ 依赖：T01

## 步骤

1. `.github/workflows/template-smoke.yml`：
   - 触发：`factory/templates/**` 变更 + `schedule` 每周
   - 矩阵遍历每个模板目录：替换占位符（固定测试值）→ `pnpm install` → `pnpm build`
2. verdaccio 依赖问题：CI 内起临时 verdaccio 容器 + 本地 publish `@innate/ui`（Sprint 2 T05 方案 b）
3. 失败通知：模板腐烂在 CI 被拦，不出现在新 app 生成时

## 验收

- 故意改坏模板（如删一个 import）→ CI 红；还原 → 绿
