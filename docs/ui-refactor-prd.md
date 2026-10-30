# 向导页 UI 重构需求文档

- 日期：2026-09-26
- 范围：海报生成向导，重点为步骤 1 `Step1FestivalBrand.vue`；共享控件改动自动惠及步骤 2/3
- 目标：解决信息过载、必选/选填标识混乱、控件选中态不清、配色预览脱节、流程反馈缺失、文案层级粘连六个问题

## 现状依据

| 已有资产 | 说明 |
|---|---|
| `StepTabs.vue` | 三步进度条已存在（节日与品牌 / 正面推广 / 反面活动） |
| `EdSection.vue` | 区块容器，已支持「编号 + 标题 + 灰色说明」 |
| `EdMark.vue` | 文本下划线式选项，被节日墙、日期预设、步骤 2/3 共用 |
| `CalendarRangePicker.vue` | 区间选择，含快捷预设、日历弹层、「共 N 天」、清除 |
| pinia persist | store 已持久化，刷新不丢输入（事实上的草稿保存） |
| `Step1FestivalBrand.vue` 内 pcard | 已按节日三色实时渲染小样，并联动主题/副标题 |

## 需求与验收标准

### R1 节日主题分面分组（对应问题 1）

- 新增 `src/data/festivalGroups.js`，按节日 `code` 映射四类：
  - 传统节日：spring-festival、yuanxiao、qingming、dragon-boat、qixi、mid-autumn、chongyang、winter-solstice、laban
  - 现代节日：new-year、valentine、white-valentine、520-day、mother-day、father-day、teachers-day、national-day、christmas、halloween、thanksgiving、women-day、girl-day
  - 电商节点：double-eleven、double-twelve、618-sale、black-friday、anniversary、grand-opening、new-arrival-spring、new-arrival-autumn、season-clearance、member-day、wedding-season
  - 未命中 code 一律归入「电商节点」之后的兜底分组，保证新节日不丢失
- 节日墙顶部为分组 tab：全部 / 传统节日 / 现代节日 / 电商节点；默认「全部」
- 分组右侧提供关键字过滤输入框（原生 `<input>`，按名称即时过滤）
- 选中项在切换分组/过滤后保持可见性提示（已选节日名在组标题旁回显）
- 验收：任意 tab 下选项数 ≤ 一屏；输入「中秋」仅余中秋节；切换 tab 不丢失已选值

### R2 必选/选填标识与控件规范（对应问题 2、3）

- 统一区块头为「标题 + 徽章 + 一句灰色用途说明」：
  - 必选：红色 `*` + 深色「必选」徽章
  - 选填：灰色「选填」徽章；占位符只放示例，不再出现「选填」字样
- `EdMark` 升级为 chip 控件：描边 + 内边距 + 选中底色/描边变色 + 选中勾选图标；一处改动，节日墙、日期预设、步骤 2/3 同时生效
- 品牌卡：最小高度 40px、描述压缩为一行副文案、选中勾选保留；补 `:focus-visible` 焦点样式
- 全局补 `:focus-visible` 轮廓与 chip/卡片的 `aria-pressed`（已有）/选中语义
- 活动主题两个输入框：第二行补标签「优惠副标题」，不再只有 placeholder
- 验收：Tab 键可依次聚焦所有选项并有清晰焦点环；选中/未选中一眼可辨；页面无两处写法不同的「必选/选填」

### R3 配色预览与小样联动（对应问题 4）

- 小样卡片保留实时联动；修正小样占位文案：品牌名称 / 活动主题示例 / 优惠示例（不再写「选填」）
- 配色方案名（colorScheme）与三色 hex 分区展示，方案名作为该组标题，hex 前放色块
- 「小样为配色示意，实际以 AI 出图为准」降为小样下方 12px 灰字
- 修正「优惠活动区域 / 海报配色预览」标题粘连：两者间距拉开，各自独立成行
- 验收：未选节日时为空态；选节日后小样、方案名、三色同步变化；输入主题/副标题后小样文字实时更新

### R4 流程引导与操作反馈（对应问题 5）

- 步骤 1 底部操作区：次按钮「清空重填」（调 `resetAll`）+ 主按钮「下一步」
- 必填未满足：「下一步」置灰（已有逻辑），提示文案保留并在节日/品牌标题徽章处给红色提醒态
- 「共 N 天」改为徽章样式（描边小标签），紧跟结束日期之后；清除按钮改为图标 + 「清空」文字
- 步骤 2/3 已有「上一步」的不回退；若缺则按同规范补齐（仅当实际缺失时做）
- 验收：清空重填后回到步骤 1 初始态；选好区间后日期行显示「开始 — 结束 [共 N 天] [清空]」，信息互不粘连

### R5 文案层级（对应问题 6）

- 步骤 1 四个区块统一头部样式（标题字号 > 徽章 > 灰色说明），每块一句用途说明：
  - 节日主题：决定海报主视觉与配色
  - 珠宝品牌：用于海报品牌署名
  - 活动主题：用于生成海报主标题文案
  - 活动时间：用于海报活动周期标注
- 验收：区块标题与说明、相邻区块标题之间均无法连读成一句话

## 明确不做（YAGNI）

- **自定义节日创建**：当前无此数据模型与入口；需要时再加（节日表 + 创建表单）
- **品牌专属活动动态追加**：festival 与 brand 无关联字段，当前 618 等为通用节点；需要时给 festivals 加 brand_code 列
- **多套配色切换**：配色由节日唯一决定，不提供备选色板；小样已承担预期管理
- 后端、生成接口、数据结构均不改动（分组映射放前端）

## 分步执行计划

| 阶段 | 内容 | 涉及文件 |
|---|---|---|
| P1 | 节日分组映射 + tab + 过滤 | `data/festivalGroups.js`（新）、`Step1FestivalBrand.vue` |
| P2 | EdMark chip 化 + 徽章规范 + 焦点样式 | `EdMark.vue`、`global.css`、`Step1FestivalBrand.vue` |
| P3 | 预览小样与配色区修正 | `Step1FestivalBrand.vue` |
| P4 | 操作区与日期行反馈 | `Step1FestivalBrand.vue`、`CalendarRangePicker.vue` |
| P5 | 浏览器走查全部验收项 | — |

每阶段完成后在 http://localhost:5173 实测，全部完成后统一汇报。
