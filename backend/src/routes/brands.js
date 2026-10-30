const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../services/db');

// LOGO上传配置
const LOGO_DIR = path.join(__dirname, '../../../data/logos');
if (!fs.existsSync(LOGO_DIR)) fs.mkdirSync(LOGO_DIR, { recursive: true });

const logoStorage = multer.diskStorage({
  destination: LOGO_DIR,
  filename: (req, file, cb) => {
    cb(null, `${safeBasename(req.params.code)}.png`);
  }
});
const logoUpload = multer({
  storage: logoStorage,
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('只支持 JPG、PNG、WebP 格式'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// 获取所有品牌（前端用）
router.get('/', async (req, res) => {
  try {
    const rows = await db.query(
      'SELECT code AS id, name, description FROM brands WHERE is_active = 1 ORDER BY sort_order'
    );
    res.json({ brands: rows || [] });
  } catch (err) {
    console.error('[brands] 查询失败:', err.message);
    res.status(500).json({ error: '查询失败' });
  }
});

// 获取全部品牌（含禁用，管理用）
router.get('/all', async (req, res) => {
  try {
    const rows = await db.query(
      'SELECT id, code, name, description, is_active AS isActive, sort_order AS sortOrder FROM brands ORDER BY sort_order'
    );
    res.json({ success: true, data: rows || [] });
  } catch (err) {
    console.error('[brands] 查询失败:', err.message);
    res.status(500).json({ error: '查询失败' });
  }
});

// 新增品牌
router.post('/', async (req, res) => {
  try {
    const { code, name, description } = req.body;
    if (!code?.trim() || !name?.trim()) {
      return res.status(400).json({ error: '编码和名称不能为空' });
    }

    const existing = await db.queryOne('SELECT id FROM brands WHERE code = ?', [code.trim()]);
    if (existing) return res.status(400).json({ error: '编码已存在' });

    const maxOrder = await db.queryOne('SELECT MAX(sort_order) AS m FROM brands');
    const sortOrder = (maxOrder?.m || 0) + 1;

    await db.query(
      'INSERT INTO brands (code, name, description, sort_order) VALUES (?, ?, ?, ?)',
      [code.trim(), name.trim(), (description || '').trim(), sortOrder]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[brands] 新增失败:', err.message);
    res.status(500).json({ error: '新增失败: ' + err.message });
  }
});

// 更新品牌
router.put('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { name, description, is_active, sort_order } = req.body;

    const existing = await db.queryOne('SELECT id FROM brands WHERE code = ?', [code]);
    if (!existing) return res.status(404).json({ error: '品牌不存在' });

    const fields = [];
    const values = [];
    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active ? 1 : 0); }
    if (sort_order !== undefined) { fields.push('sort_order = ?'); values.push(sort_order); }

    if (fields.length === 0) return res.json({ success: true });

    values.push(code);
    await db.query(`UPDATE brands SET ${fields.join(', ')}, updated_at = NOW() WHERE code = ?`, values);
    res.json({ success: true });
  } catch (err) {
    console.error('[brands] 更新失败:', err.message);
    res.status(500).json({ error: '更新失败: ' + err.message });
  }
});

// 删除品牌（软删除）
router.delete('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    await db.query('UPDATE brands SET is_active = 0, updated_at = NOW() WHERE code = ?', [code]);
    res.json({ success: true });
  } catch (err) {
    console.error('[brands] 删除失败:', err.message);
    res.status(500).json({ error: '删除失败' });
  }
});

// 上传品牌LOGO
router.post('/:code/logo', logoUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未上传文件' });
  res.json({ success: true, url: `/api/brands/${req.params.code}/logo?t=${Date.now()}` });
});

function safeBasename(str) {
  return path.basename(String(str)).replace(/[^a-zA-Z0-9_-]/g, '');
}

// 获取品牌LOGO
router.get('/:code/logo', (req, res) => {
  const logoPath = path.join(LOGO_DIR, `${safeBasename(req.params.code)}.png`);
  if (!fs.existsSync(logoPath)) return res.status(404).json({ error: 'LOGO不存在' });
  res.sendFile(logoPath);
});

// 删除品牌LOGO
router.delete('/:code/logo', (req, res) => {
  const logoPath = path.join(LOGO_DIR, `${safeBasename(req.params.code)}.png`);
  if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);
  res.json({ success: true });
});

module.exports = router;
