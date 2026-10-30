# 设计资源

本项目接入了两个本地开发资源：

## Awesome DESIGN.md

源码位于 `third-party/awesome-design-md`，用于查阅真实产品的设计语言分析。项目实际执行规范收敛在根目录 `DESIGN.md`，避免后续开发直接照搬某一个品牌风格。

启动后访问 `http://127.0.0.1:5175/`。

## React Bits

源码位于 `third-party/react-bits`，用于参考动效、交互反馈、组件状态和视觉表现。它是 React 项目，当前海报工坊仍保持 Vue 技术栈，因此不把 React Bits 运行时打进生产前端。

启动后访问 `http://127.0.0.1:5174/`。

后续使用约束：

- 先参考 React Bits 的交互行为，再按 Vue 组件模式实现。
- 不直接复制带有额外授权限制的组件到产品源码；需要引入时先检查 `third-party/react-bits/LICENSE.md`。
- 新增页面和组件遵守根目录 `DESIGN.md`，并保持餐饮、数码、珠宝三种行业的视觉逻辑独立。

## 启动

在 PowerShell 执行：

```powershell
.\scripts\start-design-resources.ps1
```
