const express = require('express');
const router = express.Router();
const db = require('../services/db');

// 获取所有节日（前端用）
router.get('/', async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT code AS id, name, color_scheme AS colorScheme,
              primary_color AS primaryColor,
              secondary_color AS secondaryColor,
              bg_color AS bgColor
       FROM festivals WHERE is_active = 1 ORDER BY sort_order`
    );
    res.json({ festivals: rows || [] });
  } catch (err) {
    console.error('[festivals] 查询失败:', err.message);
    res.status(500).json({ error: '查询失败' });
  }
});

// 获取全部节日（含禁用，管理用）
router.get('/all', async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT id, code, name, color_scheme AS colorScheme,
              primary_color AS primaryColor,
              secondary_color AS secondaryColor,
              bg_color AS bgColor,
              is_active AS isActive, sort_order AS sortOrder
       FROM festivals ORDER BY sort_order`
    );
    res.json({ success: true, data: rows || [] });
  } catch (err) {
    console.error('[festivals] 查询失败:', err.message);
    res.status(500).json({ error: '查询失败' });
  }
});

// 新增节日
router.post('/', async (req, res) => {
  try {
    const { code, name, color_scheme, primary_color, secondary_color, bg_color } = req.body;
    if (!code?.trim() || !name?.trim()) {
      return res.status(400).json({ error: '编码和名称不能为空' });
    }

    const existing = await db.queryOne('SELECT id FROM festivals WHERE code = ?', [code.trim()]);
    if (existing) return res.status(400).json({ error: '编码已存在' });

    const maxOrder = await db.queryOne('SELECT MAX(sort_order) AS m FROM festivals');
    const sortOrder = (maxOrder?.m || 0) + 1;

    await db.query(
      `INSERT INTO festivals (code, name, color_scheme, primary_color, secondary_color, bg_color, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [code.trim(), name.trim(), (color_scheme || '').trim(),
       primary_color || '#C41E3A', secondary_color || '#FFD700', bg_color || '#8B0000', sortOrder]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[festivals] 新增失败:', err.message);
    res.status(500).json({ error: '新增失败: ' + err.message });
  }
});

// 更新节日
router.put('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { name, color_scheme, primary_color, secondary_color, bg_color, is_active, sort_order } = req.body;

    const existing = await db.queryOne('SELECT id FROM festivals WHERE code = ?', [code]);
    if (!existing) return res.status(404).json({ error: '节日不存在' });

    const fields = [];
    const values = [];
    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (color_scheme !== undefined) { fields.push('color_scheme = ?'); values.push(color_scheme); }
    if (primary_color !== undefined) { fields.push('primary_color = ?'); values.push(primary_color); }
    if (secondary_color !== undefined) { fields.push('secondary_color = ?'); values.push(secondary_color); }
    if (bg_color !== undefined) { fields.push('bg_color = ?'); values.push(bg_color); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active ? 1 : 0); }
    if (sort_order !== undefined) { fields.push('sort_order = ?'); values.push(sort_order); }

    if (fields.length === 0) return res.json({ success: true });

    values.push(code);
    await db.query(`UPDATE festivals SET ${fields.join(', ')}, updated_at = NOW() WHERE code = ?`, values);
    res.json({ success: true });
  } catch (err) {
    console.error('[festivals] 更新失败:', err.message);
    res.status(500).json({ error: '更新失败: ' + err.message });
  }
});

// 删除节日（软删除）
router.delete('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    await db.query('UPDATE festivals SET is_active = 0, updated_at = NOW() WHERE code = ?', [code]);
    res.json({ success: true });
  } catch (err) {
    console.error('[festivals] 删除失败:', err.message);
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;
