# 珠宝海报生成器 — 杂志编辑风 UI 重构 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `frontend/` 从 Material Design 3 视觉体系整体改写为杂志编辑风（Editorial），并重塑页面布局，使界面与原版完全不同。

**Architecture:** 采用**并行共存、逐屏切换**策略，而不是一次性大爆炸替换。先并排引入新的 `--ed-*` token 与新 `Ed*` 组件（旧 `--md-*` 与 `Md3*` 暂时保留、应用仍可运行），然后一个屏幕一个屏幕地迁移。每个任务结束时应用都能构建、能跑、该屏幕是新样式、未迁移屏幕是旧样式。全部迁移完成后，最后统一删除 MD3 残留，并用一条 grep 断言归零。

**Tech Stack:** Vue 3.5（SFC + `<script setup>`）、Pinia、Vite 5、原生 CSS（无 UI 框架、无 CSS 预处理）、Playwright MCP（验证用，不引入 npm 依赖）。

---

## Global Constraints

来自设计文档 `docs/superpowers/specs/2026-09-23-editorial-ui-redesign-design.md`，每个任务都隐含遵守：

- **零圆角**：全局所有元素 `border-radius: 0`。不允许出现任何非零圆角。
- **零投影**：不允许任何 `box-shadow`。层级只用 1px 线与留白表达。
- **禁止 emoji 与 unicode 字符作图标**：一律用 `EdIcon`。失败信号：源码里出现 `⚠ ✎ 🗑 ✨ ✓ ✕ → ← +` 之类被当作图标的字符。
- **零 MD3 残留**：`frontend/src/` 下最终不得出现 `md3-` 类名、`Md3` 组件名、`--md-` 变量。
- **不新增 npm 依赖**：字体是静态资源文件，图标手写内联 SVG，样式手写 CSS。
- **不动后端**：`backend/` 任何文件不改。`api/index.js`、`store/poster.js`、`composables/useToast.js`、`data/presetActivities.js` 不改。
- **保留无障碍**：所有可交互元素必须有可见 `:focus-visible` 焦点环。**不得在基础规则里写 `outline: none`**——scoped 样式会附加 `[data-v-hash]`，特异性 (0,2,0) 高于全局 `:focus-visible` 的 (0,1,0)，会把焦点环整个吃掉。要抹掉鼠标点击的默认描边，只能写 `:focus:not(:focus-visible)`。
- **中文界面文案不变**：本次只改视觉与布局，不改任何用户可见文案与业务校验规则。
- **字体**：`Noto Serif SC` 中文字重 400 / 700 必须内嵌在 `src/assets/fonts/`，不引用任何外网字体。
- **跨组件的版式类只有一份，在 `global.css`**：`.block` / `.block__head` / `.block__title` / `.block__opt` / `.fields` / `.actions` / `.actions__hint` / `.brands` / `.brand` / `.brand__name` / `.brand__desc` / `.brand__tick` / `.note` / `.tabline` / `.tabline__item`。**任何组件都不得在自己的 `<style scoped>` 里重新定义这些类**（scoped 定义既不能被别的组件拿到，又会与全局那份漂移）。要在某组件里定义新样式，类名必须带该组件自己的前缀（如 `.step-tab__num`、`.notes__value`）。

### 环境事实（已实测，实施时按此为准）

- 后端：`cd backend && node src/app.js`，监听 `127.0.0.1:3001`。MySQL 已连通，`/api/festivals` 与 `/api/brands` 返回真实数据。
- 前端：`cd frontend && npx vite`，端口 **5173**。
- **CORS 只放行 `http://localhost:5173` 与 `http://127.0.0.1:5173`**（`backend/src/app.js:18`）。若 vite 因端口占用退到 5174，所有 API 请求会被浏览器 CORS 拦掉，页面会显示为空列表。**验证必须使用 5173**；被占用时先确认占用者是不是本项目的 dev server（`curl -s http://127.0.0.1:5173/ | head -c 200`），是则直接复用，不要另起。
- Node v24.14.1 / npm 11.11.0。

### 验证方式说明（重要，请先读）

这是视觉重构，**没有也不应该有单元测试**——断言 DOM 快照对 CSS 改版毫无价值。每个任务的验证由三件真实的事构成：

1. **构建通过** — `npm run build`。这一步能抓到所有语法错误、失效 import、CSS 变量拼写错误。
2. **浏览器实测** — 通过 Playwright MCP 打开 `http://localhost:5173/`，执行**带具体断言的 evaluate**（例如断言全页无圆角、无投影、某组件确实渲染）。不是"看一眼"就完事。
3. **残留计数** — 一条 grep 命令量化未迁移的 MD3 引用数，每个任务后必须下降：

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend" && grep -rn "md3-\|Md3\|--md-" src --include=*.vue --include=*.css --include=*.js | wc -l
```

**基线的取法**：**不要相信本文里任何写死的绝对数字。** 动手前工作区有大量未提交改动，写 plan 时的计数与执行时的计数会不一致（写 plan 时实测为 1307，更早一次为 318——工作区一直在动）。

所以：**任务 1 的第 0 步就是先跑一次上面的命令，把输出记下来，作为基线。** 之后每个任务只比较**相对变化**（本任务该降多少），最后**任务 13 必须归零**。归零这一条是绝对的，不受基线漂移影响。

---

## 关于设计文档的四处偏离（请评审时确认）

实施时发现文档有 4 处可以更省、更不容易坏，我建议调整，理由如下：

1. **取消 `ed-components.css` 全局样式表。** 文档写它取代 `md3-components.css`。但现状里 `SettingsDialog`、`WelcomeDialog`、`PosterPreview`、`ActivityModal`、`CalendarRangePicker` **5 个文件各自重写了一遍公共组件样式**——根因就是"全局类名 + 局部覆盖"这个模式。新方案改为**每个 `Ed*` 组件的样式写在它自己的 `<style scoped>` 里**，从结构上让"重新实现一遍"变得不可能。`global.css` 只保留两类东西：跨组件复用的原子类（分隔线、等宽元信息、标签），以及下面第 4 条说的版式词汇。**净效果是文件更少、且消灭了一类已发生过的 bug。**

2. **`EdSection` 做成组件而不是 `.ed-section` 类。** 文档写 `.ed-section` 类取代卡片。但三个步骤页里每个分区都要重复写"衬线标题 + 可选标签 + 发丝线 + 内容"这四行结构，做成类无法保证一致，做成组件才行。这是"零卡片、层级靠线"这条设计铁律的结构性保证。

3. **`color.js` 收缩后删除 `generateTonalPalette`。** 文档说"缩到约 30 行"，但没说清是否保留该导出。明确：**删除它**，只保留 `deriveAccent(hex)` 与 `applyPalette` / `resetPalette`。理由是色调板算法正是"整个界面跟着节日色重刷"这个待消除行为的来源，留着它迟早有人再用。

4. **跨组件的版式类必须放 `global.css`，不能放各组件的 `<style scoped>`。** 这是第 1 条的例外，也是唯一一处"全局类"。三个步骤页共用一套版面词汇（`.block` / `.block__head` / `.fields` / `.actions` / `.brands` / `.brand*` / `.note`），步骤栏与两个弹窗共用一套标签语言（`.tabline` / `.tabline__item`）。

   为什么不能各自 scoped：Vue 把 scoped 样式编译成 `.block[data-v-hash]`，**hash 是组件自己的**。`Step2Promotions.vue` 里写 `class="block"`，拿不到 `Step1FestivalBrand.vue` 的 `.block[data-v-Step1]`，结果是无样式裸 div。**而这个失败不报错**——`npm run build` 通过、控制台无警告、残留计数也查不出（类名是 `ed-*` 不是 `md3-*`），只有肉眼看页面才发现两屏版式塌了。所以这层词汇按"跨组件"处理，放全局、单一来源。

   与第 2 条的边界：**组件用于有行为或结构约束的东西**（`EdSection` 带编号/标题/标签三件套与发丝线），**全局类用于纯视觉、无行为、可自由组合的词汇**。三者都不需要 `disabled` 态或事件，所以不抽组件。

---

## File Structure

### 新增

| 文件 | 职责 |
|---|---|
| `frontend/src/assets/fonts/*.woff2` | 4 个内嵌字体文件（中文 400/700、拉丁 400/700） |
| `frontend/src/styles/ed-tokens.css` | 全部 `--ed-*` 设计变量。只有变量，没有选择器 |
| `frontend/src/components/common/EdIcon.vue` | 唯一图标来源。`name` 取图标，`currentColor` 上色 |
| `frontend/src/components/common/EdButton.vue` | 按钮。3 变体 × 2 尺寸 |
| `frontend/src/components/common/EdField.vue` | 输入框 / 文本域。标签在上、下划线式 |
| `frontend/src/components/common/EdMark.vue` | 可选标记（取代 chip）。纯文字 + 选中下划线 |
| `frontend/src/components/common/EdDialog.vue` | 弹窗外壳。遮罩 + 直角框 + 衬线标题 + footer 插槽 |
| `frontend/src/components/common/EdSection.vue` | 版面分区。衬线标题 + 可选标签 + 发丝线（**取代卡片**） |
| `frontend/src/components/common/StepTabs.vue` | 横向文字步骤标签（取代 `StepNav.vue`） |
| `frontend/src/components/common/MarginNotes.vue` | 右侧页边注，等宽小字（取代 `InfoPanel.vue`） |

### 删除（任务 13 统一执行）

```
frontend/src/styles/md3-tokens.css
frontend/src/styles/md3-components.css
frontend/src/components/common/Md3Button.vue
frontend/src/components/common/Md3Card.vue
frontend/src/components/common/Md3Chip.vue
frontend/src/components/common/Md3TextField.vue
frontend/src/components/common/StepNav.vue
frontend/src/components/common/InfoPanel.vue
frontend/src/components/PosterWizard.vue     ← 外壳铺平后不再需要，逻辑并入 App.vue
```

### 修改

`index.html`、`main.js`、`styles/global.css`、`App.vue`、`utils/color.js`、`components/PosterPreview.vue`、`components/EnhancePanel.vue`、`components/steps/Step1FestivalBrand.vue`、`components/steps/Step2Promotions.vue`、`components/steps/Step3Activities.vue`、`components/common/ActivityModal.vue`、`components/common/SettingsDialog.vue`、`components/common/WelcomeDialog.vue`、`components/common/CalendarRangePicker.vue`、`components/common/DiscountTypeSelect.vue`、`components/common/GenerateProgressDialog.vue`

---

## 动手前的前置检查（需人工确认，不属任何任务）

**当前状态（已实测，2026-09-24）：**

- 所在分支是 **`master`**（HEAD `d7cff76`）。**本次改造不能直接在 master 上做。**
- 工作区有大量未提交内容：`backend/` 与 `frontend/` 都被改过，`backend/src/services/mimo.js` 已删除。
- **关键**：整个 MD3 组件层从来**没有进过 git**，全是未跟踪文件——
  `frontend/src/styles/`（含 `md3-tokens.css`、`md3-components.css`、`global.css`）、
  `frontend/src/utils/`、`frontend/src/composables/`、`frontend/src/data/`、
  `Md3Button/Md3Card/Md3Chip/Md3TextField.vue`、`SettingsDialog.vue`、`WelcomeDialog.vue`、
  `Step2Promotions.vue`、`Step3Activities.vue`、`EnhancePanel.vue`、`GenerateProgressDialog.vue`。
  这些是本次改造的**起点材料**，且**一旦删除无法用 git 找回**。

**必须先做（不属任何任务，由人确认后执行）：**

- [ ] **先把现有工作提交到一个 commit**（保留改造前的完整快照，让 Task 5/13 的删除可回滚）。
- [ ] **建工作分支**：`git checkout -b editorial-ui`，本次改造全程在此分支。

> 说明：不强制使用 git worktree。因为验证需要长期跑着的后端（依赖 MySQL 与本机 `.env`），worktree 会多一份环境；单分支足够。
>
> **不要用 stash 代替提交**：`src/styles/`、`utils/`、`composables/`、`data/` 都是未跟踪文件，`git stash` 默认**不包含未跟踪文件**，stash 之后应用直接跑不起来。

---

## Task 1: 字体与设计变量基础层

**Files:**
- Create: `frontend/src/assets/fonts/noto-serif-sc-chinese-simplified-400-normal.woff2`
- Create: `frontend/src/assets/fonts/noto-serif-sc-chinese-simplified-700-normal.woff2`
- Create: `frontend/src/assets/fonts/noto-serif-sc-latin-400-normal.woff2`
- Create: `frontend/src/assets/fonts/noto-serif-sc-latin-700-normal.woff2`
- Create: `frontend/src/styles/ed-tokens.css`
- Modify: `frontend/src/styles/global.css`（整体重写）
- Modify: `frontend/src/main.js`（增加一行 import）
- Modify: `frontend/index.html`（去掉外链字体）

**Interfaces:**
- Consumes: 无（这是第一个任务）
- Produces: 全部 `--ed-*` CSS 变量（第 2 节列出的每一个）；`global.css` 中的原子类 `.ed-rule` `.ed-meta` `.ed-label` `.ed-tag` `.ed-num`；字体族名 `'Noto Serif SC'`。后续所有任务依赖这些名字，必须逐字一致。

- [ ] **Step 0: 测出并记下残留基线**

在动任何文件之前先跑一次（本任务后面以及后续每个任务都要跟这个数比）：

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend" && grep -rn "md3-\|Md3\|--md-" src --include=*.vue --include=*.css --include=*.js | wc -l
```

**把这个数字写下来。** 本 plan 不写死绝对数（理由见「验证方式说明」）。下面是各任务该发生的**相对变化**：

| 任务 | 计数变化 | 原因 |
|---|---|---|
| 1 | **−9** | 重写 `global.css`，删掉其 9 行 md3 引用 |
| 2–4 | 0 | 只新增 `Ed*` 组件，不碰旧组件 |
| 5 | 大幅下降 | 删 3 个文件 + `App.vue` 铺平 |
| 6–12 | 每步下降 | 逐屏迁移 |
| 13 | **归零** | 删掉最后 9 个 md3 文件 |

- [ ] **Step 1: 建立字体目录并下载 4 个字体文件**

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend" && mkdir -p src/assets/fonts && cd src/assets/fonts && \
B=https://cdn.jsdelivr.net/npm/@fontsource/noto-serif-sc@5.2.5/files && \
curl -sSL -o noto-serif-sc-chinese-simplified-400-normal.woff2 "$B/noto-serif-sc-chinese-simplified-400-normal.woff2" && \
curl -sSL -o noto-serif-sc-chinese-simplified-700-normal.woff2 "$B/noto-serif-sc-chinese-simplified-700-normal.woff2" && \
curl -sSL -o noto-serif-sc-latin-400-normal.woff2          "$B/noto-serif-sc-latin-400-normal.woff2" && \
curl -sSL -o noto-serif-sc-latin-700-normal.woff2          "$B/noto-serif-sc-latin-700-normal.woff2" && \
ls -l
```

- [ ] **Step 2: 校验下载结果**

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend/src/assets/fonts" && \
for f in *.woff2; do printf "%s " "$f"; head -c 4 "$f" | xxd -p; done
```

预期：4 个文件的头 4 字节均为 `774f4632`（即 ASCII `wOF2`）。中文两个约 1.4–1.5 MB，拉丁两个约 18 KB。**若某个文件是 HTML（头字节为 `3c68746d` = `<htm`）说明下载到了错误页，重下。**

- [ ] **Step 3: 创建 `frontend/src/styles/ed-tokens.css`**

```css
/* ========================================
   Editorial — 设计变量
   只有变量，没有选择器。
   ======================================== */

