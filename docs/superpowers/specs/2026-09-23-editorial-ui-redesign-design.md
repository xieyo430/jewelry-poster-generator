# 珠宝海报生成器 — 杂志编辑风 UI 重构设计

日期：2026-09-23
范围：`frontend/` 视觉层与布局层全量重构

---

## 1. 目标与背景

现有前端是 Vue 3 + Pinia + 一套自制 Material Design 3 设计系统（token + 组件 CSS + `Md3*` 封装组件）。产品要求把界面**彻底改成另一个样子**，不是换配色。

已确认的两个决策：
- **改造层级**：设计语言 + 页面布局全换。
- **设计方向**：杂志编辑风（Editorial）。
- **弹窗范围**：`SettingsDialog`、`WelcomeDialog` 一并改造，不留新旧混杂。

### 为什么选杂志编辑风

现有界面"像 AI 生成"的根因不是配色，是**容器化**：每个概念都装进一个圆角矩形 + 投影的 Card，再用 8–16px 间距排成网格。这套做法把层次感外包给了盒子。杂志排版的解法相反——不给盒子，只用**字号层级、分隔线节奏、留白大小**建立结构。这是"只换配色"达不到的效果。

### 不改动的部分

`backend/` 全部、`frontend/src/api/index.js`、`frontend/src/store/poster.js`、`frontend/src/composables/useToast.js`、`frontend/src/data/presetActivities.js`。本次只动样式、布局模板和展示层工具函数。

---

## 2. 基础层：新 token 体系

### 2.1 为什么必须换前缀而不是换值

旧 token 叫 `--md-*`，语义是 Material 的：`--md-primary-container`、`--md-on-surface`、`--md-elevation-2`。新体系里**不存在"容器"和"投影"这两个概念**，只有纸、墨、线、点睛色。如果保留 `--md-` 前缀只改值，会留下一堆名为 `primary-container` 却指向不着任何容器的变量，属于把复杂度藏进命名里。故重命名为 `--ed-*`。

### 2.2 完整变量表

```
/* 纸与墨 */
--ed-paper:          #FBFAF7   /* 暖调米白，非旧的蓝调 #f9f9ff */
--ed-paper-deep:     #F4F1EA   /* 下沉区域：表头、代码块、禁用态 */
--ed-ink:            #16150F   /* 暖近黑 */
--ed-ink-soft:       #4A4740   /* 次级正文 */
--ed-ink-faint:      #8C877C   /* 元信息、页边注 */

/* 线（取代圆角边框与投影） */
--ed-rule:           #DAD5C9   /* 发丝线，1px */
--ed-rule-strong:    #16150F   /* 强调线，1px，用于选中与分区标题 */

/* 点睛色（由节日主色派生，见第 5 节） */
--ed-accent:         /* 节日主色加深后的可读版本 */
--ed-accent-deep:    /* 节日辅色 */
--ed-accent-tint:    /* 8% 淡色洗底 */

/* 状态 */
--ed-danger:         #9B2C1F
--ed-danger-tint:    #F7E9E6
--ed-ok:             #2F6B45

/* 字体 */
--ed-serif:  'Noto Serif SC', 'Songti SC', 'SimSun', Georgia, serif
--ed-sans:   'Noto Sans SC', -apple-system, 'Segoe UI', 'Microsoft YaHei', sans-serif
--ed-mono:   ui-monospace, 'SF Mono', 'Cascadia Code', Consolas, monospace

/* 字号（编辑风特征是跳跃大，不是 MD3 那种细腻梯度） */
--ed-display:   44px / 1.15   衬线    步骤主标题
--ed-title:     28px / 1.25   衬线    区块标题
--ed-subhead:   17px / 1.45   无衬线  小节标题
--ed-body:      15px / 1.75   无衬线  正文（行高偏大是刻意的）
--ed-label:     12px / 1.4    等宽    字段标签，字距 .06em
--ed-meta:      11px / 1.5    等宽    元信息，字距 .08em，大写

/* 间距（跳档比 MD3 更大，制造版面呼吸） */
--ed-space-1: 4px   --ed-space-2: 8px    --ed-space-3: 12px
--ed-space-4: 20px  --ed-space-5: 32px   --ed-space-6: 56px  --ed-space-7: 88px

/* 形状与动效 */
--ed-radius: 0                      /* 全局零圆角 */
--ed-ease: cubic-bezier(.2,.6,.2,1)
--ed-fast: 120ms   --ed-base: 200ms
```

**删除**：`--md-elevation-1..5`（全部投影）、`--md-shape-*`（圆角档位）、`--md-primary-container` 系列容器色、`--md-inverse-*`。

### 2.3 焦点可达性（现有缺陷，本次一并修）

现有 CSS **完全没有 `:focus-visible` 样式**，键盘用户拿不到任何焦点指示。新体系补上：

