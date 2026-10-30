const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const doubao = require('../services/doubao');
const deepseek = require('../services/deepseek');
const { CONFIG_FIELDS } = require('../configFields');

const SETTINGS_FILE = path.join(__dirname, '../../../data/settings.json');
const ENV_FILE = path.join(__dirname, '../../.env');

function maskKey(val) {
  if (!val) return '';
  if (val.length <= 4) return '****';
  return '****' + val.slice(-4);
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

// 每次 PUT 最多读盘解析一次（清除多个字段时共用同一份映射）
function readEnvFile() {
  try {
    if (fs.existsSync(ENV_FILE)) {
      return require('dotenv').parse(fs.readFileSync(ENV_FILE));
    }
  } catch (e) {
    console.error('[Settings] 读取 .env 默认值失败:', e.message);
  }
  return {};
}

// 启动时调用：用 settings.json 覆盖 process.env
function applySettings() {
  const saved = loadSettings();
  for (const [key, val] of Object.entries(saved)) {
    if (val !== undefined && val !== null && val !== '') {
      process.env[key] = val;
    }
  }
  // 服务实例是在 require('../services/xxx') 那一刻按当时的环境变量构造的，
  // 而这里（app.js 第 55 行）已经是 require 之后，只改 process.env 追不上已构造的实例。
  // 不显式重载的话，settings.json 里的 Key / 模型 ID 在启动阶段完全不生效，
  // 实际用的是 .env 的旧值——表现为「保存过的配置重启后失效」。
  doubao.reload();
  deepseek.reload();
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
    const envDefaults = readEnvFile();

    for (const [key, val] of Object.entries(updates)) {
      if (!validKeys.has(key)) continue;
      if (val === '' || val === null) {
        delete saved[key];
        const envDefault = envDefaults[key];
        if (envDefault === undefined) delete process.env[key];
        else process.env[key] = envDefault;
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