:root {
  /* ---- 纸与墨 ---- */
  --ed-paper: #FBFAF7;
  --ed-paper-deep: #F4F1EA;
  --ed-ink: #16150F;
  --ed-ink-soft: #4A4740;
  --ed-ink-faint: #8C877C;

  /* ---- 线（取代圆角边框与投影） ---- */
  --ed-rule: #DAD5C9;
  --ed-rule-strong: #16150F;

  /* ---- 状态 ---- */
  --ed-danger: #9B2C1F;
  --ed-danger-tint: #F7E9E6;
  --ed-ok: #2F6B45;

  /* ---- 点睛色（默认值；由 color.js 按节日主色覆写） ---- */
  --ed-accent: #3B74F1;
  --ed-accent-deep: #2A55B8;
  --ed-accent-tint: #EAF0FE;

  /* ---- 字体 ---- */
  --ed-serif: 'Noto Serif SC', 'Songti SC', 'SimSun', Georgia, serif;
  --ed-sans: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI',
             'Microsoft YaHei', 'PingFang SC', sans-serif;
  --ed-mono: ui-monospace, 'SF Mono', 'Cascadia Code', Consolas, monospace;

  /* ---- 字号 ---- */
  --ed-display: 44px;
  --ed-title: 28px;
  --ed-subhead: 17px;
  --ed-body: 15px;
  --ed-label: 12px;
  --ed-meta: 11px;

  /* ---- 间距 ---- */
  --ed-space-1: 4px;
  --ed-space-2: 8px;
  --ed-space-3: 12px;
  --ed-space-4: 20px;
  --ed-space-5: 32px;
  --ed-space-6: 56px;
  --ed-space-7: 88px;

  /* ---- 形状与动效 ---- */
  --ed-radius: 0;
  --ed-ease: cubic-bezier(.2, .6, .2, 1);
  --ed-fast: 120ms;
  --ed-base: 200ms;
}
```

- [ ] **Step 4: 重写 `frontend/src/styles/global.css`**

整体替换为以下内容（旧文件里的 Google Fonts `@import`、蓝色选区色、圆角滚动条全部删除）：

```css
/* ========================================
   Editorial — 全局重置 / 字体 / 原子类
   ======================================== */

/* ---- 内嵌衬线字体（离线可用，不引用外网） ---- */
@font-face {
  font-family: 'Noto Serif SC';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('../assets/fonts/noto-serif-sc-latin-400-normal.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+2070-209F,
                 U+20A0-20CF, U+2100-214F, U+2190-21FF, U+2200-22FF, U+FEFF, U+FFFD;
}
@font-face {
  font-family: 'Noto Serif SC';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('../assets/fonts/noto-serif-sc-chinese-simplified-400-normal.woff2') format('woff2');
  unicode-range: U+2E80-2EFF, U+3000-303F, U+31C0-31EF, U+3200-33FF, U+3400-4DBF,
                 U+4E00-9FFF, U+F900-FAFF, U+FE30-FE4F, U+FF00-FFEF;
}
@font-face {
  font-family: 'Noto Serif SC';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('../assets/fonts/noto-serif-sc-latin-700-normal.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+2070-209F,
                 U+20A0-20CF, U+2100-214F, U+2190-21FF, U+2200-22FF, U+FEFF, U+FFFD;
}
@font-face {
  font-family: 'Noto Serif SC';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('../assets/fonts/noto-serif-sc-chinese-simplified-700-normal.woff2') format('woff2');
  unicode-range: U+2E80-2EFF, U+3000-303F, U+31C0-31EF, U+3200-33FF, U+3400-4DBF,
                 U+4E00-9FFF, U+F900-FAFF, U+FE30-FE4F, U+FF00-FFEF;
}

*,
*::before,
*::after { box-sizing: border-box; margin: 0; padding: 0; }

html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-size: 16px;
}

body {
  font-family: var(--ed-sans);
  font-size: var(--ed-body);
  line-height: 1.75;
  background: var(--ed-paper);
  color: var(--ed-ink);
  min-height: 100vh;
}

input, button, textarea, select { font-family: inherit; font-size: inherit; }

/* 键盘可达性：全局焦点环（旧版完全缺失） */
:focus-visible {
  outline: 2px solid var(--ed-accent);
  outline-offset: 2px;
}

/* 滚动条：细线，无轨道背景 */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--ed-rule); }
::-webkit-scrollbar-thumb:hover { background: var(--ed-ink-faint); }

::selection { background: var(--ed-accent-tint); color: var(--ed-ink); }

a { color: var(--ed-accent); text-decoration: none; }
a:hover { text-decoration: underline; }

/* ---- 原子类（跨组件复用的最小单位） ---- */
.ed-rule {
  border: 0;
  border-top: 1px solid var(--ed-rule);
  width: 100%;
}
.ed-rule--strong { border-top: 1px solid var(--ed-rule-strong); }

.ed-meta {
  font-family: var(--ed-mono);
  font-size: var(--ed-meta);
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--ed-ink-faint);
  line-height: 1.5;
}

.ed-label {
  font-family: var(--ed-mono);
  font-size: var(--ed-label);
  letter-spacing: .06em;
  color: var(--ed-ink-soft);
  line-height: 1.4;
}

.ed-tag {
  font-family: var(--ed-mono);
  font-size: var(--ed-meta);
  letter-spacing: .08em;
  color: var(--ed-accent);
}

.ed-num {
  font-family: var(--ed-mono);
  font-variant-numeric: tabular-nums;
}

/* ========================================
   跨组件的版式词汇
   ----------------------------------------------------------------
   这一层必须放在 global.css，不能放在各组件的 <style scoped> 里。
   Vue 的 scoped 样式会编译成 `.block[data-v-hash]`，而 hash 是各组件
   自己的——Step2Promotions.vue 里写的 `class="block"` 拿不到
   Step1FestivalBrand.vue 的 `.block[data-v-Step1]`，会静默变成无样式。
   而且 `npm run build` 不会报错，残留计数也查不出来。
   三个步骤页 + 两个弹窗共用这层词汇，所以它只有一个来源。
   ======================================== */

/* 版面分区内的子区块 */
.block { margin-bottom: var(--ed-space-6); }
.block:last-of-type { margin-bottom: var(--ed-space-5); }

.block__head {
  display: flex;
  align-items: baseline;
  gap: var(--ed-space-3);
  padding-bottom: var(--ed-space-3);
  margin-bottom: var(--ed-space-4);
  border-bottom: 1px solid var(--ed-rule);
}
.block__title { flex: 1; }
.block__opt { text-transform: none; }

/* 字段堆叠 */
.fields { display: flex; flex-direction: column; gap: var(--ed-space-4); }

/* 底部操作区 */
.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--ed-space-4);
  padding-top: var(--ed-space-4);
}
.actions__hint { text-transform: none; }

/* 下划线文本行：品牌（Step1）与商家模板（Step3）共用 */
.brands {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: var(--ed-space-5);
}
.brand {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--ed-space-3) 0;
  border: 0;
  border-bottom: 1px solid var(--ed-rule);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: border-color var(--ed-fast) var(--ed-ease);
}
.brand:hover { border-bottom-color: var(--ed-ink-faint); }
.brand.is-selected { border-bottom-color: var(--ed-accent); }
.brand__name { font-family: var(--ed-serif); font-size: 16px; font-weight: 700; color: var(--ed-ink); }
.brand__desc { text-transform: none; letter-spacing: .02em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.brand__tick { position: absolute; top: var(--ed-space-3); right: 0; color: var(--ed-accent); }

@media (max-width: 900px) {
  .brands { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 560px) {
  .brands { grid-template-columns: 1fr; }
}

/* 错误 / 提示条：Step2 与 Step3 共用 */
.note {
  display: flex;
  align-items: flex-start;
  gap: var(--ed-space-3);
  padding: var(--ed-space-3) var(--ed-space-4);
  border-left: 2px solid var(--ed-danger);
  background: var(--ed-danger-tint);
  font-size: 13px;
  color: var(--ed-ink);
}

/* 标签式切换：步骤栏（StepTabs）/ 活动弹窗内枚举 / 设置标签页 共用同一套下划线语言 */
.tabline {
  display: flex;
  align-items: stretch;
  gap: var(--ed-space-6);
  border-bottom: 1px solid var(--ed-rule);
}
.tabline__item {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: var(--ed-space-2);
  padding: var(--ed-space-3) 0;
  border: 0;
  background: transparent;
  color: var(--ed-ink-faint);
  font-family: var(--ed-sans);
  font-size: var(--ed-body);
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--ed-fast) var(--ed-ease);
}
.tabline__item:hover:not(:disabled) { color: var(--ed-ink); }
.tabline__item.is-active { color: var(--ed-ink); cursor: default; }
.tabline__item:disabled { cursor: default; }
.tabline__item::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: var(--ed-ink);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--ed-base) var(--ed-ease);
}
.tabline__item.is-active::after { transform: scaleX(1); }
```

- [ ] **Step 5: 修改 `frontend/src/main.js`**

在现有 md3 样式 import 之后**追加一行**（并行共存，先不删旧的）：

```js
import './styles/md3-tokens.css'
import './styles/global.css'
import './styles/md3-components.css'
import './styles/ed-tokens.css'   // ← 新增
```

- [ ] **Step 6: 修改 `frontend/index.html`**

删除这两行外链（`Google Sans` 公开渠道拿不到，且 Google Fonts 国内不可达）：

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
```

- [ ] **Step 7: 构建验证**

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend" && npm run build 2>&1 | tail -15
```

预期：构建成功。`dist/assets/` 下应出现 4 个 woff2（Vite 会加哈希前缀）。**若报字体文件 404 或解析失败，检查 `global.css` 里的 `../assets/fonts/` 相对路径层级——`global.css` 在 `src/styles/`，往上一级到 `src/`，再进 `assets/fonts/`，路径正确。**

- [ ] **Step 8: 浏览器验证字体真的加载了**

先确认 dev server 在 5173（见「环境事实」）。然后在 Playwright 中执行：

```js
async () => {
  await document.fonts.ready;
  const serifLoaded = document.fonts.check('700 44px "Noto Serif SC"', '节日与品牌');
  const serifCJK = document.fonts.check('400 15px "Noto Serif SC"', '珠宝');
  return { serifLoaded, serifCJK, families: [...document.fonts].map(f => f.family + ':' + f.status) };
}
```

预期：`serifLoaded` 与 `serifCJK` 均为 `true`，且 `families` 中出现 4 条 `Noto Serif SC:loaded`。

- [ ] **Step 9: 验证旧界面未被打坏，且残留计数只降 9**

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend" && grep -rn "md3-\|Md3\|--md-" src --include=*.vue --include=*.css --include=*.js | wc -l
```

预期：**正好比 Step 0 记下的基线少 9**。本任务不迁移任何组件，唯一的减少来自 `global.css` 被整体重写——它原来的 9 行 md3 引用被删掉了（已实测确认旧 `global.css` 含 9 行匹配）。**若减少量不是 9，说明 `global.css` 没被完整替换，回去检查。**

浏览器侧：页面上仍能看到步骤栏与节日标签，且背景色已从旧的蓝白 `#f9f9ff` 变为暖白 `#FBFAF7`。用这条断言确认：

```js
async () => getComputedStyle(document.body).backgroundColor
```

预期：`rgb(251, 250, 247)`。

- [ ] **Step 10: 提交**

```bash
cd "C:/Users/LENOVO/Desktop/haibao" && git add frontend/src/assets/fonts frontend/src/styles/ed-tokens.css frontend/src/styles/global.css frontend/src/main.js frontend/index.html && git commit -m "feat(ui): 内嵌思源宋体并引入 --ed-* 设计变量

去掉拿不到的 Google Sans 外链，改用项目内自带的 Noto Serif SC 子集，
离线可用。新增 ed-tokens.css 与全局原子类，旧 md3 样式暂时并行保留。"
```

---

## Task 2: EdIcon 统一图标组件

**Files:**
- Create: `frontend/src/components/common/EdIcon.vue`

**Interfaces:**
- Consumes: `--ed-*` 变量（Task 1）
- Produces: `<EdIcon name="..." :size="16" />`。`name` 取值必须是下列 22 个之一：`close` `check` `arrow-right` `arrow-left` `chevron-down` `chevron-left` `chevron-right` `edit` `trash` `plus` `search` `calendar` `upload` `download` `eye` `eye-off` `gear` `help` `warning` `sparkle` `image` `zoom-in`。后续所有任务只允许用这些名字。

