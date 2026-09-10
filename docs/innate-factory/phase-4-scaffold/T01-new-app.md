# T01 — new_app 生成器

> Sprint 4 ｜ 状态：todo

## 步骤

1. `factory/scaffold/new_app.py`：
   - 入参：name、`--template`（默认 app-content）、`--category`（content/tooling/edu…）、`--deploy`、`--gh-repo`（可选）
   - 流程：复制模板 → 占位符替换 → `git init` + 首 commit → `registry/apps.yaml` 追加条目（kind: app, template, templateVersion, deploy）→ 可选 `gh repo create` + clone 到 `innate-apps/<category>/`
2. 校验：name 合法性、模板存在、registry 无重名
3. 输出"下一步"指引（cd 路径、dev 命令、看板 issue 模板）

## 验收

生成即构建绿；registry 登记后跑 scan 无字段丢失（Sprint 1 契约回归）。
