# 珠宝节日海报生成器 (Jewelry Holiday Poster Generator)

基于 AI 的珠宝零售行业节日促销海报自动生成系统。支持正面海报、背面海报、车贴三种物料类型，通过多 AI 服务协同完成背景生成与文字排版渲染。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Vue 3.5 (Composition API + `<script setup>`) |
| 构建工具 | Vite 5.4 |
| 状态管理 | Pinia 2.2 + pinia-plugin-persistedstate |
| UI 风格 | 自定义 Material Design 3 组件 (Md3Button / Md3Card / Md3Chip / Md3TextField) |
| HTTP 客户端 | Axios |
| 后端框架 | Express 4.21 |
| 数据库 | MySQL 8.0+ (mysql2, 连接池 20) |
| 图像处理 | Sharp 0.34 (合成、缩放、SVG 转 PNG) |
| 文件上传 | Multer (磁盘存储, 10MB 限制) |

### AI 服务

| 用途 | 服务商 | 模型 |
|------|--------|------|
| 文生图 (主) | SiliconFlow | Tongyi-MAI/Z-Image-Turbo |
| 文生图 (备) | 火山引擎 ARK | Seedream 4.5 |
| 图生图增强 | 火山引擎 ARK | Seedream 5.0 |
| 文本 LLM | 小米 MiMo | mimo-v2.5-pro (Anthropic API 格式) |
| 视觉定位 | 火山引擎 | 多模态模型 (产品区域检测) |
| 背景去除 | rembg | 本地 Python 服务 (可选) |

## 项目结构

```
haibao/
├── start.bat                    # 一键启动脚本 (前端 + 后端)
├── backend/
│   ├── .env                     # 环境变量配置
│   ├── .env.example             # 环境变量模板
│   ├── package.json
│   └── src/
│       ├── app.js               # Express 入口
│       ├── routes/              # API 路由
│       │   ├── poster.js        # 海报生成 (正面/背面/车贴/增强)
│       │   ├── ai.js            # AI 文本分析
│       │   ├── brands.js        # 品牌管理
│       │   ├── festivals.js     # 节日管理
│       │   ├── discountTypes.js # 优惠类型管理
│       │   ├── merchantInfo.js  # 商户信息管理
│       │   ├── data.js          # 项目保存/加载、文件上传
│       │   ├── logo.js          # AI Logo 生成
│       │   ├── matting.js       # 抠图服务 (路由未挂载)
│       │   └── settings.js      # 系统设置
│       ├── services/            # 业务逻辑层
│       │   ├── posterRenderer.js # SVG 海报渲染引擎 (~1370 行)
│       │   ├── doubao.js        # 火山引擎 + SiliconFlow 图像生成
│       │   ├── mimo.js          # MiMo LLM 服务
│       │   ├── ernie.js         # 百度文心图像生成
│       │   ├── visionLocator.js # 视觉定位服务
│       │   ├── db.js            # MySQL 连接池
│       │   ├── configService.js # 配置管理 (DB + 文件 + 环境变量)
│       │   ├── storage.js       # JSON 文件存储
│       │   └── matting.js       # rembg 客户端
│       └── prompts/             # AI 提示词模板
│           ├── front.js         # 正面海报提示词
│           ├── back.js          # 背面海报提示词
│           ├── enhance.js       # 增强提示词
│           └── logo.js          # Logo 提示词
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.js
│       ├── App.vue              # 根组件 (顶栏、全局弹窗)
│       ├── api/index.js         # Axios 封装
│       ├── store/poster.js      # Pinia 主状态
│       ├── data/presetActivities.js  # ~160 个预设活动模板
│       ├── utils/color.js       # MD3 色彩调色板生成
│       ├── styles/              # 全局样式 + MD3 设计令牌
│       └── components/
│           ├── PosterWizard.vue      # 3 步向导容器
│           ├── PosterPreview.vue     # 海报预览 + 操作
│           ├── EnhancePanel.vue      # AI 增强面板
│           ├── steps/               # 向导步骤组件
│           └── common/              # 通用 MD3 组件
├── database/
│   ├── schema.sql               # 建表语句 (13 张表)
│   ├── seed.sql                 # 种子数据
│   └── run_migration.cjs        # 迁移脚本
└── data/                        # 运行时数据 (gitignore)
    ├── settings.json            # 用户配置的 API 密钥
    ├── custom-merchants.json    # 自定义商户数据
    ├── logos/                   # 品牌 Logo PNG
    └── uploads/                 # 上传/生成的图片 (12 小时自动清理)
```