**背景：** 现状图标分两套且无组件——6 个文件手写 SVG，4 个文件用 unicode 字符当图标（`Step2Promotions` 的 `⚠`、`Step3Activities` 的 `✎ 🗑 ✨`、`Md3Chip` 与 `Md3TextField` 的 `✓ ✕`）。unicode 图标渲染依赖系统字体、粗细不一，是廉价感来源之一。

- [ ] **Step 1: 创建 `frontend/src/components/common/EdIcon.vue`**

```vue
<script setup>
const props = defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 16 },
  strokeWidth: { type: Number, default: 1.5 },
})

// 全部图标为 24×24 描边路径，stroke 用 currentColor，由父级控制颜色
const PATHS = {
  'close':          ['M6 18L18 6M6 6l12 12'],
  'check':          ['M20 6L9 17l-5-5'],
  'arrow-right':    ['M5 12h14M13 6l6 6-6 6'],
  'arrow-left':     ['M19 12H5M11 18l-6-6 6-6'],
  'chevron-down':   ['M6 9l6 6 6-6'],
  'chevron-left':   ['M15 18l-6-6 6-6'],
  'chevron-right':  ['M9 18l6-6-6-6'],
  'edit':           ['M11 4H4v16h16v-7', 'M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z'],
  'trash':          ['M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6'],
  'plus':           ['M12 5v14M5 12h14'],
  'search':         ['M21 21l-5.2-5.2', 'M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z'],
  'calendar':       ['M8 2v4M16 2v4M3 10h18M5 4h14v18H5z'],
  'upload':         ['M12 16V4M7 9l5-5 5 5M4 20h16'],
  'download':       ['M12 4v12M7 11l5 5 5-5M4 20h16'],
  'eye':            ['M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z', 'M12 15a3 3 0 100-6 3 3 0 000 6z'],
  'eye-off':        ['M3 3l18 18', 'M10.6 10.6a3 3 0 004.2 4.2', 'M9.9 5.2A10 10 0 0112 5c6 0 10 7 10 7a17.17 17.17 0 01-3.3 4.3', 'M6.2 6.2A17.17 17.17 0 002 12s4 7 10 7a10 10 0 003.8-.8'],
  'gear':           ['M12 15a3 3 0 100-6 3 3 0 000 6z', 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z'],
  'help':           ['M12 22a10 10 0 100-20 10 10 0 000 20z', 'M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3', 'M12 17h.01'],
  'warning':        ['M12 3l9.5 17H2.5L12 3z', 'M12 9v5', 'M12 17h.01'],
  'sparkle':        ['M12 3l1.9 5.6L19.5 10l-5.6 1.4L12 17.5l-1.9-6.1L4.5 10l5.6-1.4L12 3z'],
  'image':          ['M3 5h18v14H3z', 'M8.5 11a1.75 1.75 0 100-3.5 1.75 1.75 0 000 3.5z', 'M21 16l-5-5-9 8'],
  'zoom-in':        ['M21 21l-5.2-5.2', 'M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z', 'M10.5 7.5v6M7.5 10.5h6'],
}

const stroked = () => PATHS[props.name] || []
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    class="ed-icon"
  >
    <path v-for="(d, i) in stroked()" :key="i" :d="d" />
  </svg>
</template>

<style scoped>
.ed-icon { display: block; flex-shrink: 0; }
</style>
```

- [ ] **Step 2: 加一条图标名存在性自检**

在源码里出现的每个 `<EdIcon name="X">`，`X` 都必须在 `PATHS` 里，否则图标会静默渲染成空白（`stroked()` 返回空数组）。这条检查在任务 13 收尾时会用到，但**现在就要能跑**。创建 `frontend/scripts/check-icons.mjs`：

```js
// 校验所有 EdIcon 用法引用的图标名都在 EdIcon.vue 的 PATHS 里存在。
// 用法: node scripts/check-icons.mjs   （退出码非 0 表示有未定义图标）
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.vue') ? [p] : []
  })
}

const iconFile = readFileSync(join(SRC, 'components/common/EdIcon.vue'), 'utf8')
const defined = new Set([...iconFile.matchAll(/^\s*'([a-z-]+)':\s*\[/gm)].map((m) => m[1]))

const used = new Map()
for (const file of walk(SRC)) {
  const text = readFileSync(file, 'utf8')
  for (const m of text.matchAll(/<EdIcon[^>]*\bname="([^"]+)"/g)) used.set(m[1], file)
}

const missing = [...used].filter(([name]) => !defined.has(name))
console.log(`EdIcon: 定义 ${defined.size} 个，使用 ${used.size} 个`)
if (missing.length) {
  for (const [name, file] of missing) console.error(`  ✗ 未定义图标 "${name}" —— ${file}`)
  process.exit(1)
}
console.log('  ✓ 全部图标名有效')
```

- [ ] **Step 3: 运行自检，确认现在通过且为 0 使用**

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend" && node scripts/check-icons.mjs
```

预期输出：`EdIcon: 定义 22 个，使用 0 个` 然后 `✓ 全部图标名有效`，退出码 0。

再故意验一次检查确实有效（把 `name="close"` 试改成不存在的名字应报错）——本步骤可不做，但若想确认检查不是假阳性，临时在任意 vue 里加 `<EdIcon name="bogus" />` 跑一次应报 `✗ 未定义图标`，然后删掉。

- [ ] **Step 4: 构建验证**

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend" && npm run build 2>&1 | tail -8
```

预期：构建成功。

- [ ] **Step 5: 提交**

```bash
cd "C:/Users/LENOVO/Desktop/haibao" && git add frontend/src/components/common/EdIcon.vue frontend/scripts/check-icons.mjs && git commit -m "feat(ui): 新增 EdIcon 统一图标组件与图标名自检脚本

替掉散落的 unicode 字符图标与手写 SVG，22 个 stroke-1.5 描边图标。"
```

---

## Task 3: 表单三件套 EdButton / EdField / EdMark

**Files:**
- Create: `frontend/src/components/common/EdButton.vue`
- Create: `frontend/src/components/common/EdField.vue`
- Create: `frontend/src/components/common/EdMark.vue`

**Interfaces:**
- Consumes: `EdIcon`（Task 2）；`--ed-*` 变量（Task 1）
- Produces:
  - `<EdButton variant="solid|outline|text" size="md|sm" :loading :disabled :block type>` — 默认插槽放文字；**图标也放默认插槽**（`.ed-btn` 的 `inline-flex` + `gap: var(--ed-space-2)` 已处理间距）。**没有 `#icon` 具名插槽**——写了会静默渲染不出任何东西
  - `<EdField v-model="s" label="..." placeholder="..." type="text|password|textarea" :rows :error :helper :required :disabled />`
  - `<EdMark :selected :disabled @click>` — 默认插槽放文字

- [ ] **Step 1: 创建 `EdButton.vue`**

```vue
<script setup>
defineProps({
  variant: { type: String, default: 'outline' }, // solid | outline | text
  size: { type: String, default: 'md' },         // md | sm
  type: { type: String, default: 'button' },
  loading: Boolean,
  disabled: Boolean,
  block: Boolean,
})
</script>

<template>
  <button
    :type="type"
    :class="['ed-btn', `ed-btn--${variant}`, size === 'sm' && 'ed-btn--sm', block && 'ed-btn--block']"
    :disabled="disabled || loading"
  >
    <span v-if="loading" class="ed-btn__spin" aria-hidden="true"></span>
    <slot />
  </button>
</template>

<style scoped>
.ed-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ed-space-2);
  height: 40px;
  padding: 0 var(--ed-space-4);
  border: 1px solid var(--ed-ink);
  border-radius: var(--ed-radius);
  background: transparent;
  color: var(--ed-ink);
  font-family: var(--ed-sans);
  font-size: 14px;
  font-weight: 400;
  letter-spacing: .02em;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  transition: background var(--ed-fast) var(--ed-ease),
              color var(--ed-fast) var(--ed-ease),
              border-color var(--ed-fast) var(--ed-ease);
}
.ed-btn--sm { height: 30px; padding: 0 var(--ed-space-3); font-size: 13px; }
.ed-btn--block { width: 100%; }

.ed-btn--solid { background: var(--ed-ink); color: var(--ed-paper); }
.ed-btn--solid:hover:not(:disabled) { background: var(--ed-ink-soft); border-color: var(--ed-ink-soft); }

.ed-btn--outline:hover:not(:disabled) { background: var(--ed-paper-deep); }
.ed-btn--outline:active:not(:disabled) { background: var(--ed-rule); }

.ed-btn--text { border-color: transparent; padding: 0 var(--ed-space-1); }
.ed-btn--text:hover:not(:disabled) { text-decoration: underline; text-underline-offset: 4px; }

.ed-btn:disabled { opacity: .35; cursor: not-allowed; }

.ed-btn__spin {
  width: 12px;
  height: 12px;
  border: 1.5px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: ed-btn-spin .7s linear infinite;
}
@keyframes ed-btn-spin { to { transform: rotate(360deg); } }
</style>
```

- [ ] **Step 2: 创建 `EdField.vue`**

要点：标签在输入框**上方**（旧版是浮动的 Material filled 样式），输入框只剩底部 1px 线。

```vue
<script setup>
import EdIcon from './EdIcon.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  type: { type: String, default: 'text' },       // text | password | textarea
  rows: { type: Number, default: 4 },
  error: { type: String, default: '' },
  helper: { type: String, default: '' },
  required: Boolean,
  disabled: Boolean,
})
const emit = defineEmits(['update:modelValue'])

const onInput = (e) => emit('update:modelValue', e.target.value)
</script>

<template>
  <label class="ed-field" :class="{ 'is-error': error, 'is-disabled': disabled }">
    <span v-if="label || required" class="ed-field__head">
      <span class="ed-field__label ed-label">{{ label }}</span>
      <span v-if="required" class="ed-field__req ed-tag">必选</span>
    </span>

    <textarea
      v-if="type === 'textarea'"
      class="ed-field__area"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      :disabled="disabled"
      @input="onInput"
    />
    <input
      v-else
      class="ed-field__input"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="onInput"
    />

    <span v-if="error" class="ed-field__msg ed-field__msg--error">
      <EdIcon name="warning" :size="13" />
      {{ error }}
    </span>
    <span v-else-if="helper" class="ed-field__msg ed-meta">{{ helper }}</span>
  </label>
</template>

<style scoped>
.ed-field { display: block; width: 100%; }

.ed-field__head {
  display: flex;
  align-items: baseline;
  gap: var(--ed-space-2);
  margin-bottom: var(--ed-space-2);
}
.ed-field__req { text-transform: none; }

.ed-field__input,
.ed-field__area {
  display: block;
  width: 100%;
  padding: var(--ed-space-2) 0;
  border: 0;
  border-bottom: 1px solid var(--ed-rule);
  border-radius: var(--ed-radius);
  background: transparent;
  color: var(--ed-ink);
  font-family: var(--ed-sans);
  font-size: var(--ed-body);
  line-height: 1.6;
  transition: border-color var(--ed-fast) var(--ed-ease);
}
.ed-field__area { resize: vertical; min-height: 96px; }

.ed-field__input::placeholder,
.ed-field__area::placeholder { color: var(--ed-ink-faint); }

/* 只抹掉鼠标点击产生的默认描边。键盘 Tab 聚焦时必须保留全局 :focus-visible 焦点环——
   注意不能在基础规则里写 outline:none：scoped 样式会加 [data-v-xxx] 属性选择器，
   特异性 (0,2,0) 高于全局 :focus-visible 的 (0,1,0)，会把焦点环整个吃掉。 */
.ed-field__input:focus:not(:focus-visible),
.ed-field__area:focus:not(:focus-visible) { outline: none; }

.ed-field__input:focus,
.ed-field__area:focus { border-bottom-color: var(--ed-accent); }

.ed-field.is-error .ed-field__input,
.ed-field.is-error .ed-field__area { border-bottom-color: var(--ed-danger); }

.ed-field.is-disabled { opacity: .45; }

.ed-field__msg {
  display: flex;
  align-items: center;
  gap: var(--ed-space-1);
  margin-top: var(--ed-space-2);
}
.ed-field__msg--error {
  font-size: var(--ed-label);
  color: var(--ed-danger);
}
</style>
```

- [ ] **Step 3: 创建 `EdMark.vue`**

取代药丸 chip：纯文字，选中时下方一条 2px 强调色线。

```vue
<script setup>
defineProps({
  selected: Boolean,
  disabled: Boolean,
})
</script>

<template>
  <button
    type="button"
    :class="['ed-mark', { 'is-selected': selected }]"
    :disabled="disabled"
    :aria-pressed="selected"
  >
    <slot />
  </button>
</template>

<style scoped>
.ed-mark {
  position: relative;
  padding: var(--ed-space-2) 1px var(--ed-space-2);
  border: 0;
  border-radius: var(--ed-radius);
  background: transparent;
  color: var(--ed-ink-soft);
  font-family: var(--ed-sans);
  font-size: var(--ed-body);
  line-height: 1.3;
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--ed-fast) var(--ed-ease);
}
.ed-mark::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: var(--ed-accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--ed-base) var(--ed-ease);
}
.ed-mark:hover:not(:disabled) { color: var(--ed-ink); }
.ed-mark.is-selected { color: var(--ed-ink); }
.ed-mark.is-selected::after { transform: scaleX(1); }
.ed-mark:disabled { opacity: .35; cursor: not-allowed; }
</style>
```

- [ ] **Step 4: 构建验证**

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend" && npm run build 2>&1 | tail -8 && node scripts/check-icons.mjs
```

预期：构建成功；`使用 1 个`（`EdField` 用了 `warning`），校验通过。

- [ ] **Step 5: 提交**

```bash
cd "C:/Users/LENOVO/Desktop/haibao" && git add frontend/src/components/common/EdButton.vue frontend/src/components/common/EdField.vue frontend/src/components/common/EdMark.vue && git commit -m "feat(ui): 新增 EdButton / EdField / EdMark 表单基础组件