```css
:focus-visible {
  outline: 2px solid var(--ed-accent);
  outline-offset: 2px;
}
```

### 2.4 骨架屏去掉流光

现有 `.md3-skeleton` 用渐变 `background-position` 动画做 shimmer。新版改成纯 `--ed-paper-deep` 静态色块——流光动效本身是很强的"AI 生成感"来源。

---

## 3. 字体方案（方案 B：项目内自带）

### 3.1 现状缺陷

`index.html` 与 `global.css` 都在引 `Google Sans`，但 **Google Fonts 并不公开提供该字体**，所以当前标题一直在静默回退到系统字体。此外 Google Fonts 在中国大陆不可达（已实测 `fonts.googleapis.com` 连接失败）。两项都需要修掉。

### 3.2 方案

从 jsDelivr 拉取 `@fontsource/noto-serif-sc` 的预构建 woff2，落地到 `frontend/src/assets/fonts/`（项目当前没有 `public/` 目录，也不必新建——放 `src/assets/` 由 Vite 自动处理打包与文件名哈希，缓存失效更干净），在 `global.css` 里用相对路径 `url()` 声明 `@font-face`。全部离线可用，不依赖外网。

需要 4 个文件：
- `noto-serif-sc-chinese-simplified-400-normal.woff2` — 约 1.4 MB
- `noto-serif-sc-chinese-simplified-700-normal.woff2` — 约 1.5 MB
- `noto-serif-sc-latin-400-normal.woff2` — 约 18 KB
- `noto-serif-sc-latin-700-normal.woff2` — 约 18 KB

中文子集与拉丁子集分开 `@font-face` 声明，用 `unicode-range` 区分，浏览器按需取用。

正文无衬线继续用系统字体栈（`Noto Sans SC` → `Microsoft YaHei` → `PingFang SC`），不额外下载。等宽字用系统栈。

**已知代价**：约 2.9 MB 字体文件进仓库。首次加载略慢，之后走缓存。若后续觉得体积大，可用已装好的 `fontTools 4.63.0` 把中文子集裁剪到「常用 3500 字 + 项目源码中出现的全部汉字」，预计降到每字重 500–800 KB。**先按 2.9 MB 落地**，裁剪作为可选优化，不在本次范围内。

---

## 4. 布局重构

### 4.1 主流程三屏

**旧结构**

```
吸顶 AppBar → Hero 大卡片 → [260px 左栏：步骤导航 + 已填信息] → [右：卡片内容]
```

**新结构**

```
┌──────────────────────────────────────────────────────────┐
│ 珠宝海报生成器                                  设置   ?   │ 报头，下方一条发丝线
├──────────────────────────────────────────────────────────┤
│ 创建海报   01 节日与品牌  02 正面推广  03 反面活动          │ 横向文字标签，选中项下沉一条墨线
├──────────────────────────────────────────────────────────┤
│                                                          │
│  01                                         已填信息      │ 右侧页边注，等宽小字，无框
│  节日与品牌                                  节日 中秋     │
│  ──────────────────────────                  品牌 周大福   │
│  选择节日主题和珠宝品牌                        时间 10.01–07│
│                                                          │
│  节日主题                            必选                 │
│  七夕   中秋   春节   情人节   元宵                        │
│  ─────                                                   │
│  中秋      ▬ ▬ ▬                                         │
│                                                          │
│  珠宝品牌                                                 │
│  周大福        老凤祥        明牌                          │
│  ────────────────────────────────                        │
│  六福          谢瑞麟        TSL                          │
│  ──────────────────────────                              │
│                                       下一步  →          │
└──────────────────────────────────────────────────────────┘
```

四个关键动作：

1. **删除 260px 左栏**。步骤导航改为报头下方的横向文字标签（`StepTabs.vue` 取代 `StepNav.vue`），内容区有效宽度从约 900px 提升到 1200px。
2. **内容靠左成文栏，不做居中**。内容栏 `max-width: 760px`，左侧对齐容器起点，右侧留大片空白。居中版面是"网页模板"观感，左对齐 + 右留白才是版面感。
3. **「已填信息」改为右侧页边注**（`MarginNotes.vue` 取代 `InfoPanel.vue`）：等宽小字、无框无底、贴内容栏右缘，`position: sticky`。窄屏（< 1180px）折成报头下的一条可展开摘要线。
4. **删除 Hero 大卡片**。`创建你的珠宝海报` 退成报头左侧的一行小字，不再占一整块版面。

### 4.2 预览屏（`PosterPreview.vue`）

改成**图版页**布局：横向拉开的图片"版"，每张图下方配等宽小字说明（图版号 / 尺寸 / 操作），图片区与说明区之间用发丝线分隔。摘要信息从卡片改成**定义列表**（`<dl>` 语义，标签等宽小字、值用衬线）。灯箱保留，但改为直角、墨色边框。