## 快速启动

### 前置要求

- **Node.js** >= 18
- **MySQL** >= 8.0
- **npm** 或 **pnpm**

### 1. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd frontend
npm install
```

### 2. 配置环境变量

复制 `backend/.env.example` 为 `backend/.env`，填入以下配置：

```env
# MySQL 数据库
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=zbt

# 认证令牌 (可选，不设置则不启用认证)
AUTH_TOKEN=your_secret_token

# SiliconFlow (主图像生成)
SILICONFLOW_API_KEY=your_key
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
SILICONFLOW_MODEL=Tongyi-MAI/Z-Image-Turbo

# 火山引擎 ARK (备用图像生成 + 增强)
VOLC_ACCESSKEY=your_key
VOLC_SECRETKEY=your_secret
VOLC_ENDPOINT_ID_SEEDREAM45=your_endpoint
VOLC_ENDPOINT_ID_SEEDREAM50=your_endpoint

# 小米 MiMo (文本 LLM)
MIMO_API_KEY=your_key
MIMO_BASE_URL=https://token-plan-cn.xiaomimimo.com
MIMO_MODEL=mimo-v2.5-pro

# 服务端口
PORT=3001
```

### 3. 初始化数据库

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p zbt < database/seed.sql
```

或使用迁移脚本：

```bash
node database/run_migration.cjs
```

### 4. 启动服务

**方式一：一键启动 (Windows)**

```bash
start.bat
```

**方式二：分别启动**

```bash
# 后端 (默认端口 3001)
cd backend && npm run dev

# 前端 (默认端口 5173)
cd frontend && npm run dev
```

启动后访问 `http://localhost:5173`。

### 认证说明

设置 `AUTH_TOKEN` 环境变量后，所有 `/api` 接口（除 `/api/health` 和 `GET /api/settings`）需在请求头中携带令牌：

```
Authorization: Bearer your_secret_token
```

不设置 `AUTH_TOKEN` 则不启用认证，所有接口公开访问。

### 5. 可选：启动抠图服务

如需背景去除功能，启动本地 rembg 服务：

```bash
# 安装 rembg
pip install rembg[cli]

# 启动 HTTP 服务 (端口 5000)
rembg server
```

---

## 数据库表结构 (13 张表)

所有表使用 InnoDB 引擎，字符集 `utf8mb4_unicode_ci`。

### 配置类表

| 表名 | 说明 | 种子数据 | 关键字段 |
|------|------|---------|---------|
| `brands` | 珠宝品牌 | 8 条 | code(UNIQUE), name, logo_url, is_active, sort_order |
| `festivals` | 节日定义 | 33 条 | code(UNIQUE), name, primary_color, secondary_color, bg_color |
| `discount_types` | 优惠类型 (6 类 21 种) | 21 条 | code(UNIQUE), category, format_template, fields(JSON) |
| `merchants` | 商户信息模板 | 3 条 | name, address, phone, is_default |
| `festival_designs` | 节日背景设计配置 | 13 条 | festival_code(UNIQUE), color_desc, decoration_desc, prohibition |
| `visual_styles` | 视觉风格 | 8 条 | code(UNIQUE), description, bg_desc, negative_prompt |
| `art_styles` | 艺术风格迁移 | 22 条 | code(UNIQUE), prompt_text |
| `prompt_templates` | AI 提示词模板 | 0 条 | code(UNIQUE), scene, template_text, variables(JSON) |

### 业务数据表

| 表名 | 说明 | 关键字段 |
|------|------|---------|
| `poster_projects` | 海报项目 | project_code(UNIQUE), festival_code, brand_code, front/back/car_sticker_url, raw_data(JSON), status(draft/completed/archived) |
| `project_activities` | 项目关联活动 | project_id(**FK → poster_projects, CASCADE**), discount_type_code, content, highlight, field_values(JSON), image_urls(JSON) |
| `uploaded_files` | 上传文件记录 | file_name, file_path, file_url, file_size, mime_type, usage_type |

### 系统表

