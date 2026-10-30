---
version: 1
name: Haibao Studio Design System
description: "面向餐饮、数码家电和珠宝行业海报创作的克制型工作台。优先保证信息层级、可读性和可恢复的创作流程，再使用轻量动效强化反馈。"

colors:
  canvas: "#f7f8fa"
  surface: "#ffffff"
  surface-muted: "#f1f3f6"
  ink: "#17191c"
  ink-muted: "#747c87"
  ink-subtle: "#9aa1ab"
  hairline: "#e1e5ea"
  accent: "#5567d9"
  accent-hover: "#4354c5"
  success: "#2f8f63"
  danger: "#c84c4c"
  studio-dark: "#171a1f"

typography:
  display:
    fontFamily: "Noto Serif SC, Georgia, serif"
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: 0
  heading:
    fontFamily: "Noto Sans SC, system-ui, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: 0
  body:
    fontFamily: "Noto Sans SC, system-ui, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0
  meta:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: 10px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.08em

rounded:
  control: 7px
  card: 10px
  panel: 14px
  pill: 9999px

spacing:
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 40px
  section: 64px

principles:
  - "创作台优先：首屏直接进入可操作流程，不使用营销型大面积 Hero。"
  - "信息先于装饰：海报输入、活动规则、门店信息和生成状态必须清晰可扫描。"
  - "行业有差异：餐饮强调食欲与到店行动，数码强调参数与购买理由，珠宝强调节日和品牌质感。"
  - "动效服务反馈：只用于加载、状态切换、聚焦和结果出现，不使用无意义的持续动画。"
  - "可恢复：生成、保存、重新生成和新建项目都要保留明确状态，不让用户丢失上下文。"

components:
  primary-button:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  secondary-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  form-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  workspace-panel:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.panel}"
    padding: "24px"
---

# Implementation Notes

This file is the project-specific working contract derived from the `DESIGN.md` collection in `third-party/awesome-design-md`. The local Linear analysis is used as a reference for dense product-workspace hierarchy, restrained surfaces, hairline borders, and deliberate accent usage; it is not copied wholesale into the product.

React Bits is available as a local component and motion reference site at `http://127.0.0.1:5174/`. Because the product is Vue, future integrations should port the interaction idea and visual behavior into Vue components rather than adding React to the production bundle.

Before adding a new visual pattern, check:

1. Does it improve a real creation workflow?
2. Does it preserve the active industry logic and user-entered data?
3. Does it have loading, empty, error, success, and recovery states?
4. Does it remain readable at narrow desktop and mobile widths?
