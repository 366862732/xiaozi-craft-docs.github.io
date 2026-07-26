# 侧边栏位置调整 Spec

## Why
用户希望将左侧边栏整体向左移动一点，以改善页面布局效果。

## What Changes
- 在 `custom.css` 中为 `.VPSidebar` 添加负的 left margin 或 translate 偏移
- 尝试较小的偏移值（如 -10px），用户可根据实际效果调整

## Impact
- Affected specs: none
- Affected code: `docs/.vitepress/theme/custom.css`

## MODIFIED Requirements
### Requirement: Sidebar Position
当前侧边栏使用默认 VitePress 定位。修改后：
- 侧边栏整体向左偏移少量像素（尝试 -10px）
- 不影响侧边栏功能性和内容可读性
- 偏移量可通过修改 CSS 值灵活调整