| 表名 | 说明 | 备注 |
|------|------|------|
| `system_config` | 系统配置 KV 存储 | 表已创建但代码未使用，与 `settings.json` 功能重叠 |
| `operation_logs` | 操作日志审计 | 表已创建但代码未写入日志 |

**注意**: 整个 schema 仅有 1 个外键 (`project_activities.project_id → poster_projects.id ON DELETE CASCADE`)，其余跨表关联 (如 `festival_code`、`brand_code`、`discount_type_code`) 全靠应用层字符串匹配，无数据库约束。

---

## 核心功能与技术实现

### 海报生成流水线

```
用户填写向导 → 前端 Pinia store 组装数据 → POST /api/poster/back
  → buildBackBgPrompt() 构造纯背景提示词
  → doubao.generateImage() 调 SiliconFlow (失败降级火山引擎 Seedream)
  → 下载 AI 图片为 Buffer
  → posterRenderer.renderBackPoster(bgBuffer, activities, ...)
      → computeLayout(): 两遍算法 (先算尺寸，再定位)
      → buildBackSvg(): 生成完整 SVG 文字层
      → sharp.composite(): SVG 文字叠到 AI 背景上
      → composeProductImages(): 产品图加金色边框再合成
  → 保存最终图 + 原始背景图 (用于后续增强)
  → 返回 URL
```

正面海报额外叠加品牌 Logo (sharp composite)，车贴类似但更简化。

### SVG 渲染引擎 (`posterRenderer.js`, ~1370 行)

- **布局算法**: 1-6 个活动模块自适应网格，两种排版模式
  - **LR (左文右图)**: 默认，文字左侧 + 产品图右侧
  - **TB (上图下文)**: 多图或长文活动，图片居上文字居下
- **字体缩放**: `fontScale = min(2.0, max(1.0, 6/rows))`，2 个活动时字号约 2 倍，6 个时保持基线
- **文本渲染特性**:
  - 价格数字自动识别 → 金色大字体加粗 (如 `928元` 中的 `928`)
  - 产品名正则匹配 → 强调色 (黄金/钻石/项链/戒指等 30+ 模式)
  - 关键词高亮 → 白底圆角徽章效果
  - 中文自动换行 → 标点禁则处理 + 价格单位保护 (不拆分 `928元`)
- **产品图装饰**: 金色线性渐变边框 + 投影 + 角饰圆点 + 内边框
- **商户信息栏**: 底部渐变背景 (透明→白→透明)
- **宽度估算**: 按 Unicode 范围估算像素宽度 (中文 `fontSize*0.95`，数字 `*0.58`，其他 `*0.5`)

### Leafer UI JSON 导出

同一套布局数据可导出为结构化 JSON 树，对接 `gzm-design` 画布编辑器：
- 每个元素标记为可拖拽可编辑
- 使用标签: `Frame`, `Group`, `Rect`, `Text`, `Image2`, `Line`
- 三个导出函数: `buildLeaferJson`(背面), `buildFrontLeaferJson`(正面), `buildCarStickerJson`(车贴)
- 文本宽度乘以 `WIDTH_BUFFER = 1.15` 补偿服务端估算误差

### AI 服务多提供商容错 (`doubao.js`)

| 操作 | 主服务商 | 备用服务商 | 超时 |
|------|---------|-----------|------|
| 文生图 | SiliconFlow (Tongyi-MAI/Z-Image-Turbo) | 火山引擎 Seedream 5.0 | 120s |
| 图生图增强 | 火山引擎 Seedream 5.0 (reference_image) | SiliconFlow (image + strength) | 180s |

尺寸适配: SiliconFlow 限制 256-2048px，生成后 sharp 放大到目标尺寸 (标准海报 2100x2970)。

### LLM 文本分析 (`mimo.js` + `ai.js`)

使用小米 MiMo v2.5 Pro (Anthropic Messages API 格式，`x-api-key` 认证)。

| 端点 | 用途 | temperature |
|------|------|------------|
| `POST /api/ai/analyze-activity` | 解析促销文案 → 结构化数据 (优惠类型/字段值/详情/高亮) | 0.1 |
| `POST /api/ai/generate-titles` | 生成海报标题 (6-15 字，保留原始数字) | 0.3 |
| `POST /api/ai/smart-fill` | 一步提取 mainTitle + subTitle | 0.1 |

