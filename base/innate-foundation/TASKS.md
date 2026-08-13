# 全量任务索引

执行方式：对 Agent 说「请执行 `<path>`，使用 Local Workflow。」

## 横切（`tasks/`）

| ID | 文件 | 优先级 | 依赖 |
|----|------|--------|------|
| G01 | [tasks/G01-readme-and-naming.md](tasks/G01-readme-and-naming.md) | P0 | — |
| G02 | [tasks/G02-flock-positioning.md](tasks/G02-flock-positioning.md) | P0 | — |
| G03 | [tasks/G03-registry-bootstrap.md](tasks/G03-registry-bootstrap.md) | P1 | G01 |

## 01-fe-base

| ID | 文件 | 优先级 | 依赖 |
|----|------|--------|------|
| T01 | [modules/01-fe-base/tasks/T01-canonical-entry.md](modules/01-fe-base/tasks/T01-canonical-entry.md) | P0 | — |
| T02 | [modules/01-fe-base/tasks/T02-fe-starter-gap-audit.md](modules/01-fe-base/tasks/T02-fe-starter-gap-audit.md) | P1 | T01 |
| T03 | [modules/01-fe-base/tasks/T03-package-reuse-boundary.md](modules/01-fe-base/tasks/T03-package-reuse-boundary.md) | P1 | T01 |

## 02-be-base

| ID | 文件 | 优先级 | 依赖 |
|----|------|--------|------|
| T01 | [modules/02-be-base/tasks/T01-stack-adr.md](modules/02-be-base/tasks/T01-stack-adr.md) | P0 | G01 |
| T02 | [modules/02-be-base/tasks/T02-scaffold-skeleton.md](modules/02-be-base/tasks/T02-scaffold-skeleton.md) | P0 | T01 |
| T03 | [modules/02-be-base/tasks/T03-api-conventions.md](modules/02-be-base/tasks/T03-api-conventions.md) | P0 | T02 |
| T04 | [modules/02-be-base/tasks/T04-be-starter-skill.md](modules/02-be-base/tasks/T04-be-starter-skill.md) | P1 | T03 |
| T05 | [modules/02-be-base/tasks/T05-prepare-registry.md](modules/02-be-base/tasks/T05-prepare-registry.md) | P2 | T04, G03 |

## 03-infra

| ID | 文件 | 优先级 | 依赖 |
|----|------|--------|------|
| T01 | [modules/03-infra/tasks/T01-compose-baseline.md](modules/03-infra/tasks/T01-compose-baseline.md) | P0 | G01 |
| T02 | [modules/03-infra/tasks/T02-env-health-volumes.md](modules/03-infra/tasks/T02-env-health-volumes.md) | P0 | T01 |
| T03 | [modules/03-infra/tasks/T03-optional-profiles.md](modules/03-infra/tasks/T03-optional-profiles.md) | P1 | T02 |
| T04 | [modules/03-infra/tasks/T04-project-include-docs.md](modules/03-infra/tasks/T04-project-include-docs.md) | P1 | T02 |

## 04-agent-provider

| ID | 文件 | 优先级 | 依赖 |
|----|------|--------|------|
| T01 | [modules/04-agent-provider/tasks/T01-config-contract.md](modules/04-agent-provider/tasks/T01-config-contract.md) | P0 | G02 |
| T02 | [modules/04-agent-provider/tasks/T02-capability-inventory.md](modules/04-agent-provider/tasks/T02-capability-inventory.md) | P0 | T01, G02 |
| T03 | [modules/04-agent-provider/tasks/T03-lib-mvp.md](modules/04-agent-provider/tasks/T03-lib-mvp.md) | P0 | T01, T02 |
| T04 | [modules/04-agent-provider/tasks/T04-aiswitcher-boundary.md](modules/04-agent-provider/tasks/T04-aiswitcher-boundary.md) | P1 | T03 |

## 05-agent-runtime

| ID | 文件 | 优先级 | 依赖 |
|----|------|--------|------|
| T01 | [modules/05-agent-runtime/tasks/T01-runtime-api.md](modules/05-agent-runtime/tasks/T01-runtime-api.md) | P0 | 04/T01 |
| T02 | [modules/05-agent-runtime/tasks/T02-extract-vs-wrap.md](modules/05-agent-runtime/tasks/T02-extract-vs-wrap.md) | P0 | T01, G02 |
| T03 | [modules/05-agent-runtime/tasks/T03-mvp-loop.md](modules/05-agent-runtime/tasks/T03-mvp-loop.md) | P0 | T02, 04/T03 |
| T04 | [modules/05-agent-runtime/tasks/T04-skill-loading.md](modules/05-agent-runtime/tasks/T04-skill-loading.md) | P1 | T03 |

## 06-desktop-shell

| ID | 文件 | 优先级 | 依赖 |
|----|------|--------|------|
| T00 | [modules/06-desktop-shell/tasks/T00-shared-cargo-target.md](modules/06-desktop-shell/tasks/T00-shared-cargo-target.md) | P0 | — |
| T01 | [modules/06-desktop-shell/tasks/T01-shareable-inventory.md](modules/06-desktop-shell/tasks/T01-shareable-inventory.md) | P0 | G02 |
| T02 | [modules/06-desktop-shell/tasks/T02-shell-lib-scaffold.md](modules/06-desktop-shell/tasks/T02-shell-lib-scaffold.md) | P0 | T01 |
| T03 | [modules/06-desktop-shell/tasks/T03-empty-app-template.md](modules/06-desktop-shell/tasks/T03-empty-app-template.md) | P0 | T02 |
| T04 | [modules/06-desktop-shell/tasks/T04-shell-docs.md](modules/06-desktop-shell/tasks/T04-shell-docs.md) | P1 | T03 |

## 07-desktop-components

| ID | 文件 | 优先级 | 依赖 |
|----|------|--------|------|
| T01 | [modules/07-desktop-components/tasks/T01-component-inventory.md](modules/07-desktop-components/tasks/T01-component-inventory.md) | P0 | G02 |
| T02 | [modules/07-desktop-components/tasks/T02-fe-desktop-layering.md](modules/07-desktop-components/tasks/T02-fe-desktop-layering.md) | P0 | T01 |
| T03 | [modules/07-desktop-components/tasks/T03-core-components-mvp.md](modules/07-desktop-components/tasks/T03-core-components-mvp.md) | P0 | T01, T02 |
| T04 | [modules/07-desktop-components/tasks/T04-consume-story.md](modules/07-desktop-components/tasks/T04-consume-story.md) | P1 | T03 |

## 推荐开干顺序

1. G01、G02  
2. 03-infra T01→T02  
3. 02-be-base T01→T02  
4. 04 → 05  
5. 06：T00（共享 cargo cache，已完成）→ T01…T04，再 07  
6. 01-fe-base 可全程并行  