### 4.3 弹窗

所有弹窗统一走新的 `EdDialog.vue` 外壳（1px 墨线框、纸底、零圆角、标题衬线）。目前 5 个弹窗各自重写了一遍遮罩层，本次收编。

`SettingsDialog` 的标签页用与步骤栏同一套文字标签 + 下划线语言；数据表改为**发丝线分隔的行**，去掉行内编辑的卡片感。

`WelcomeDialog` 的 4 页轮播保留，圆点指示器改成 `01 / 04` 等宽数字计数器。

---

## 5. 配色行为改变

### 5.1 旧行为

节日主色 → MD3 色调板算法 → 生成 30 余个变量 → **整个界面重刷**（surfaces、containers、outlines 全部跟着变色）。这是 Material You 的做法。

### 5.2 新行为

节日主色**只出现在五处**：
1. 步骤标签选中项的下划线
2. `01 / 02 / 03` 当前步骤序号
3. 节日标记（`.ed-mark`）选中项的下划线
4. `.ed-tag` 标签文字色
5. `.ed-note` 提示条左边线

**纸面与墨色恒定不动**。主色是点睛，不是主题。界面情绪稳定，也不会出现"选了红色节日整个界面变粉"的廉价感。

### 5.3 `utils/color.js` 收缩

从 148 行的 MD3 色调板生成器（含 HSL 互转、`TONE_TO_L` 映射表、30 余项色值推导）缩到约 30 行，只保留「十六进制 → 加深/降饱和到纸面可读」的派生逻辑。

**保持 `applyPalette()` / `resetPalette()` 两个导出接口签名不变**，`App.vue` 中调用处几乎无需改动。

---

## 6. 组件对照与新组件 API

### 6.1 对照表

| 旧 | 新 | 做法 |
|---|---|---|
| `Md3Button` / `md3-btn` 药丸 | `EdButton` | 直角。实心=墨底纸字；描边=1px 墨线；文字=悬停显下划线 + `→` |
| `Md3Card` / `md3-card` | **删除** | 由 `.ed-section` 取代：衬线标题 + 发丝线 + 内容，无盒 |
| `Md3Chip` / `md3-chip` 药丸 + 圆点 | `EdMark` | 纯文字标记，选中 = 墨色 + 2px 下划线（点睛色用在这条线上） |
| `Md3TextField` / `md3-field` 填充式 | `EdField` | 下划线式输入：标签移到输入框**上方**（等宽小字），框体只剩底部 1px 线 |
| `md3-dialog` 大圆角 | `EdDialog` | 遮罩 + 直角框 + 纸底 + 衬线标题，统一外壳 |
| `md3-alert` | `.ed-note` | 左侧 2px 线 + 等宽小标题（"注" / "警告"），无底色 |
| `md3-badge` | `.ed-tag` | 无底色，只有拉开字距的等宽彩色小字 |
| `md3-segmented` | `.ed-tabs` | 文字标签 + 下划线，与步骤栏同一套语言 |
| `md3-radio` | `.ed-choice` | 方形选择框，1px 墨线，选中填墨 |
| `md3-spinner` | `.ed-loader` | 细弧线旋转，线宽 1.5px |
| `md3-skeleton` 流光 | `.ed-skeleton` | 静态纸深色块，无动画 |
| `md3-empty` | `.ed-empty` | 衬线空态语句 + 发丝线 |
| `✓ ✕ ⚠ ✎ 🗑 ✨` 等 unicode 字符 | `EdIcon` | 新建统一图标组件 |

### 6.2 新建 `EdIcon.vue`

现状：图标系统不一致——6 个文件用手写 SVG，4 个文件用 unicode 字符（`Step2Promotions` 的 `⚠`、`Step3Activities` 的 `✎ 🗑 ✨`、`Md3Chip` 与 `Md3TextField` 的 `✓ ✕`），且**没有任何图标组件**。unicode 字符图标渲染依赖系统字体、粗细不一，也是"廉价感"来源之一。

新建单一图标组件，内置一套 stroke-width 1.5、`viewBox="0 0 24 24"` 的描边图标（Heroicons 风格），通过 `name` prop 取用：

```
<EdIcon name="close" :size="16" />
```

首批需要的图标：`close` `check` `arrow-right` `arrow-left` `chevron-down` `chevron-left` `chevron-right` `edit` `trash` `plus` `search` `calendar` `upload` `download` `eye` `eye-off` `gear` `help` `warning` `sparkle` `image` `zoom-in`。

颜色一律 `currentColor`，由父级控制。

### 6.3 收编重复实现

以下 5 个文件在各自 `<style>` 里重新实现了一遍公共组件样式，新组件接入后全部删除本地重写：