JSON 解析三级容错: 直接 `JSON.parse` → 提取 ` ```json ``` ` 代码块 → 括号平衡提取。

### 提示词工程 (`front.js` / `back.js`)

- **`hexToColorName(hex)`**: 十六进制 → RGB → HSL → 中文颜色名 (14 色相区间 + 深/亮/鲜修饰词)，防止 AI 渲染颜色代码
- **13 个节日专属背景设计**: 春节 (红灯笼/祥云/爆竹/金元宝)、中秋 (满月/桂花/玉兔)、情人节 (玫瑰/心形) 等，每个含配色描述 + 装饰元素 + 禁止项
- **正面提示词**: 严格列出允许出现的文字白名单，三段式布局指令 (品牌/主题/促销)
- **背面提示词**: 纯渐变背景指令，禁止文字/边框/密集图案

### 前端向导 (Vue 3 + Pinia)

**Step 1 — 节日与品牌选择**:
- 33 个节日渲染为 MD3 Chip (彩色圆点指示主色)
- 8 个品牌 3 列网格卡片 (首字头像 + 名称 + 描述)
- 选节日后动态生成 MD3 色调调色板，CSS 变量级联更新全局 UI

**Step 2 — 正面促销配置**:
- AI 智能填充: 粘贴文案 → `POST /api/ai/smart-fill` → MiMo 提取标题
- 黑名单校验占位符 (`...`/`占位符`/`无`/`暂无`/`-`/`--`)
- 主促销必填 + 副促销可选，双向绑定自动同步 content 字段

**Step 3 — 背面活动与商户信息**:
- 最多 6 个活动，从 ~160 个预设模板选择
- 活动卡片展示: 优惠类型徽章 + 活动类型标签 + 内容预览 + 产品图缩略图
- 商户信息: 3 个默认模板 + 自定义保存 + 线内编辑
- 生成按钮触发 `Promise.all` 并行生成正面+背面，支持 AbortController 取消

**状态持久化**: `pinia-plugin-persistedstate` 保存向导状态到 localStorage，omit 列表排除瞬态字段 (generating/error/enhanced URLs)。

### 项目持久化 (`data.js`)

- **Upsert 逻辑**: `project_code` 唯一键，有则 UPDATE 无则 INSERT
- **活动采用 "删后插" 策略**: 删除旧活动 → 批量插入新活动
- **文件上传**: Multer + UUID 文件名 + JPEG/PNG/WebP 过滤 + 10MB 限制
- **自动清理**: 每次上传触发，删除 12 小时前的文件 (同步阻塞操作)

---

## API 接口

### 海报生成

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/poster/front` | 生成正面海报 (AI 全图) |
| POST | `/api/poster/front-json` | 正面海报 (返回 Leafer UI JSON) |
| POST | `/api/poster/back` | 生成背面海报 (AI 背景 + SVG 文字) |
| POST | `/api/poster/back-json` | 背面海报 (返回 Leafer UI JSON) |
| POST | `/api/poster/car-sticker` | 生成车贴 |
| POST | `/api/poster/car-sticker-json` | 车贴 (返回 Leafer UI JSON) |
| POST | `/api/poster/enhance` | AI 增强海报 (色彩/清晰度/整体) |

### AI 服务

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/analyze-activity` | 从自由文本提取促销信息 (MiMo LLM) |
| POST | `/api/ai/generate-titles` | 生成海报标题 |
| POST | `/api/ai/smart-fill` | 快速标题提取 |

### 数据管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST/PUT/DELETE | `/api/brands` | 品牌管理 (含 Logo 上传) |
| GET/POST/PUT/DELETE | `/api/festivals` | 节日管理 |
| GET/POST/PUT/DELETE | `/api/discount-types` | 优惠类型管理 |
| GET/POST/PUT/DELETE | `/api/merchant-info` | 商户信息管理 |
| POST | `/api/data/save` | 保存项目 (Upsert) |
| GET | `/api/data/load/:id` | 加载项目 |
| GET | `/api/data/list` | 项目列表 |
| POST | `/api/data/upload` | 上传文件 |
| POST | `/api/data/cleanup-uploads` | 手动清理上传文件 |
| GET | `/api/data/upload-stats` | 上传目录统计 |