直角、下划线输入、文字标记，全部零圆角零投影。"
```

---

## Task 4: 版面容件 EdDialog / EdSection

**Files:**
- Create: `frontend/src/components/common/EdDialog.vue`
- Create: `frontend/src/components/common/EdSection.vue`

**Interfaces:**
- Consumes: `EdIcon`（Task 2）；`--ed-*` 变量（Task 1）
- Produces:
  - `<EdDialog :title :width :close-on-overlay @close>` — 默认插槽为内容，`#footer` 插槽放操作按钮；内部 `Teleport to="body"`
  - `<EdSection :num :title :desc :tag>` — 默认插槽为内容。`num` 是标题**上方**的等宽编号（如 `"01"`，块级独占一行），`tag` 是标题右侧（右上角对齐）的标记文字（如 `"必选"`）

- [ ] **Step 1: 创建 `EdDialog.vue`**

取代当前 5 个弹窗各自重写的遮罩层（`SettingsDialog`、`WelcomeDialog`、`ActivityModal`、`EnhancePanel`、`GenerateProgressDialog`）。

```vue
<script setup>
import EdIcon from './EdIcon.vue'

const props = defineProps({
  title: { type: String, default: '' },
  width: { type: [Number, String], default: 560 },
  closeOnOverlay: { type: Boolean, default: true },
  hideClose: Boolean,
})
const emit = defineEmits(['close'])

const onOverlay = () => { if (props.closeOnOverlay) emit('close') }
</script>

<template>
  <Teleport to="body">
    <div class="ed-overlay" @mousedown.self="onOverlay">
      <div
        class="ed-dialog"
        role="dialog"
        aria-modal="true"
        :style="{ width: typeof width === 'number' ? width + 'px' : width }"
      >
        <header class="ed-dialog__head">
          <h2 class="ed-dialog__title">{{ title }}</h2>
          <button
            v-if="!hideClose"
            type="button"
            class="ed-dialog__close"
            aria-label="关闭"
            @click="emit('close')"
          >
            <EdIcon name="close" :size="18" />
          </button>
        </header>
        <hr class="ed-rule" />

        <div class="ed-dialog__body">
          <slot />
        </div>

        <div v-if="$slots.footer" class="ed-dialog__foot">
          <hr class="ed-rule" />
          <div class="ed-dialog__actions">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.ed-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--ed-space-4);
  background: rgba(22, 21, 15, .5);
  animation: ed-fade var(--ed-base) var(--ed-ease);
}

.ed-dialog {
  display: flex;
  flex-direction: column;
  max-width: 100%;
  max-height: 88vh;
  border: 1px solid var(--ed-ink);
  border-radius: var(--ed-radius);
  background: var(--ed-paper);
  animation: ed-rise var(--ed-base) var(--ed-ease);
}

.ed-dialog__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ed-space-4);
  padding: var(--ed-space-4) var(--ed-space-5) var(--ed-space-3);
}

.ed-dialog__title {
  font-family: var(--ed-serif);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.35;
  color: var(--ed-ink);
}

.ed-dialog__close {
  display: flex;
  padding: var(--ed-space-1);
  border: 0;
  background: transparent;
  color: var(--ed-ink-faint);
  cursor: pointer;
  transition: color var(--ed-fast) var(--ed-ease);
}
.ed-dialog__close:hover { color: var(--ed-ink); }

.ed-dialog__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--ed-space-5);
}

.ed-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--ed-space-3);
  padding: var(--ed-space-4) var(--ed-space-5);
}

@keyframes ed-fade { from { opacity: 0; } }
@keyframes ed-rise { from { opacity: 0; transform: translateY(10px); } }
</style>
```

- [ ] **Step 2: 创建 `EdSection.vue`**

这是"零卡片"这条铁律的结构性保证：原来每个概念装一个圆角 Card，现在只有"衬线标题 + 标签 + 发丝线 + 内容"。

```vue
<script setup>
defineProps({
  num: { type: String, default: '' },
  title: { type: String, default: '' },
  desc: { type: String, default: '' },
  tag: { type: String, default: '' },
})
</script>

<template>
  <section class="ed-section">
    <header class="ed-section__head">
      <span v-if="num" class="ed-section__num ed-num">{{ num }}</span>
      <h2 v-if="title" class="ed-section__title">{{ title }}</h2>
      <p v-if="desc" class="ed-section__desc">{{ desc }}</p>
      <span v-if="tag" class="ed-section__tag ed-tag">{{ tag }}</span>
    </header>
    <hr class="ed-rule ed-rule--strong" />
    <div class="ed-section__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.ed-section { display: block; }

.ed-section__head {
  position: relative;
  padding-bottom: var(--ed-space-4);
}

.ed-section__num {
  display: block;
  margin-bottom: var(--ed-space-3);
  font-size: var(--ed-title);
  color: var(--ed-accent);
  letter-spacing: .04em;
}

.ed-section__title {
  font-family: var(--ed-serif);
  font-size: var(--ed-title);
  font-weight: 700;
  line-height: 1.25;
  color: var(--ed-ink);
}

.ed-section__desc {
  margin-top: var(--ed-space-2);
  max-width: 56ch;
  font-size: var(--ed-body);
  color: var(--ed-ink-soft);
}

.ed-section__tag {
  position: absolute;
  top: var(--ed-space-2);
  right: 0;
  padding: var(--ed-space-2) 0;
}

.ed-section__body { padding-top: var(--ed-space-5); }
</style>
```

- [ ] **Step 3: 构建验证**

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend" && npm run build 2>&1 | tail -8 && node scripts/check-icons.mjs
```

预期：构建成功；图标自检通过。

- [ ] **Step 4: 提交**

```bash
cd "C:/Users/LENOVO/Desktop/haibao" && git add frontend/src/components/common/EdDialog.vue frontend/src/components/common/EdSection.vue && git commit -m "feat(ui): 新增 EdDialog 弹窗外壳与 EdSection 版面分区

EdSection 取代卡片体系：衬线标题 + 编号 + 发丝线，无边框无投影。"
```

---

## Task 5: 外壳重构（报头 + 横向步骤栏 + 文栏 + 页边注）

这是**布局层改动最大的一个任务**。

**Files:**
- Create: `frontend/src/components/common/StepTabs.vue`
- Create: `frontend/src/components/common/MarginNotes.vue`
- Modify: `frontend/src/App.vue`（重写模板与样式）
- Delete: `frontend/src/components/PosterWizard.vue`
- Delete: `frontend/src/components/common/StepNav.vue`
- Delete: `frontend/src/components/common/InfoPanel.vue`

**Interfaces:**
- Consumes: `EdIcon`（Task 2）、`EdButton`（Task 3）
- Produces: `StepTabs` 的 props 为 `steps: Array<{num:Number, label:String, desc:String}>`、`current: Number`，事件 `step-change(num)`。`MarginNotes` 无 props，直接读 store。App.vue 内部渲染三个步骤组件，依据 `store.currentStep`。

- [ ] **Step 1: 创建 `StepTabs.vue`**

```vue
<script setup>
const props = defineProps({
  steps: { type: Array, required: true },
  current: { type: Number, required: true },
})
const emit = defineEmits(['step-change'])

const go = (n) => { if (n < props.current) emit('step-change', n) }
</script>