| 文件 | 重复实现的内容 |
|---|---|
| `SettingsDialog.vue` | 整套 `.md3-btn` 变体 + `.md3-spinner` |
| `WelcomeDialog.vue` | `.md3-btn--filled` / `--text` |
| `PosterPreview.vue` | 未用封装组件，直接写 `md3-btn--*` 等原始类名 |
| `ActivityModal.vue` | `.md3-divider`、`textarea.md3-field__textarea` |
| `CalendarRangePicker.vue` | `.md3-chip` |

同时清理各处硬编码色值（`rgba(0,0,0,.5)`、`#fff`、`rgba(255,255,255,.1)` 等）与内联 `style=` 撒糖式赋值。

---

## 7. 文件级改动清单

### 新增

```
frontend/src/assets/fonts/                 4 个 woff2 字体文件
frontend/src/styles/ed-tokens.css          取代 md3-tokens.css
frontend/src/styles/ed-components.css      取代 md3-components.css
frontend/src/components/common/EdIcon.vue      统一图标
frontend/src/components/common/EdButton.vue
frontend/src/components/common/EdField.vue
frontend/src/components/common/EdMark.vue
frontend/src/components/common/EdDialog.vue
frontend/src/components/common/StepTabs.vue    取代 StepNav.vue
frontend/src/components/common/MarginNotes.vue 取代 InfoPanel.vue
```

### 删除

```
frontend/src/styles/md3-tokens.css
frontend/src/styles/md3-components.css
frontend/src/components/common/Md3Button.vue
frontend/src/components/common/Md3Card.vue
frontend/src/components/common/Md3Chip.vue
frontend/src/components/common/Md3TextField.vue
frontend/src/components/common/StepNav.vue
frontend/src/components/common/InfoPanel.vue
```

### 重写

```
frontend/index.html                去 Google Fonts，改标题与内联图标
frontend/src/main.js               改样式引入路径
frontend/src/styles/global.css     字体栈、纸墨底、发丝线滚动条、:focus-visible
frontend/src/App.vue               报头 + 步骤栏 + 文栏 + 页边注；toast 改杂志风
frontend/src/components/PosterWizard.vue          铺平，去侧栏
frontend/src/components/PosterPreview.vue         图版页
frontend/src/components/EnhancePanel.vue          走 EdDialog
frontend/src/components/steps/Step1FestivalBrand.vue
frontend/src/components/steps/Step2Promotions.vue     含 unicode 图标替换
frontend/src/components/steps/Step3Activities.vue     含 unicode 图标替换 + 去原生 confirm()
frontend/src/components/common/ActivityModal.vue
frontend/src/components/common/SettingsDialog.vue
frontend/src/components/common/WelcomeDialog.vue
frontend/src/components/common/CalendarRangePicker.vue
frontend/src/components/common/DiscountTypeSelect.vue
frontend/src/components/common/GenerateProgressDialog.vue
frontend/src/utils/color.js        148 行 → 约 30 行
```

### 顺带修掉的现存缺陷

1. `:focus-visible` 完全缺失 —— 键盘不可用。
2. 引入一个公开渠道拿不到的字体（`Google Sans`），静默回退。
3. 外链 Google Fonts，中国大陆不可达。
4. `Step3Activities` 与 `SettingsDialog` 用原生 `confirm()` —— 样式不可控、阻断式，与整体风格冲突，改为 `EdDialog` 确认框。
5. 图标系统分裂为 unicode 字符与手写 SVG 两套。

---

## 8. 验证方式

1. `cd frontend && npm run dev` 起开发服务器，**在浏览器里实际走完整流程**：选节日与品牌 → 填正面推广 → 加反面活动与商家信息 → 生成 → 预览 → 下载 → AI 优化。
2. 逐屏截图对照，确认：无任何残余圆角、无任何投影、无 MD3 残留（在 `frontend/src/` 下搜索 `md3-` 与 `Md3` 应为零命中；`frontend/dist/` 是旧构建产物，重新构建后自然覆盖）。
3. 键盘走查：Tab 遍历全流程，确认每一步都有可见焦点环。
4. 断网重载页面，确认衬线标题仍然正确渲染（验证字体确实本地化）。
5. 切几个不同节日，确认纸面与墨色**不随主色变化**，只有点睛色变。
6. 窄屏（1024px / 768px）走查布局折叠。

---

## 9. 明确不做的事

- **不做暗色模式**。未提出需求，且会显著增加配色推导的复杂度。
- **不做字体子集裁剪**。先按 2.9 MB 落地，体积成为实际问题时再裁（第 3.2 节已留路径）。
- **不改后端、API 层、store 逻辑、`presetActivities` 数据**。
- **不引入任何 UI 框架或图标库依赖**。图标手写 SVG 内联，样式手写 CSS。
- **不重构与视觉无关的代码**。
