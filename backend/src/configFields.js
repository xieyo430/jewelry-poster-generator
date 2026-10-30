/**
 * 配置字段单一事实源
 * ------------------------------------------------------------------
 * 同一份字段表驱动三处，避免 .env.example / 设置页 / 文档再次漂移：
 *   1. 设置页表单 + PUT 白名单（CONFIG_FIELDS，inSettings=true）
 *   2. scripts/genEnvExample.js 生成 .env.example（全部字段）
 *   3. README 环境变量表
 * 新增/删除配置项只改本文件，然后执行 npm run gen:env。
 */

// 设置页可写字段（出现在 GET/PUT /api/settings）
const SETTINGS_FIELDS = [
  // ---- 火山引擎 ARK：主力文生图 + 图生图增强 ----
  { key: 'ARK_API_KEY', label: 'ARK API Key', group: '火山引擎 ARK', type: 'password' },
  { key: 'ARK_BASE_URL', label: 'ARK 接入地址', group: '火山引擎 ARK', type: 'text', default: 'https://ark.cn-beijing.volces.com/api/v3' },
  { key: 'IMAGE_MODEL_ID', label: '文生图端点 ID', group: '火山引擎 ARK', type: 'text', example: 'doubao-seedream-...' },
  { key: 'ENHANCE_MODEL_ID', label: '图生图端点 ID (Seedream 5.0)', group: '火山引擎 ARK', type: 'text', example: 'doubao-seedream-5-0-...' },

  // ---- 硅基流动：备用文生图 ----
  { key: 'SILICONFLOW_API_KEY', label: 'SiliconFlow API Key', group: '硅基流动', type: 'password' },
  { key: 'SILICONFLOW_BASE_URL', label: 'SiliconFlow 接入地址', group: '硅基流动', type: 'text', default: 'https://api.siliconflow.cn/v1' },
  { key: 'SILICONFLOW_IMAGE_MODEL', label: '图像模型', group: '硅基流动', type: 'text', default: 'baidu/ERNIE-Image-Turbo' },

  // ---- DeepSeek：文本 LLM ----
  { key: 'DEEPSEEK_API_KEY', label: 'DeepSeek API Key', group: 'DeepSeek', type: 'password' },
  { key: 'DEEPSEEK_BASE_URL', label: 'DeepSeek 接入地址', group: 'DeepSeek', type: 'text', default: 'https://api.deepseek.com' },
  { key: 'DEEPSEEK_MODEL_ID', label: 'DeepSeek 模型 ID', group: 'DeepSeek', type: 'text', default: 'deepseek-v4-flash' },
]

// 仅 .env 使用、不进设置页的基础设施字段（按 section 分组渲染）
const ENV_ONLY_FIELDS = [
  { key: 'DB_HOST', section: '数据库配置', default: '127.0.0.1' },
  { key: 'DB_PORT', section: '数据库配置', default: '3306' },
  { key: 'DB_USER', section: '数据库配置', default: 'root' },
  { key: 'DB_PASSWORD', section: '数据库配置', default: '' },
  { key: 'DB_NAME', section: '数据库配置', default: 'haibao' },
  { key: 'PORT', section: '服务', default: '3001' },
  { key: 'AUTH_TOKEN', section: '服务', default: '', note: '生产环境必须设置；由 nginx 在反代时注入，浏览器不接触' },
]

const CONFIG_FIELDS = SETTINGS_FIELDS.map(f => ({ inSettings: true, ...f }))

module.exports = { CONFIG_FIELDS, SETTINGS_FIELDS, ENV_ONLY_FIELDS }