<template>
  <nav class="tabline step-tabs" aria-label="创建步骤">
    <button
      v-for="s in steps"
      :key="s.num"
      type="button"
      :class="['tabline__item', 'step-tab', { 'is-active': s.num === current, 'is-done': s.num < current }]"
      :aria-current="s.num === current ? 'step' : undefined"
      :disabled="s.num > current"
      @click="go(s.num)"
    >
      <span class="step-tab__num ed-num">{{ String(s.num).padStart(2, '0') }}</span>
      <span class="step-tab__label">{{ s.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
/* 基底（下划线、字号、配色、hover、is-active）来自 global.css 的 .tabline / .tabline__item，
   与活动弹窗的枚举标签、设置页的标签共用同一套语言。这里只写步骤栏特有的部分：
   「已完成可点回退 / 未到不可点」的状态与编号着色。 */
.step-tab.is-done { cursor: pointer; color: var(--ed-ink-soft); }
.step-tab.is-done:hover { color: var(--ed-ink); }
.step-tab.is-active { cursor: default; }

.step-tab__num { font-size: var(--ed-label); letter-spacing: .04em; }
.step-tab.is-active .step-tab__num { color: var(--ed-accent); }

@media (max-width: 720px) {
  .step-tabs { gap: var(--ed-space-4); overflow-x: auto; }
  .step-tab__label { font-size: 13px; }
}
</style>
```

- [ ] **Step 2: 创建 `MarginNotes.vue`**

逻辑从 `InfoPanel.vue` 原样搬过来，只换呈现：等宽小字、无框无底、右侧页边注。

```vue
<script setup>
import { computed } from 'vue'
import { usePosterStore } from '../../store/poster'

const store = usePosterStore()

const festivalName = computed(() => store.festivals.find(f => f.id === store.festival)?.name)
const brandName = computed(() => store.brands.find(b => b.id === store.brand)?.name)

const items = computed(() => {
  const out = []
  if (festivalName.value) out.push({ label: '节日', value: festivalName.value })
  if (brandName.value) out.push({ label: '品牌', value: brandName.value })
  if (store.startDate) out.push({ label: '时间', value: store.startDate + (store.endDate ? ' – ' + store.endDate : '') })
  if (store.theme) out.push({ label: '主题', value: store.theme })
  if (store.mainPromotion.content) {
    const t = store.mainPromotion.content
    out.push({ label: '主爆点', value: t.length > 18 ? t.slice(0, 18) + '…' : t })
  }
  if (store.activities.length) out.push({ label: '活动', value: `${store.activities.length} 个` })
  if (store.merchantInfo.name) out.push({ label: '商家', value: store.merchantInfo.name })
  return out
})
</script>

<template>
  <aside v-if="items.length" class="notes" aria-label="已填信息">
    <p class="notes__title ed-meta">已填信息</p>
    <dl class="notes__list">
      <div v-for="it in items" :key="it.label" class="notes__row">
        <dt class="notes__label ed-meta">{{ it.label }}</dt>
        <dd class="notes__value">{{ it.value }}</dd>
      </div>
    </dl>
  </aside>
</template>

<style scoped>
.notes {
  position: sticky;
  top: var(--ed-space-5);
  padding-left: var(--ed-space-4);
  border-left: 1px solid var(--ed-rule);
}

.notes__title { margin-bottom: var(--ed-space-4); }

.notes__list { display: flex; flex-direction: column; gap: var(--ed-space-3); }

.notes__row { display: flex; flex-direction: column; gap: 2px; }

.notes__label { text-transform: none; letter-spacing: .04em; }

.notes__value {
  font-family: var(--ed-serif);
  font-size: 14px;
  line-height: 1.5;
  color: var(--ed-ink);
  word-break: break-word;
}

/* 窄屏折成一条可展开摘要 */
@media (max-width: 1180px) {
  .notes {
    position: static;
    padding: var(--ed-space-4) 0 0;
    border-left: 0;
    border-top: 1px solid var(--ed-rule);
  }
  .notes__list { flex-direction: row; flex-wrap: wrap; gap: var(--ed-space-4); }
  .notes__row { flex-direction: row; align-items: baseline; gap: var(--ed-space-2); }
}
</style>
```

- [ ] **Step 3: 重写 `App.vue`**

结构变为：报头（细线分隔）→ 步骤标签 → 文栏（左）+ 页边注（右）→ toast → 弹窗。**删除 hero 卡片、删除 `PosterWizard` 引用、把步骤切换逻辑并入此处。**

模板部分（`<script setup>` 里除 import 变化外，`onMounted` / `watch` 逻辑与旧版一致，保留不动）：

```vue
<script setup>
import { onMounted, watch, ref } from 'vue'
import { usePosterStore } from './store/poster'
import { generateTonalPalette, applyPalette, resetPalette } from './utils/color'
import { toasts } from './composables/useToast'
import EdIcon from './components/common/EdIcon.vue'
import StepTabs from './components/common/StepTabs.vue'
import MarginNotes from './components/common/MarginNotes.vue'
import Step1FestivalBrand from './components/steps/Step1FestivalBrand.vue'
import Step2Promotions from './components/steps/Step2Promotions.vue'
import Step3Activities from './components/steps/Step3Activities.vue'
import PosterPreview from './components/PosterPreview.vue'
import SettingsDialog from './components/common/SettingsDialog.vue'
import WelcomeDialog from './components/common/WelcomeDialog.vue'
// ... 其余 ref / onMounted / watch 与旧 App.vue 第 11-45 行完全相同，照搬

const steps = [
  { num: 1, label: '节日与品牌', desc: '选择主题和品牌' },
  { num: 2, label: '正面推广', desc: '设置爆点活动' },
  { num: 3, label: '反面活动', desc: '添加详细活动' },
]

const showingResult = computed(() => !!(store.frontPosterUrl || store.carStickerUrl))
</script>

<template>
  <div class="app">
    <header class="masthead">
      <div class="masthead__inner">
        <span class="masthead__img">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">
            <path d="M12 3l3 5h-6l3-5z" /><path d="M9 8l-3 5 6 8 6-8-3-5" />
          </svg>
        </span>
        <h1 class="masthead__title">珠宝海报生成器</h1>
        <span class="masthead__rule" />
        <div class="masthead__actions">
          <button type="button" class="masthead__btn" title="使用帮助" @click="showWelcome = true">
            <EdIcon name="help" :size="17" />
            <span>帮助</span>
          </button>
          <button type="button" class="masthead__btn" title="模型设置" @click="showSettings = true">
            <EdIcon name="gear" :size="17" />
            <span>设置</span>
          </button>
        </div>
      </div>
    </header>

    <main class="main">
      <div v-if="dataLoading" class="shell">
        <div class="shell__doc">
          <div v-for="i in 3" :key="i" class="sk" :style="{ height: i === 1 ? '32px' : '15px', width: i === 1 ? '40%' : (i === 2 ? '80%' : '60%') }" />
        </div>
      </div>

      <template v-else-if="!showingResult">
        <div class="shell">
          <StepTabs :steps="steps" :current="store.currentStep" @step-change="store.setStep" />
          <div class="shell__grid">
            <div class="shell__doc">
              <Step1FestivalBrand v-if="store.currentStep === 1" />
              <Step2Promotions v-else-if="store.currentStep === 2" />
              <Step3Activities v-else-if="store.currentStep === 3" />
            </div>
            <MarginNotes class="shell__notes" />
          </div>
        </div>
      </template>

      <template v-else>
        <div class="shell">
          <PosterPreview />
        </div>
      </template>
    </main>

    <Teleport to="body">
      <div class="toasts">
        <div v-for="t in toasts" :key="t.id" :class="['toast', `toast--${t.type}`]">
          <span class="toast__mark" />
          <span>{{ t.msg }}</span>
        </div>
      </div>
    </Teleport>

    <SettingsDialog v-if="showSettings" @close="showSettings = false" />
    <WelcomeDialog v-if="showWelcome" @close="showWelcome = false" />
  </div>
</template>
```

样式要点（重写 `<style>` 块，全部换成 `--ed-*`，零圆角零投影）：

- `.masthead`：`position: sticky; top: 0; z-index: 100; background: var(--ed-paper); border-bottom: 1px solid var(--ed-rule);` 内层 `max-width: 1320px; margin: 0 auto; padding: var(--ed-space-4) var(--ed-space-5); display: flex; align-items: center; gap: var(--ed-space-3);`
- `.masthead__title`：衬线，`font-size: 19px; font-weight: 700; letter-spacing: .02em;` 不再用 MD3 badge 显示 "AI"
- `.masthead__rule`：`flex: 1; height: 1px; background: var(--ed-rule);` —— 报头里那条把标题和操作区推开的横线
- `.masthead__btn`：文字按钮，`display: inline-flex; align-items:center; gap: var(--ed-space-2); border:0; background:transparent; color: var(--ed-ink-soft); font-size: 13px; cursor:pointer;` 悬停转 `--ed-ink`
- `.shell`：`max-width: 1320px; margin: 0 auto; padding: var(--ed-space-6) var(--ed-space-5) var(--ed-space-7);`
- `.shell__grid`：`display: grid; grid-template-columns: minmax(0, 760px) 1fr; gap: var(--ed-space-6); margin-top: var(--ed-space-6);` —— **内容是 760px 文栏靠左，不居中**，右侧 1fr 放页边注
- `.shell__notes`：`align-self: start;`
- 窄屏 `@media (max-width: 1180px)`：`.shell__grid { grid-template-columns: 1fr; gap: var(--ed-space-5); }`
- `.sk`（骨架）：`background: var(--ed-paper-deep); margin-bottom: var(--ed-space-4);` **无动画**
- `.toast`：`display:flex; align-items:center; gap: var(--ed-space-3); padding: var(--ed-space-3) var(--ed-space-4); border:1px solid var(--ed-ink); background: var(--ed-paper); color: var(--ed-ink); font-size: 13px;` 左侧 `.toast__mark` 是 `width:2px; height:16px;` 的竖线，按类型取色（成功 `--ed-ok`、失败 `--ed-danger`、其余 `--ed-accent`）。容器固定在右上、`pointer-events: none`，单条恢复 `pointer-events: auto`。
- 旧版顶栏的"在线"绿点删除（它只是个装饰性动画，没有真实状态来源）。

- [ ] **Step 4: 删除三个被取代的文件**

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend" && git rm -q src/components/PosterWizard.vue src/components/common/StepNav.vue src/components/common/InfoPanel.vue
```

- [ ] **Step 5: 构建验证**

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend" && npm run build 2>&1 | tail -20
```

预期：构建成功，**无 "Failed to resolve import" 错误**。若报 `PosterWizard is not defined` 之类，说明 `App.vue` 里还有残留引用。

- [ ] **Step 6: 残留计数应下降**

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend" && grep -rn "md3-\|Md3\|--md-" src --include=*.vue --include=*.css --include=*.js | wc -l
```

预期：**比 Step 0 记下的基线少 100 左右**。本任务删掉 `PosterWizard.vue`（10 行匹配）+ `StepNav.vue`（40 行）+ `InfoPanel.vue` 三个文件，`App.vue` 从 35 行匹配降到接近 0（写 plan 时实测；`InfoPanel.vue` 未进前 20 名，故只说"约"）。只要**明显下降**即算通过；**不下降说明旧文件没删干净。**

- [ ] **Step 7: 浏览器验证新外壳与布局**

确保 5173 的 dev server 在跑，然后：

```js
async () => {
  const shell = document.querySelector('.shell');
  const grid = document.querySelector('.shell__grid');
  const doc = document.querySelector('.shell__doc');
  const tabs = [...document.querySelectorAll('.step-tab')].length;
  const cs = doc && getComputedStyle(doc);
  return {
    hasMasthead: !!document.querySelector('.masthead'),
    tabs,
    hasNotes: !!document.querySelector('.notes'),
    docWidth: doc ? Math.round(doc.getBoundingClientRect().width) : null,
    gridCols: grid ? getComputedStyle(grid).gridTemplateColumns : null,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    tabsOverflow: shell ? shell.scrollWidth > shell.clientWidth + 1 : null,
  };
}
```

预期：`hasMasthead: true`；`tabs: 3`；`docWidth` 约 760；`gridCols` 形如 `"760px <剩余>px"`；`bodyBg: "rgb(251, 250, 247)"`；`tabsOverflow: false`。

再断言"零圆角零投影"这条铁律在全页成立：

```js
async () => {
  const bad = [];
  for (const el of document.querySelectorAll('.masthead *, .shell *')) {
    const s = getComputedStyle(el);
    if (s.borderRadius !== '0px' && s.borderRadius !== '') bad.push(['radius', el.className, s.borderRadius]);
    if (s.boxShadow !== 'none') bad.push(['shadow', el.className, s.boxShadow]);
  }
  return bad.slice(0, 20);
}
```

预期：返回空数组 `[]`。**若返回内容，说明未迁移的旧组件（步骤页仍用 Md3Card 等）泄漏了圆角或投影——需在后续任务里清掉，本步骤记录下来即可继续。**

- [ ] **Step 8: 提交**

```bash
cd "C:/Users/LENOVO/Desktop/haibao" && git add -A frontend/src && git commit -m "refactor(ui): 外壳重排为报头 + 横向步骤栏 + 文栏 + 页边注

删除 260px 左侧栏与 Hero 卡片，内容改为左对齐 760px 文栏；
已填信息改为右侧等宽小字页边注。PosterWizard/StepNav/InfoPanel 随之删除。"
```

---

## Task 6: Step1 改造（节日与品牌）

**Files:**
- Modify: `frontend/src/components/steps/Step1FestivalBrand.vue`

**Interfaces:**
- Consumes: `EdSection`（Task 4）、`EdMark` / `EdButton` / `EdField`（Task 3）、`StepTabs` 已提供编号语义
- Produces: 无新对外接口。store 绑定保持原样（`store.festival` / `store.brand` / `store.theme` / `store.subtitle` / `store.startDate` / `store.endDate` / `store.setStep`）。

- [ ] **Step 1: 替换 `<script setup>` 的 import**

删掉 `Md3Card` / `Md3Chip` / `Md3Button` / `Md3TextField`，改为：

```js
import EdSection from '../common/EdSection.vue'
import EdButton from '../common/EdButton.vue'
import EdMark from '../common/EdMark.vue'
import EdField from '../common/EdField.vue'
import EdIcon from '../common/EdIcon.vue'
import CalendarRangePicker from '../common/CalendarRangePicker.vue'
```

`festivals` / `brands` / `festival` / `brand` 等 `toRef` 绑定与 `selectedFestival` / `selectedBrand` 函数**保持不变**。

- [ ] **Step 2: 重写模板**

用 `EdSection` 取代外层卡片与四个分区。每个分区不再有卡片头，改成"等宽小标题 + 发丝线 + 内容"。

```vue
<template>
  <EdSection num="01" title="节日与品牌" desc="选择节日主题和珠宝品牌，系统将自动匹配配色方案">
    <!-- 节日主题 -->
    <div class="block">
      <div class="block__head">
        <h3 class="block__title ed-label">节日主题</h3>
        <span class="ed-tag">必选</span>
      </div>
      <div class="marks">
        <EdMark
          v-for="f in festivals"
          :key="f.id"
          :selected="festival === f.id"
          @click="selectedFestival(f.id)"
        >{{ f.name }}</EdMark>
      </div>
      <div v-if="festival" class="swatch">
        <template v-for="f in festivals.filter(x => x.id === festival)" :key="f.id">
          <span class="swatch__chip" :style="{ background: f.primaryColor }" />
          <span class="swatch__chip" :style="{ background: f.secondaryColor }" />
          <span class="swatch__chip" :style="{ background: f.bgColor }" />
          <span class="swatch__name ed-meta">{{ f.colorScheme }}</span>
        </template>
      </div>
    </div>

    <!-- 珠宝品牌 -->
    <div class="block">
      <div class="block__head">
        <h3 class="block__title ed-label">珠宝品牌</h3>
        <span class="ed-tag">必选</span>
      </div>
      <div class="brands">
        <button
          v-for="b in brands"
          :key="b.id"
          type="button"
          :class="['brand', { 'is-selected': brand === b.id }]"
          @click="selectedBrand(b.id)"
        >
          <span class="brand__name">{{ b.name }}</span>
          <span class="brand__desc ed-meta">{{ b.description }}</span>
          <EdIcon v-if="brand === b.id" name="check" :size="14" class="brand__tick" />
        </button>
      </div>
    </div>

    <!-- 活动主题 -->
    <div class="block">
      <div class="block__head">
        <h3 class="block__title ed-label">活动主题</h3>
        <span class="block__opt ed-meta">选填</span>
      </div>
      <div class="fields">
        <EdField :model-value="store.theme"    @update:model-value="store.theme = $event"    placeholder="例如：七夕浪漫钜惠" />
        <EdField :model-value="store.subtitle" @update:model-value="store.subtitle = $event" placeholder="例如：全场珠宝低至5折" />
      </div>
    </div>

    <!-- 活动时间 -->
    <div class="block">
      <div class="block__head">
        <h3 class="block__title ed-label">活动时间</h3>
        <span class="block__opt ed-meta">选填</span>
      </div>
      <CalendarRangePicker
        :start-date="startDate"
        :end-date="endDate"
        @update:start-date="store.startDate = $event"
        @update:end-date="store.endDate = $event"
      />
    </div>

    <!-- 操作区 -->
    <hr class="ed-rule" />
    <div class="actions">
      <span v-if="!canStep1Next" class="actions__hint ed-meta">
        请先选择<span v-if="!festival">节日</span><span v-if="!festival && !brand">和</span><span v-if="!brand">品牌</span>
      </span>
      <EdButton variant="solid" :disabled="!canStep1Next" @click="store.setStep(2)">
        下一步
        <EdIcon name="arrow-right" :size="15" />
      </EdButton>
    </div>
  </EdSection>
</template>
```

- [ ] **Step 3: 重写 `<style scoped>`**

`.block` / `.block__head` / `.block__title` / `.block__opt` / `.fields` / `.actions` / `.actions__hint` / `.brands` / `.brand` / `.brand__name` / `.brand__desc` / `.brand__tick` **已经定义在 Task 1 的 `global.css`**（连同 `.brands` 的两条窄屏媒体查询）。模板里直接用类名，**不要在这里再写一遍**——scoped 里的定义既不会被 Step2/Step3 拿到，又会和 global 的那份各自漂移。

这里只写 Step1 独有的两块：

```css
/* 节日标记：横向排列，行间距用 row-gap 撑开以容纳 EdMark 的 2px 下划线 */
.marks {
  display: flex;
  flex-wrap: wrap;
  column-gap: var(--ed-space-5);
  row-gap: var(--ed-space-1);
}

.swatch {
  display: flex;
  align-items: center;
  gap: var(--ed-space-3);
  margin-top: var(--ed-space-4);
}
.swatch__chip { width: 26px; height: 26px; border: 1px solid var(--ed-rule); }
.swatch__name { margin-left: var(--ed-space-1); }
```

- [ ] **Step 4: 构建 + 图标自检 + 残留计数**

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend" && npm run build 2>&1 | tail -8 && node scripts/check-icons.mjs && grep -rn "md3-\|Md3\|--md-" src --include=*.vue | wc -l
```

预期：构建成功；图标校验通过（此时 `使用` 数上升到约 3）；残留计数继续下降。

- [ ] **Step 5: 浏览器验证第 1 步**

```js
async () => {
  const marks = [...document.querySelectorAll('.ed-mark')].map(m => m.textContent.trim());
  const brands = [...document.querySelectorAll('.brand')].length;
  return { marksCount: marks.length, brands, secNum: document.querySelector('.ed-section__num')?.textContent };
}
```

预期：`marksCount` 为 13（节日数）；`brands` 为 8；`secNum: "01"`。

交互验证：点一个节日 + 一个品牌，确认 `.brand.is-selected` 出现一个、`.ed-mark.is-selected` 出现一个，且"下一步"按钮从 disabled 变为可用：

```js
async () => {
  const marks = document.querySelectorAll('.ed-mark');
  marks[4]?.click();                                  // 点第 5 个节日
  await new Promise(r => setTimeout(r, 80));
  document.querySelectorAll('.brand')[0]?.click();
  await new Promise(r => setTimeout(r, 80));
  const btn = [...document.querySelectorAll('.ed-btn')].find(b => b.textContent.includes('下一步'));
  return {
    markSelected: document.querySelectorAll('.ed-mark.is-selected').length,
    brandSelected: document.querySelectorAll('.brand.is-selected').length,
    nextDisabled: btn?.disabled,
  };
}
```

预期：`markSelected: 1`、`brandSelected: 1`、`nextDisabled: false`。

最后确认纸面**没有**跟着节日色变（这是本次改造的核心行为改变）：

```js
async () => getComputedStyle(document.body).backgroundColor
```

预期：仍是 `rgb(251, 250, 247)`，不随节日变化。

- [ ] **Step 6: 提交**

```bash
cd "C:/Users/LENOVO/Desktop/haibao" && git add frontend/src/components/steps/Step1FestivalBrand.vue && git commit -m "refactor(ui): Step1 改为杂志版面

卡片改版面分区，节日 chip 改文字标记，品牌网格改下划线文本行。"
```

---

## Task 7: Step2 改造（正面推广）

**Files:**
- Modify: `frontend/src/components/steps/Step2Promotions.vue`

**Interfaces:**
- Consumes: 同 Task 6
- Produces: 无新对外接口。store 绑定保持原样（`mainPromotion` / `secondaryPromotion` / `mainCached` / `secCached` / `updateMainCache` / `updateSecCache` / `syncMainContent` / `syncSecContent` / `setStep`）。

**注意：** 本文件原有 4 处 unicode 字符当图标用（`⚠` `⚡` `+` `←` `→`）与 4 处内联 `style=`，全部清除。

- [ ] **Step 1: 替换 import**

同 Task 6，另按需引入 `EdIcon`。删掉 `Md3Card` / `Md3Button` / `Md3TextField`。

- [ ] **Step 2: 重写模板**

- 外层改为 `<EdSection num="02" title="正面推广" desc="设置爆款活动与折扣，AI 可代写文案">`
- 主爆点区块与次爆点区块各是 `.block`（结构同 Task 6 的 `.block`），标题用 `ed-label`，必选/选填用 `.ed-tag` / `.ed-meta`
- 原 `⚠` 错误提示 → `<EdIcon name="warning" :size="13" />` + 文字，放在 `.note` 容器里。**`.note` 已定义在 Task 1 的 `global.css`，Step2 与 Step3 共用同一份，不要再各写一份 scoped 副本。**
- 原 `⚡` AI 按钮图标 → `<EdIcon name="sparkle" :size="15" />`
- 原 `+` 添加次爆点 → `<EdIcon name="plus" :size="15" />`
- 原 `←` 上一步 / `→` 下一步 → `<EdIcon name="arrow-left|arrow-right" :size="15" />`
- 所有内联 `style=` 删除，改由 CSS 类承担

- [ ] **Step 3: 写 `<style scoped>`（大概率不需要写）**

`.block` / `.block__head` / `.block__title` / `.fields` / `.actions` / `.actions__hint` / `.note` 全部来自 Task 1 的 `global.css`，模板里直接用类名即可。按钮组仍右对齐（`.actions` 自带 `justify-content: flex-end`），主按钮 `variant="solid"`、次按钮 `variant="text"`。

**若 Step2 没有本组件独有的样式，就不要写 `<style scoped>` 块。** 空样式块也是要维护的东西。只在确实遇到独有样式时再加。

- [ ] **Step 4: 构建 + 图标自检 + 残留计数**

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend" && npm run build 2>&1 | tail -8 && node scripts/check-icons.mjs && grep -rn "md3-\|Md3\|--md-" src --include=*.vue | wc -l
```

- [ ] **Step 5: 浏览器验证**

走到第 2 步（先在第 1 步选节日与品牌，再点下一步），然后：

```js
async () => ({
  secNum: document.querySelector('.ed-section__num')?.textContent,
  unicodeIcons: /[⚠⚡✦✎🗑✨＋]/.test(document.querySelector('.shell__doc')?.innerText || ''),
  inlineStyles: document.querySelectorAll('.shell__doc [style]').length,
  svgIcons: document.querySelectorAll('.shell__doc .ed-icon').length,
})
```

预期：`secNum: "02"`；`unicodeIcons: false`；`inlineStyles: 0`；`svgIcons` ≥ 3。

再验证主爆点必填校验与按钮态：初始"下一步"应为 disabled；在"主标题"输入任意文字后应变可用。

- [ ] **Step 6: 提交**

```bash
cd "C:/Users/LENOVO/Desktop/haibao" && git add frontend/src/components/steps/Step2Promotions.vue && git commit -m "refactor(ui): Step2 改为杂志版面并清除 unicode 图标

⚠ ⚡ + ← → 全部换成 EdIcon；去掉 4 处内联 style。"
```

---

## Task 8: Step3 + ActivityModal 改造（反面活动）

**Files:**
- Modify: `frontend/src/components/steps/Step3Activities.vue`
- Modify: `frontend/src/components/common/ActivityModal.vue`

**Interfaces:**
- Consumes: 同 Task 6，另加 `EdDialog`（Task 4）
- Produces: 无新对外接口。store 绑定与原样一致（`activities` / `merchantInfo` / `selectedMerchantTemplateId` / `merchantTemplates` / `addActivity` / `removeActivity` / `updateActivity` / `addCustomMerchant` / `deleteCustomMerchant` / `generatePosters`）。

**两个必须一起做的动作，否则会留下半迁移状态：**

1. `Step3Activities.vue` 用**原生 `confirm()`** 做删除确认（样式不可控、阻断式），改为 `EdDialog` 确认框。
2. `ActivityModal.vue` 内有**两个嵌套弹窗**（活动表单 + 优惠类型主从选择器），都改走 `EdDialog`；它同时**在 `<style>` 里重新声明了 `.md3-divider` 与 `textarea.md3-field__textarea`**，一并删除。

- [ ] **Step 1: `Step3Activities.vue` 替换 import 并重写模板**

- 外层 `<EdSection num="03" title="反面活动" desc="添加活动详情与商家信息">`
- 活动列表：原来是卡片列表，改为**带发丝线的文本行**。每行左侧是衬线活动名，右侧是两个 `EdIcon` 图标按钮（`edit` / `trash`），中间用本组件自己的 `.spacer { flex: 1 }` 撑开
- 空态：`md3-empty` → 一行衬线提示 + 一行等宽说明，中间一条 `ed-rule`
- 商家模板：原为可选中卡片网格（含一个虚线"添加"卡），改为**下划线文本行**，直接用 `global.css` 的 `.brands` / `.brand` / `.brand__name` / `.brand__desc` / `.brand__tick`（**与 Step1 的品牌列表是同一份定义**，不要再写一遍）；"添加自定义商家"改为一个 `variant="text"` 的 `EdButton` + `EdIcon name="plus"`
- 内联"添加商家"表单改为展开后的 `.block`，用 `EdField`
- 底部操作区用 `.actions`：上一步 `variant="text"` + `EdIcon name="arrow-left"`；生成按钮 `variant="solid"` + `:loading="store.generating"`
- 原 `✎ 🗑 ✨ ⚠ + ←` 全部换 `EdIcon`（`edit` `trash` `sparkle` `warning` `plus` `arrow-left`）

`.block` / `.fields` / `.actions` / `.note` / `.brands` / `.brand*` 都来自 `global.css`，直接用。**本组件独有的**写进 `<style scoped>`（`.spacer` 与 `.confirm-text` 在模板里被引用，必须在这里定义，否则是无样式裸元素）：

```css
/* 活动行：发丝线文本行，不是卡片 */
.act-row {
  display: flex;
  align-items: center;
  gap: var(--ed-space-3);
  padding: var(--ed-space-3) 0;
  border-bottom: 1px solid var(--ed-rule);
}
.act-row__name {
  font-family: var(--ed-serif);
  font-size: 16px;
  color: var(--ed-ink);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.spacer { flex: 1; }

/* 空态 */
.empty { padding: var(--ed-space-5) 0; }
.empty__line {
  font-family: var(--ed-serif);
  font-size: var(--ed-subhead);
  color: var(--ed-ink);
  margin-bottom: var(--ed-space-3);
}
.empty__hint { text-transform: none; letter-spacing: .02em; }

/* 删除确认框里的说明文字 */
.confirm-text { color: var(--ed-ink-soft); }
```

- [ ] **Step 2: 用 `EdDialog` 取代原生 `confirm()`**

在 `<script setup>` 增加一个待删除项的状态，替换掉 `confirm(...)` 调用：

```js
import { ref } from 'vue'
import EdDialog from '../common/EdDialog.vue'

const pendingDelete = ref(null)   // 存活动 id，null 表示无确认框

function askDelete(id) { pendingDelete.value = id }

function confirmDelete() {
  if (pendingDelete.value !== null) store.removeActivity(pendingDelete.value)
  pendingDelete.value = null
}
```

模板里追加（放在根元素内末尾）：

```vue
<EdDialog
  v-if="pendingDelete !== null"
  title="删除这个活动？"
  :width="420"
  @close="pendingDelete = null"
>
  <p class="confirm-text">删除后无法恢复，需要重新填写。</p>
  <template #footer>
    <EdButton variant="text" @click="pendingDelete = null">取消</EdButton>
    <EdButton variant="solid" @click="confirmDelete">删除</EdButton>
  </template>
</EdDialog>
```

- [ ] **Step 3: `ActivityModal.vue` 改造**

- 外层弹窗改用 `<EdDialog :title="编辑 ? '编辑活动' : '添加活动'" :width="680" @close="emit('close')">`，footer 插槽放取消/保存
- 原 `md3-segmented-group` 三选一 → 用 `global.css` 的 `.tabline` + `.tabline__item`（选中项加 `is-active`）。**这与步骤栏、设置页标签是同一份定义**——语言一致由单一来源保证，不靠三处各写一遍然后靠人眼对齐
- 原 `md3-field--outlined` 与 `md3-field__textarea` 全部换成 `EdField`
- 原固定位置的内联 `style="width:100%;margin-top:8px"` 删掉，改用类
- 嵌套的优惠类型主从选择弹窗（左侧分类导航 + 搜索 + 两列卡片网格）改为：外层 `EdDialog`，内部左侧分类列表改成文字列表（选中项左移一条 2px 竖线），右侧改下划线文本行网格
- 缩略图网格保留，删除按钮的 `✕` → `<EdIcon name="close" :size="12" />`，缩略图本身零圆角
- 删除本地重复声明的 `.md3-divider` 与 `textarea.md3-field__textarea`
- 本组件独有的样式（左侧分类列表的选中 2px 竖线、缩略图网格零圆角、搜索行）写进 `ActivityModal.vue` 自己的 `<style scoped>`；`.tabline` / `.block` / `.fields` / `.actions` 用 `global.css` 的，不重复定义

- [ ] **Step 4: 构建 + 图标自检 + 残留计数**

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend" && npm run build 2>&1 | tail -8 && node scripts/check-icons.mjs && grep -rn "md3-\|Md3\|--md-" src --include=*.vue | wc -l
```

预期：残留计数**大幅下降**（这两个文件原本占了相当比例）。

- [ ] **Step 5: 浏览器验证**

走完流程到第 3 步，然后：

```js
async () => {
  const doc = document.querySelector('.shell__doc');
  return {
    secNum: doc?.querySelector('.ed-section__num')?.textContent,
    nativeConfirmStillUsed: /confirm\(/.test(doc?.innerHTML || ''),
    unicodeIcons: /[⚠✎🗑✨＋✕]/.test(doc?.innerText || ''),
    inlineStyles: doc?.querySelectorAll('[style]').length,
  };
}
```

预期：`secNum: "03"`；`nativeConfirmStillUsed: false`；`unicodeIcons: false`；`inlineStyles: 0`。

再实测一次删除确认流：加一个活动 → 点删除图标 → 断言出现 `.ed-dialog` 且标题为"删除这个活动？" → 点"取消"断言弹窗消失且活动还在 → 再删一次点"删除"断言活动消失。

同时在 Step3 实测 `ActivityModal` 能打开、三个分段选项可切、保存后活动出现在列表里。

- [ ] **Step 6: 提交**

```bash
cd "C:/Users/LENOVO/Desktop/haibao" && git add frontend/src/components/steps/Step3Activities.vue frontend/src/components/common/ActivityModal.vue && git commit -m "refactor(ui): Step3 与 ActivityModal 改为杂志版面

删除确认从原生 confirm() 改为 EdDialog，清掉重复声明的公共组件样式。"
```

---

## Task 9: 四个辅助组件改造

**Files:**
- Modify: `frontend/src/components/common/CalendarRangePicker.vue`
- Modify: `frontend/src/components/common/DiscountTypeSelect.vue`
- Modify: `frontend/src/components/common/GenerateProgressDialog.vue`
- Modify: `frontend/src/components/EnhancePanel.vue`

**Interfaces:**
- Consumes: `EdDialog` / `EdButton` / `EdIcon`
- Produces: 四个组件的 props/emits **签名全部保持不变**，因为这些是上游已经依赖的契约：
  - `CalendarRangePicker`: props `startDate` / `endDate`，emits `update:start-date` / `update:end-date`
  - `DiscountTypeSelect`: props `modelValue` / `types`，emits `update:modelValue`
  - `GenerateProgressDialog`: props `visible` / `percent` / `seconds`，emits `cancel`
  - `EnhancePanel`: props `target`，emits `close` / `applied`

- [ ] **Step 1: `CalendarRangePicker.vue`**

- 删除本地重写的 `.md3-chip` 样式，预设项改用 `EdMark`
- 两个日期字段按钮改为下划线式（与 `EdField` 视觉一致）：只有底部 1px 线 + 等宽小标签
- 弹出日历：零圆角、1px 墨线框、纸底；今天用 1px 墨线方框标记；范围高亮改为 `--ed-accent-tint` 底色 + 端点处 2px 强调色竖线（**去掉原来的半圆角端头**）
- 日历图标 / 左右箭头 / 上下午切换图标 → `EdIcon`（`calendar` / `chevron-left` / `chevron-right`）
- 底部的"清除"改为 `variant="text"` 的 `EdButton`

- [ ] **Step 2: `DiscountTypeSelect.vue`**

- 触发器当前用 `md3-field md3-field--outlined` → 改为下划线式，与 `EdField` 视觉一致
- 下拉面板：零圆角、1px 墨线框、纸底、**无投影**（旧版靠投影浮起，改靠线）
- 分类标题用 `ed-label`，条目悬停 `--ed-paper-deep`，选中项左侧 2px 强调色竖线
- 搜索框改用 `EdField` + `search` 图标
- 空态用一行衬线文字 + `ed-rule`
- 去掉 `.dts-open` 上的 `!important`

- [ ] **Step 3: `GenerateProgressDialog.vue`**

- 改用 `EdDialog`（`:close-on-overlay="false"`、`:hide-close="true"`，生成中不可误关）
- 原来那个硬编码 `stroke-dasharray: 120 / dashoffset: 40` 的 SVG 圆环 spinner **删掉**，换成一条水平进度条：`height: 2px` 外框 + `--ed-accent` 填充，上方配等宽百分比数字
- 倒计时数字加 `.ed-num` 保证等宽不跳动
- 遮罩沿用 `EdDialog` 的（旧的 `rgba(0,0,0,0.55)` 删除）

- [ ] **Step 4: `EnhancePanel.vue`**

- 改用 `EdDialog :title="'优化海报'"`
- 原来手写 `.radio-dot` div 的假单选框 → 改成方块选择项：未选中 1px 墨线方框，选中填墨并在内部放 `<EdIcon name="check" :size="11" />`
- 三种优化模式选项改为**可点选的下划线文本行**（标题用衬线，描述用 `ed-meta`）
- 信息/警告/错误提示条 → `.note`（左侧 2px 线，颜色按类型：`--ed-accent` / `--ed-danger`）
- 内联 `style="color:var(--md-error)"` 等待全部删除

- [ ] **Step 5: 构建 + 残留计数**

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend" && npm run build 2>&1 | tail -8 && node scripts/check-icons.mjs && grep -rn "md3-\|Md3\|--md-" src --include=*.vue | wc -l
```

- [ ] **Step 6: 浏览器验证**

```js
async () => {
  const out = {};
  // 日历预设与日历弹层
  document.querySelector('.ed-mark') && (out.hasMark = true);
  // 优惠类型下拉
  out.hasDts = !!document.querySelector('[class*="dts"]');
  // 优化面板需要先进预览页才有，这里只验证前两者可打开
  return out;
}
```

逐步实测：
1. 在 Step1 点开日期选择器 → 断言日历弹层出现、选一个区间后两个日期字段文字更新、"清除"能清空。
2. 在 Step2 点开优惠类型下拉 → 断言可搜索、可选中，选中后触发器文字更新。
3. 走到预览页点"优化" → 断言 `EnhancePanel` 弹出、三个选项可点选、确认后按钮进入 loading。

- [ ] **Step 7: 提交**

```bash
cd "C:/Users/LENOVO/Desktop/haibao" && git add frontend/src/components/common/CalendarRangePicker.vue frontend/src/components/common/DiscountTypeSelect.vue frontend/src/components/common/GenerateProgressDialog.vue frontend/src/components/EnhancePanel.vue && git commit -m "refactor(ui): 日历 / 优惠类型 / 进度 / 优化面板改为杂志风

去掉本地重复的 md3 样式与硬编码 rgba 色值，进度环改为水平进度条。"
```

---

## Task 10: PosterPreview 改为图版页

**Files:**
- Modify: `frontend/src/components/PosterPreview.vue`

**Interfaces:**
- Consumes: `EdButton` / `EdIcon` / `EdDialog` / `EdSection`
- Produces: 无新对外接口。store 绑定与原样一致（`frontendUrl` 相关字段、`enhancedFrontUrl` / `enhancedBackUrl` / `carStickerUrl` / `backBgImageUrl` / `enhancePoster` / `revertEnhancement` / `resetAll` / `setStep`）。

**注意：** 这是**唯一一个完全不用封装组件、直接写原始 `md3-*` 类名**的文件，因此它的残留最集中。同时它有大量硬编码色值（`rgba(0,0,0,.85)` / `#fff` / `rgba(255,255,255,.1)` / `rgba(255,255,255,.2)` / `box-shadow: 0 8px 32px rgba(0,0,0,.3)`）与内联 `style`，全部清除。

- [ ] **Step 1: 重写为图版页结构**

- 顶部：一行 `EdSection` 风格的标题（衬线"生成结果"）+ 发丝线
- 图版区：正面、反面、车贴各一块 `.plate`
  - `.plate` 内：图片本体（`width: 100%`，零圆角，1px `--ed-rule` 边框），下方一行 `.plate__cap` 放等宽说明（图版号 / 尺寸 / 文件名）
  - 操作行放在说明行右侧：下载 / 放大 / 优化，用 `EdIcon`（`download` / `zoom-in` / `sparkle`）+ 等宽小字，`variant="text"` 的 `EdButton`
- 摘要信息：从卡片改成 `<dl>` 定义列表。`dt` 用 `ed-meta`，`dd` 用衬线字体
- 灯箱：保留 Teleport + 点击外部关闭 + 缩放光标。遮罩改 `rgba(22,21,15,.88)`，图片容器 1px `--ed-paper` 边框、零圆角，关闭按钮用 `EdIcon name="close"`
- 底部的"重新生成"等操作走 `variant="outline"` / `variant="text"` 的 `EdButton`
- 删除本地 `@keyframes fadeUp`（`EdSection` 场景不再需要），删除 `md3-spinner` 改用 `EdButton` 的 `:loading`

- [ ] **Step 2: 重写 `<style scoped>`**

```css
.plates { display: flex; flex-direction: column; gap: var(--ed-space-7); }

.plate { display: block; }

.plate__img {
  display: block;
  width: 100%;
  border: 1px solid var(--ed-rule);
  background: var(--ed-paper-deep);
  cursor: zoom-in;
}

.plate__cap {
  display: flex;
  align-items: center;
  gap: var(--ed-space-4);
  padding-top: var(--ed-space-3);
  border-top: 1px solid var(--ed-rule);
  margin-top: var(--ed-space-3);
}
.plate__no { flex-shrink: 0; }
.plate__name { flex: 1; text-transform: none; letter-spacing: .02em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.plate__ops { display: flex; gap: var(--ed-space-2); flex-shrink: 0; }

.summary { display: grid; grid-template-columns: 120px 1fr; gap: var(--ed-space-2) var(--ed-space-4); }
.summary dt { }
.summary dd { font-family: var(--ed-serif); font-size: 14px; color: var(--ed-ink); }

.lightbox {
  position: fixed;
  inset: 0;
  z-index: 1500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--ed-space-5);
  background: rgba(22, 21, 15, .88);
}
.lightbox__img { max-width: 100%; max-height: 88vh; border: 1px solid var(--ed-paper); }
.lightbox__close {
  position: absolute;
  top: var(--ed-space-5);
  right: var(--ed-space-5);
  border: 0;
  background: transparent;
  color: var(--ed-paper);
  cursor: pointer;
}

@media (min-width: 1000px) {
  .plates--pair { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ed-space-6); align-items: start; }
}
```

- [ ] **Step 3: 构建 + 图标自检 + 残留计数**

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend" && npm run build 2>&1 | tail -8 && node scripts/check-icons.mjs && grep -rn "md3-\|Md3\|--md-" src --include=*.vue | wc -l
```

- [ ] **Step 4: 浏览器验证（需要真实生成，会消耗 API 额度）**

**这一步会真的调用文生图接口。** 若不想消耗额度，可跳过生成、只验证到"点击生成后弹出进度条"为止，其余留到任务 13 的完整验收。

```js
async () => ({
  plates: document.querySelectorAll('.plate').length,
  lightbox: !!document.querySelector('.lightbox'),
  summaryRows: document.querySelectorAll('.summary > *').length,
  hardcodedWhite: /#fff|#ffffff/i.test(document.querySelector('.shell')?.innerHTML || ''),
})
```

预期：`plates: 3`（正面 / 反面 / 车贴）；`lightbox: false`（未点开时）；`summaryRows` 为偶数（dt/dd 成对）；`hardcodedWhite: false`。

再点一张图断言灯箱出现、再点遮罩断言灯箱关闭。

- [ ] **Step 5: 提交**

```bash
cd "C:/Users/LENOVO/Desktop/haibao" && git add frontend/src/components/PosterPreview.vue && git commit -m "refactor(ui): PosterPreview 改为图版页

图片配等宽图说，摘要改定义列表，清除全部硬编码色值与原始 md3 类名。"
```

---

## Task 11: SettingsDialog 改造

**Files:**
- Modify: `frontend/src/components/common/SettingsDialog.vue`

**Interfaces:**
- Consumes: `EdDialog` / `EdButton` / `EdField` / `EdIcon`
- Produces: 无新对外接口。API 调用与原样一致（`api.getSettings` / `api.updateSettings` / `api.getBrands` / `api.addBrand` / `api.deleteBrand` 及节日、优惠类型、商家的同类调用）。

**注意：** 这是最大的单文件（1032 行），且它在 `<style>` 里**完整重新实现了一遍 `.md3-btn` 全部变体与 `.md3-spinner`**。这些本地重写全部删除，改用 `EdButton`。它也是残留计数的大头。

- [ ] **Step 1: 用 `EdDialog` 替换外层弹窗**

原弹窗自己的遮罩与框体删除，改为 `<EdDialog title="设置" :width="900" @close="emit('close')">`。

- [ ] **Step 2: 标签页改用文字标签 + 下划线**

两个标签（模型配置 / 数据管理）用 `global.css` 的 `.tabline` + `.tabline__item`（选中项加 `is-active`）。

**复用的是样式词汇，不是 `StepTabs` 组件**——`StepTabs` 的语义是页面级步骤，带 disabled／已完成回退逻辑与 `step-change` 事件，这里只有 2 个固定标签加一个局部 state，套用组件会引入一堆无用分支。

- [ ] **Step 3: 表单区改造**

- 分组标题（火山引擎 ARK / 硅基流动 / DeepSeek）→ 等宽 `ed-label` + 发丝线
- 键值对表单：`label` 用等宽小字，`input` 走 `EdField`（下划线式）
- 密码字段的显示/隐藏眼睛图标 → `<EdIcon name="eye|eye-off" :size="16" />`
- **原生 `<select>` 换成 `EdField` + 自绘下拉**（原生 select 的样式完全不可控，与整体风格冲突）；保留原选中值逻辑
- **原生 `<input type="color">` 无法用 CSS 改造外观**，因此改为：一个 1px 墨线方框 + 内部填色块，旁边一个 `EdField` 输入十六进制值，两者双向同步。**取值逻辑不变**，仍然是合法的 hex 字符串
- 保存/取消按钮 → `EdButton`（`solid` / `text`）

- [ ] **Step 4: 数据管理区的行内编辑改造**

- 表头：等宽小字 + 下方 1px 墨线
- 数据行：从卡片感改为 `border-bottom: 1px solid var(--ed-rule)` 的文本行
- 行内"查看 → 编辑"切换保留，编辑态用 `EdField`
- 操作图标（编辑 / 删除）→ `EdIcon name="edit|trash"`
- LOGO 上传 → `<EdIcon name="upload" :size="15" />` + 文件名等宽小字
- 空态 → 一行衬线文字 + `ed-rule`
- **原生 `confirm()` 三处全部改为 `EdDialog`**（`handleCleanup` 清理上传文件、数据行删除、品牌 LOGO 删除），与 Task 8 的做法一致（同款待确认状态 + 同款弹窗结构）。其中 `handleCleanup` 是**不可逆的批量文件删除**，警告图标用 `EdIcon name="warning"`，确认按钮 `variant="solid"`；**提示文案沿用原 `confirmMsg`（`'确定要清理所有上传文件吗？'` / `` `确定要清理 ${days} 天前的上传文件吗？` ``），一字不改**
- 删除本地重新实现的 `.md3-btn*` 与 `.md3-spinner*` 全部样式块

- [ ] **Step 5: 构建 + 图标自检 + 残留计数**

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend" && npm run build 2>&1 | tail -8 && node scripts/check-icons.mjs && grep -rn "md3-\|Md3\|--md-" src --include=*.vue | wc -l
```

预期：残留计数**再降一大截**。

- [ ] **Step 6: 浏览器验证**

打开设置（报头右侧"设置"按钮），然后：

```js
async () => {
  const dlg = document.querySelector('.ed-dialog');
  return {
    open: !!dlg,
    nativeSelects: dlg?.querySelectorAll('select').length,
    nativeColorInputs: dlg?.querySelectorAll('input[type=color]').length,
    localBtnOverrides: [...dlg.querySelectorAll('.ed-btn, .md3-btn')].length,
    hasDialogFrame: !!dlg && getComputedStyle(dlg).borderRadius === '0px',
  };
}
```

预期：`open: true`；`nativeSelects: 0`；`nativeColorInputs: 0`；`hasDialogFrame: true`。

功能实测：改一个 API Key → 保存 → 断言出现成功 toast；切到数据管理标签 → 能看到品牌列表 → 删一条 → 断言出现 `EdDialog` 确认框而不是原生弹窗。

- [ ] **Step 7: 提交**

```bash
cd "C:/Users/LENOVO/Desktop/haibao" && git add frontend/src/components/common/SettingsDialog.vue && git commit -m "refactor(ui): SettingsDialog 改为杂志风

删除本地重复实现的 .md3-btn / .md3-spinner，原生 select 与 color input
换成自绘控件，删除确认改 EdDialog。"
```

---

## Task 12: WelcomeDialog 改造

**Files:**
- Modify: `frontend/src/components/common/WelcomeDialog.vue`

**Interfaces:**
- Consumes: `EdDialog` / `EdButton` / `EdIcon` / `EdSection`
- Produces: 无新对外接口。`emit('close')` 与"下次不再提示"的 localStorage 逻辑保持不变。

**注意：** 这个文件在 SVG 里埋了大量硬编码色（`#1a1a3a` / `#FFD700` / `#2a2a5a` / `#B8860B`）并且本地重写了 `.md3-btn--filled` / `--text`。这些都要处理。

- [ ] **Step 1: 四页内容改为纯排版，去掉插画式 SVG**

原来第 2 页有大量手绘"海报版式示意"SVG，带固定 `height:480px` 与一堆硬编码深蓝色值，与杂志风完全不搭。改为**纯排版表达**：

- 第 1 页（欢迎）：一行大号衬线标题 + 一句说明 + 一条发丝线
- 第 2 页（版式说明）：用真正的文字列表说明正面/反面各放什么，标签用 `ed-meta`，不再画图
- 第 3 页（步骤）：`01 / 02 / 03` 等宽编号 + 衬线步骤名 + 说明，每项之间一条发丝线
- 第 4 页（注意事项）：`.note` 列表

固定 `height:480px` 删除，弹窗高度随内容自适应（`EdDialog` 的 `max-height: 88vh` 已处理溢出）。

- [ ] **Step 2: 页码指示器改为等宽计数器**

圆点指示器 → `01 / 04` 形式的等宽数字，当前页数字用 `--ed-accent`。

- [ ] **Step 3: 按钮改造**

- "下一步" / "开始使用" → `EdButton variant="solid"` + 末页配 `<EdIcon name="arrow-right" :size="15" />`
- "跳过" / "上一步" → `EdButton variant="text"`
- "下次不再提示"的复选框改成方块勾选框（1px 墨线方框，选中填墨 + `EdIcon name="check" :size="11" />`）
- 删除本地重写的 `.md3-btn` 样式块

- [ ] **Step 4: 构建 + 图标自检 + 残留计数**

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend" && npm run build 2>&1 | tail -8 && node scripts/check-icons.mjs && grep -rn "md3-\|Md3\|--md-" src --include=*.vue | wc -l
```

- [ ] **Step 5: 浏览器验证**

引导弹窗在每次刷新时自动弹出：

```js
async () => {
  const dlg = document.querySelector('.ed-dialog');
  return {
    open: !!dlg,
    hardcodedDeepBlue: /#1a1a3a|#2a2a5a|#B8860B/i.test(dlg?.innerHTML || ''),
    pageCounter: dlg?.textContent.match(/\d{2}\s*\/\s*\d{2}/)?.[0] ?? null,
    fixedHeight: dlg ? /height:\s*480px/.test(dlg.getAttribute('style') || '') : null,
  };
}
```

预期：`open: true`；`hardcodedDeepBlue: false`；`pageCounter: "01 / 04"`；`fixedHeight: false`。

翻完 4 页，断言每页都能显示且末页出现"开始使用"按钮；点它断言弹窗关闭。

- [ ] **Step 6: 提交**

```bash
cd "C:/Users/LENOVO/Desktop/haibao" && git add frontend/src/components/common/WelcomeDialog.vue && git commit -m "refactor(ui): WelcomeDialog 改为纯排版引导

去掉带硬编码深蓝色的插画 SVG，改文字排版；页码改等宽计数器。"
```

---

## Task 13: 配色收口与 MD3 清除

**Files:**
- Modify: `frontend/src/utils/color.js`（收缩）
- Modify: `frontend/src/App.vue`（改用新接口）
- Modify: `frontend/src/main.js`（去掉 md3 样式引入）
- Delete: 9 个 MD3 文件（见 File Structure 的删除清单）

**Interfaces:**
- Consumes: 前面全部任务
- Produces: `deriveAccent(hex) → { accent, accentDeep, accentTint }`、`applyPalette(palette)`、`resetPalette()`。**`generateTonalPalette` 与 `DEFAULT_PALETTE` 被删除。**

- [ ] **Step 1: 收缩 `utils/color.js`**

整体替换为（148 行 → 约 55 行）。保留 hex/RGB/HSL 互转与 `applyPalette` / `resetPalette`，删除 `TONE_TO_L` 映射表与 30 余项色调板推导：

```js
/**
 * 点睛色派生：把节日主色转换成在纸面上可读的三个色值。
 * 纸面与墨色恒定，节日色只做点缀，不再重刷整个界面。
 */

function hexToRgb(hex) {
  hex = hex.replace('#', '')
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]
  const n = parseInt(hex, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(c => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('')
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h * 360, s, l]
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360
  s = Math.max(0, Math.min(1, s))
  l = Math.max(0, Math.min(1, l))
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  if (s === 0) { const v = Math.round(l * 255); return rgbToHex(v, v, v) }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return rgbToHex(
    hue2rgb(p, q, h + 1/3) * 255,
    hue2rgb(p, q, h) * 255,
    hue2rgb(p, q, h - 1/3) * 255
  )
}

/**
 * 由节日主色派生点睛色。
 * accent 压暗到 L≈0.38 保证在米白纸面上有足够对比；
 * deep 再压一档；tint 是极淡洗底。
 */
export function deriveAccent(seedHex) {
  const [h, s] = rgbToHsl(...hexToRgb(seedHex))
  const sat = Math.min(1, s * 1.05)
  return {
    '--ed-accent': hslToHex(h, sat, 0.38),
    '--ed-accent-deep': hslToHex(h, sat, 0.28),
    '--ed-accent-tint': hslToHex(h, Math.min(1, sat * 0.7), 0.95),
  }
}

export const DEFAULT_ACCENT = deriveAccent('#3B74F1')

export function applyPalette(palette) {
  const root = document.documentElement
  for (const [key, value] of Object.entries(palette)) root.style.setProperty(key, value)
}

export function resetPalette() { applyPalette(DEFAULT_ACCENT) }
```

- [ ] **Step 2: 修改 `App.vue` 的配色 watch**

把两处 `applyPalette(generateTonalPalette(...))` 改为 `applyPalette(deriveAccent(f.primaryColor))`，import 同步改为 `import { deriveAccent, applyPalette, resetPalette } from './utils/color'`。`watch` 的结构与触发条件**完全不变**。

- [ ] **Step 3: 修改 `main.js`，删除 MD3 样式引入**

```js
import './styles/global.css'
import './styles/ed-tokens.css'
```

- [ ] **Step 4: 删除 9 个 MD3 文件**

**用 `rm -f` 而不是 `git rm`。** 这 6 个文件里有一部分可能还没被 git 跟踪过（本次改造前它们是未提交的工作），`git rm` 遇到未跟踪文件会直接报 `did not match any files` 并**一个都不删**，随后 Step 5 的"必须归零"就成了死结。`rm -f` 对两种状态都成立，删完用 `git add -A` 把删除登记进暂存区：

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend" && rm -f \
  src/styles/md3-tokens.css \
  src/styles/md3-components.css \
  src/components/common/Md3Button.vue \
  src/components/common/Md3Card.vue \
  src/components/common/Md3Chip.vue \
  src/components/common/Md3TextField.vue && \
cd "C:/Users/LENOVO/Desktop/haibao" && git add -A frontend/src && git status --short frontend/src
```

预期：`git status` 里这 6 个文件显示为 `D`（已删除待提交）。**若还有文件残留、或某个该删的没删掉，先解决再往下走。**

（`PosterWizard.vue` / `StepNav.vue` / `InfoPanel.vue` 已在 Task 5 删除。）

- [ ] **Step 5: 残留计数必须归零**

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend" && grep -rn "md3-\|Md3\|--md-" src --include=*.vue --include=*.css --include=*.js | wc -l
```

预期：**0**。若不为 0，逐条看输出并清掉——这一步没有商量余地，任何残留都说明迁移不完整。

- [ ] **Step 6: 构建**

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend" && npm run build 2>&1 | tail -15
```

预期：构建成功。若报 `Failed to resolve import ".../md3-..."`，说明还有文件在 import 已删除的 MD3 组件。

- [ ] **Step 7: 无 JS 报错**

打开 `http://localhost:5173/`，检查控制台：

```js
async () => {
  // 触发一次节日切换以验证配色 watch 正常
  const m = document.querySelectorAll('.ed-mark');
  m[1]?.click();
  await new Promise(r => setTimeout(r, 150));
  m[6]?.click();
  await new Promise(r => setTimeout(r, 150));
  const cs = getComputedStyle(document.documentElement);
  return {
    accent: cs.getPropertyValue('--ed-accent').trim(),
    paper: cs.getPropertyValue('--ed-paper').trim(),
    bodyBg: getComputedStyle(document.body).backgroundColor,
  };
}
```

预期：`accent` 随两次点击发生变化（是两个不同的十六进制值）；`paper: #FBFAF7`；`bodyBg: "rgb(251, 250, 247)"`——**重点确认 body 背景不随节日改变**。

控制台不得有 error。特别检查：不得出现 `--md-` 相关的变量解析失败或组件未注册警告。

- [ ] **Step 8: 零圆角零投影全页断言**

```js
async () => {
  const bad = [];
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el);
    if (s.display === 'none') continue;
    if (s.borderRadius !== '0px' && s.borderRadius !== '') bad.push(['radius', el.tagName + '.' + (typeof el.className === 'string' ? el.className : ''), s.borderRadius]);
    if (s.boxShadow !== 'none') bad.push(['shadow', el.tagName + '.' + (typeof el.className === 'string' ? el.className : ''), s.boxShadow]);
  }
  return bad.slice(0, 30);
}
```

预期：空数组 `[]`。**注意：`border-radius: 50%` 的圆点在设计里已全部移除；若返回里有元素，回到对应任务修正。**

- [ ] **Step 9: 无 emoji / unicode 图标断言**

```bash
cd "C:/Users/LENOVO/Desktop/haibao/frontend" && grep -rnP '[\x{2190}-\x{21FF}\x{2600}-\x{27BF}\x{2B00}-\x{2BFF}\x{1F300}-\x{1FAFF}\x{2713}\x{2715}\x{FF0B}]' src --include=*.vue --include=*.css | grep -v 'EdIcon.vue' | grep -v '^\s*$'
```

预期：**无输出**（允许命中 `EdIcon.vue` 之外的地方为 0）。若命中，把该字符换成对应 `EdIcon`。

- [ ] **Step 10: 完整流程浏览器走查**

逐项实测并记录结果，**每一项都要在浏览器里真的走一遍**：

| # | 操作 | 断言 |
|---|---|---|
| 1 | 刷新页面 | 引导弹窗出现，`01 / 04` 页码正确，翻 4 页后关闭 |
| 2 | Step1 选节日 + 品牌 + 填主题 + 选日期区间 | `下一步` 转为可用；页边注出现"节日 / 品牌 / 主题 / 时间"四行 |
| 3 | 点 `下一步` | 步骤栏 `02` 下沉墨线，文栏切到 Step2 |
| 4 | Step2 填主爆点，点 AI 代写 | 出现 loading，返回文案填充成功 |
| 5 | 添加次爆点后删除 | 区块增删正常 |
| 6 | Step3 添加活动 | `ActivityModal` 打开，分段选项可切，保存后列表出现该行 |
| 7 | Step3 点删除 | 出现 `EdDialog` 确认框（**不是原生弹窗**），取消/确认都正确 |
| 8 | Step3 选商家模板 | 选中行出现强调色底线 |
| 9 | 点生成 | 进度弹窗出现，水平进度条推进，可取消 |
| 10 | 生成完成 | 预览页出现三块图版，图说为等宽小字 |
| 11 | 点图片 | 灯箱打开；点遮罩关闭 |
| 12 | 点优化 | `EnhancePanel` 打开，选模式后确认，进入 loading |
| 13 | 撤销优化 | 回到原图 |
| 14 | 下载 | 文件正常下载 |
| 15 | 点"重新制作" | 回到 Step1，状态清空，静态数据仍在 |
| 16 | 打开设置，改一个 Key 并保存 | 出现成功 toast；切数据管理标签能看到列表 |
| 17 | 键盘 Tab 遍历第 1–3 步 | 每个可交互元素都有可见焦点环 |

- [ ] **Step 11: 断网验证字体**

停掉所有外网访问不可行，改用等价验证：确认页面**没有任何**外部字体请求：

```js
async () => performance.getEntriesByType('resource')
  .map(e => e.name)
  .filter(n => /fonts\.(googleapis|gstatic)|cdn\.|unpkg|jsdelivr/i.test(n))
```

预期：空数组 `[]`——字体全部走本地打包产物。

- [ ] **Step 12: 窄屏走查**

分别在 1400×900、1024×768、768×900 三档下截图，确认：
- ≥1180px：文栏 760px 靠左，页边注在右
- <1180px：页边注折到文栏下方，横向排列
- <720px：步骤栏可横向滚动，不换行不溢出

```js
async () => ({ overflowX: document.documentElement.scrollWidth > window.innerWidth + 1 })
```

三档预期均为 `false`。

- [ ] **Step 13: 提交**

```bash
cd "C:/Users/LENOVO/Desktop/haibao" && git add -A frontend && git commit -m "refactor(ui): 配色收口并清除全部 MD3 残留

color.js 从 148 行色调板生成器缩到点睛色派生；删除 ed 前缀替换后的
md3 token/组件样式与 Md3* 组件，残留计数归零。"
```

---

## 完成标准

全部任务完成后，以下五条必须同时成立：

1. `grep -rn "md3-\|Md3\|--md-" frontend/src` → **0 行**
2. `cd frontend && npm run build` → 成功
3. `node frontend/scripts/check-icons.mjs` → 通过
4. 浏览器全页断言：**无任何非零圆角、无任何 box-shadow**
5. 任务 13 Step 10 的 17 项走查全部通过

---

## 已知风险与应对

| 风险 | 应对 |
|---|---|
| dev server 掉到 5174，API 被 CORS 拦掉，页面空列表 | 先 `curl -s http://127.0.0.1:5173/ \| head -c 100` 确认 5173 是本项目；是则复用，不要另起 |
| 后端未启动 | `cd backend && node src/app.js`；需 MySQL 可用 |
| 生成海报会消耗文生图 API 额度 | 任务 10 与任务 13 涉及真实生成。若额度紧张，先只验证到进度弹窗出现 |
| 中途某屏幕卡住导致长期半迁移状态 | 每个任务独立提交且构建通过，可随时停下并回退单个 commit |
| 字体文件 2.9 MB 进仓库 | 已评估接受。若需瘦身，用 `fontTools` 按「常用 3500 字 + 项目内出现的汉字」裁剪 |
