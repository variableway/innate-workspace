# 07-desktop-components — Desktop 基础组件

## 范围

跨 Desktop 产品的 UI 积木：聊天面板、工具审批、Provider 设置、工作区壳、状态条等。

## 代码落点

- 本目录组件库（建议 React；与 FE 设计 token 对齐策略由 T02 决定）
- 参考 Flock UI 交互，不搬运 Mantine 整套业务页

## 依赖

- `01-fe-base` 复用边界（T03）
- `06-desktop-shell` 空应用可作宿主
- `04`/`05` 提供设置与会话数据形状（可先 mock）

## 任务索引

| 任务 | 说明 | 优先级 |
|------|------|--------|
| [T01-component-inventory.md](tasks/T01-component-inventory.md) | 从交互提炼组件清单 | P0 |
| [T02-fe-desktop-layering.md](tasks/T02-fe-desktop-layering.md) | 与 innate-fe-base 分层关系 | P0 |
| [T03-core-components-mvp.md](tasks/T03-core-components-mvp.md) | 实现核心组件 MVP | P0 |
| [T04-consume-story.md](tasks/T04-consume-story.md) | 包消费方式与示例 | P1 |
