const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const doubao = require('../services/doubao');
const deepseek = require('../services/deepseek');

const SETTINGS_FILE = path.join(__dirname, '../../../data/settings.json');

const CONFIG_FIELDS = [
  { key: 'ARK_API_KEY', label: 'ARK API Key', group: '火山引擎 ARK', type: 'password' },
  { key: 'ARK_BASE_URL', label: 'ARK 接入地址', group: '火山引擎 ARK', type: 'text' },
  { key: 'IMAGE_MODEL_ID', label: '文生图端点 ID', group: '火山引擎 ARK', type: 'text' },
  { key: 'ENHANCE_MODEL_ID', label: '图生图端点 ID (Seedream 5.0)', group: '火山引擎 ARK', type: 'text' },
  { key: 'SILICONFLOW_API_KEY', label: 'SiliconFlow API Key', group: '硅基流动', type: 'password' },
  { key: 'SILICONFLOW_BASE_URL', label: 'SiliconFlow 接入地址', group: '硅基流动', type: 'text' },
  { key: 'SILICONFLOW_IMAGE_MODEL', label: '图像模型', group: '硅基流动', type: 'text' },
  { key: 'DEEPSEEK_API_KEY', label: 'DeepSeek API Key', group: 'DeepSeek', type: 'password' },
  { key: 'DEEPSEEK_BASE_URL', label: 'DeepSeek 接入地址', group: 'DeepSeek', type: 'text' },
  { key: 'DEEPSEEK_MODEL_ID', label: 'DeepSeek 模型 ID', group: 'DeepSeek', type: 'text' },
];

function maskKey(val) {
  if (!val || val.length <= 10) return val || '';
  return val.slice(0, 10) + '***';
}

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[Settings] 加载失败:', e.message);
  }
  return {};
}

function saveSettings(data) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// 启动时调用：用 settings.json 覆盖 process.env
function applySettings() {
  const saved = loadSettings();
  for (const [key, val] of Object.entries(saved)) {
    if (val !== undefined && val !== null && val !== '') {
      process.env[key] = val;
    }
  }
  return saved;
}

/**
 * GET /api/settings
 * 返回当前配置（API Key 脱敏）
 */
router.get('/', (req, res) => {
  const saved = loadSettings();
  const groups = {};

  for (const field of CONFIG_FIELDS) {
    const rawVal = saved[field.key] ?? process.env[field.key] ?? '';
    const displayVal = field.type === 'password' ? maskKey(rawVal) : rawVal;
    if (!groups[field.group]) groups[field.group] = [];
    groups[field.group].push({
      key: field.key,
      label: field.label,
      value: displayVal,
      type: field.type,
      hasValue: !!rawVal,
    });
  }

  res.json({ success: true, groups, fields: CONFIG_FIELDS });
});

/**
 * PUT /api/settings
 * Body: { ARK_API_KEY: "xxx", ... }  — 只传需要更新的字段
 * 空字符串表示清除该字段（恢复 .env 默认）
 */
router.put('/', (req, res) => {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: '无效的请求体' });
    }

    const saved = loadSettings();
    const validKeys = new Set(CONFIG_FIELDS.map(f => f.key));

    for (const [key, val] of Object.entries(updates)) {
      if (!validKeys.has(key)) continue;
      if (val === '' || val === null) {
        delete saved[key];
        delete process.env[key];
      } else {
        saved[key] = val;
        process.env[key] = val;
      }
    }

    saveSettings(saved);
    doubao.reload();
    deepseek.reload();

    res.json({ success: true, message: '设置已保存' });
  } catch (err) {
    console.error('[Settings] 保存失败:', err.message);
    res.status(500).json({ error: '保存失败: ' + err.message });
  }
});

module.exports = router;
module.exports.applySettings = applySettings;
