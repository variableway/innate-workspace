# T03 — scan.py 扩展字段 round-trip 保留

> Sprint 1 ｜ 状态：done（2026-09-10）

## 背景

schema 扩展前必须先补的缺口：`scan.py` 的 `merge()` 用 `entry = dict(new)` 起底（discovered 只有 name/repo/path/desc 四字段），旧条目的扩展字段会在合并时丢失；`write_registry()` 也只写四字段。**不补此缺口，apps.yaml 里手工维护的 kind/template/deploy 会在第一次 scan 时被静默剥掉。**

## 实现要点

1. `BASE_FIELDS = ("name", "repo", "path", "desc")`；`extra_fields()` / `write_extra_fields()` 辅助函数
2. `merge()` 匹配分支追加 `entry.update(extra_fields(old))`——旧条目扩展字段过继到新条目
3. `write_registry()` 在 desc 行后输出扩展字段；list 用 flow style（`deploy: [pages, cloudflare]`）
4. `yaml_scalar()`：`@` 等保留字符开头的标量自动加引号（`publishes: ["@innate/ui"]`），否则下次 round-trip 直接 YAML 解析失败

## 验收（全部通过）

- 旧/新 scan.py 对根 `registry.yaml` **副本**的 round-trip 输出逐字节一致 → 对 references 管理零行为影响
- schema 回填后跑 scan，扩展字段全部保留、条目不重排

## 教训

未加引号标量里的 `": "`（如 desc 写了 `kind: external`）会被 YAML 当嵌套映射解析——本次执行即踩中并修复，desc 措辞避开 ASCII 冒号。

## 执行记录（2026-09-10）

- 工作区 `scan.py` 补齐 `extra_fields` / `write_extra_fields` / `yaml_scalar`（相对 HEAD 的行为缺口）
- 旧 HEAD `scan.py` 与新实现对根 `registry.yaml` **副本**的 `write_registry` 输出逐字节一致（8483 bytes）
- `apps.yaml` schema 回填后第二次 scan：`kind` / `template` / `deploy` / `publishes` 全部保留，含 `hallmark.kind: external`