### 系统

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/settings` | 获取配置 (密钥脱敏显示前 10 位) |
| PUT | `/api/settings` | 更新配置 (写入 settings.json + 覆盖 process.env + reload doubao/mimo) |
| GET | `/api/health` | 健康检查 |
| POST | `/api/matting/remove-bg` | 背景去除 |
| GET | `/api/matting/health` | 抠图服务状态 |

---

## 架构设计要点

- **多 AI 服务商容错**: 图像生成优先 SiliconFlow，失败自动降级到火山引擎 Seedream
- **混合渲染策略**: AI 全图生成 (旧模式) vs AI 背景 + SVG 精确排版 (新模式)，由 `USE_SVG_RENDER` 常量控制
- **动态色彩主题**: 选择节日后自动从主色生成 MD3 色调调色板，CSS 自定义属性级联更新全局 UI
- **提示词工程**: `hexToColorName()` 将十六进制颜色转为中文自然语言描述 (如 `#C41E3A` → "红色")，防止 AI 在图像中生成颜色代码
- **Leafer UI JSON 导出**: 海报布局可导出为结构化 JSON，对接 `gzm-design` 画布编辑器进行二次编辑
- **配置优先级**: `data/settings.json` > `process.env` (运行时覆盖) > `.env` 文件
- **增强安全策略**: 背面海报仅增强背景 (保留原始背景图用于重合成)，正面海报全图增强 (低 strength=0.2 减少文字变形)
- **Token 认证**: 可选，设置 `AUTH_TOKEN` 环境变量后所有 `/api` 接口需携带 `Authorization: Bearer <token>` (health 和 GET settings 除外)
- **DB 错误处理**: `db.query()` 连接失败和查询失败时抛异常，所有 CRUD 路由有 try/catch 兜底
- **设置热更新**: 更新配置时同时 reload `doubao` 和 `mimo` 两个 AI 服务，立即生效

---

## 运维建议

### API Key 额度管理

系统依赖多个 AI 服务，任一额度耗尽都会导致海报生成失败。以下是各服务的替代方案：

| 服务 | 用途 | 耗尽时的替代方案 |
|------|------|----------------|
| SiliconFlow | 主文生图 | 切换到火山引擎 Seedream (系统会自动降级)，或注册新 SiliconFlow 账号获取新 Key |
| 火山引擎 ARK | 备用文生图 + 图生图增强 | 重新充值，或在设置页面清空 ARK Key 仅使用 SiliconFlow |
| 小米 MiMo | 文本 LLM (标题提取/活动分析) | 替换为其他兼容 Anthropic API 格式的服务，修改 `MIMO_BASE_URL` 和 `MIMO_API_KEY` |

**快速切换方法**: 在前端设置页面 (Settings) 直接修改对应的 API Key，保存后立即生效，无需重启服务。

**建议**: 至少同时配置 SiliconFlow 和火山引擎两组 Key，互为备份。文生图是核心功能，单一服务商故障会导致整个系统不可用。

### 常见问题排查

**海报生成失败 / 超时**
1. 检查后端控制台日志，搜索 `[Doubao]` 或 `[SiliconFlow]` 开头的错误信息
2. 调用 `GET /api/health` 确认后端存活
3. 在设置页面确认对应 AI 服务的 API Key 有余额
4. 如果是图生图增强失败，检查 `data/uploads` 目录下原始背景图是否存在

**前端页面空白 / 请求全报错**
1. 确认后端端口 3001 和前端端口 5173 都在运行
2. 检查 `backend/.env` 中数据库连接配置是否正确
3. 浏览器 F12 查看 Network 面板的请求状态码：401 = 认证失败，500 = 后端异常

**数据库连接失败**
1. 确认 MySQL 服务是否在运行
2. 检查 `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD` 配置
3. 如果使用阿里云 RDS，确认 IP 白名单是否包含当前服务器

**海报生成后文字错位 / 溢出**
- 属于渲染引擎的已知限制，文本宽度是估算值而非精确测量
- 减少活动数量 (2-4 个效果最好) 或缩短活动文案长度

### 磁盘空间维护

海报生成会持续写入 `data/uploads` 目录，建议定期清理：

```bash
# 通过 API 清理 7 天前的文件
curl -X POST http://localhost:3001/api/data/cleanup-uploads \
  -H "Content-Type: application/json" \
  -d '{"days": 7}'

# 查看当前占用
curl http://localhost:3001/api/data/upload-stats
```
