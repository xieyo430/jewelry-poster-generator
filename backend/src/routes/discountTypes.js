const express = require('express');
const router = express.Router();
const db = require('../services/db');

// 获取所有优惠类型（前端用）
router.get('/', async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT code AS id, name, category,
              short_desc AS shortDesc,
              fields,
              format_template AS format,
              input_prompts AS inputPrompts
       FROM discount_types WHERE is_active = 1 ORDER BY sort_order`
    );
    const result = (rows || []).map(r => ({
      ...r,
      fields: typeof r.fields === 'string' ? JSON.parse(r.fields) : r.fields,
    }));
    res.json({ discountTypes: result });
  } catch (err) {
    console.error('[discountTypes] 查询失败:', err.message);
    res.status(500).json({ error: '查询失败' });
  }
});

// 获取全部优惠类型（含禁用，管理用）
router.get('/all', async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT id, code, name, category,
              short_desc AS shortDesc,
              format_template AS formatTemplate,
              input_prompts AS inputPrompts,
              fields,
              is_active AS isActive, sort_order AS sortOrder
       FROM discount_types ORDER BY sort_order`
    );
    const result = (rows || []).map(r => ({
      ...r,
      fields: typeof r.fields === 'string' ? JSON.parse(r.fields) : r.fields,
    }));
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[discountTypes] 查询失败:', err.message);
    res.status(500).json({ error: '查询失败' });
  }
});

// 新增优惠类型
router.post('/', async (req, res) => {
  try {
    const { code, name, category, short_desc, format_template, input_prompts, fields } = req.body;
    if (!code?.trim() || !name?.trim()) {
      return res.status(400).json({ error: '编码和名称不能为空' });
    }

    const existing = await db.queryOne('SELECT id FROM discount_types WHERE code = ?', [code.trim()]);
    if (existing) return res.status(400).json({ error: '编码已存在' });

    const maxOrder = await db.queryOne('SELECT MAX(sort_order) AS m FROM discount_types');
    const sortOrder = (maxOrder?.m || 0) + 1;

    await db.query(
      `INSERT INTO discount_types (code, name, category, short_desc, format_template, input_prompts, fields, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [code.trim(), name.trim(), (category || '').trim(), (short_desc || '').trim(),
       (format_template || '').trim(), (input_prompts || '').trim(),
       JSON.stringify(fields || []), sortOrder]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[discountTypes] 新增失败:', err.message);
    res.status(500).json({ error: '新增失败: ' + err.message });
  }
});

// 更新优惠类型
router.put('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { name, category, short_desc, format_template, input_prompts, fields, is_active, sort_order } = req.body;

    const existing = await db.queryOne('SELECT id FROM discount_types WHERE code = ?', [code]);
    if (!existing) return res.status(404).json({ error: '优惠类型不存在' });

    const updateFields = [];
    const values = [];
    if (name !== undefined) { updateFields.push('name = ?'); values.push(name); }
    if (category !== undefined) { updateFields.push('category = ?'); values.push(category); }
    if (short_desc !== undefined) { updateFields.push('short_desc = ?'); values.push(short_desc); }
    if (format_template !== undefined) { updateFields.push('format_template = ?'); values.push(format_template); }
    if (input_prompts !== undefined) { updateFields.push('input_prompts = ?'); values.push(input_prompts); }
    if (fields !== undefined) { updateFields.push('fields = ?'); values.push(JSON.stringify(fields)); }
    if (is_active !== undefined) { updateFields.push('is_active = ?'); values.push(is_active ? 1 : 0); }
    if (sort_order !== undefined) { updateFields.push('sort_order = ?'); values.push(sort_order); }

    if (updateFields.length === 0) return res.json({ success: true });

    values.push(code);
    await db.query(`UPDATE discount_types SET ${updateFields.join(', ')}, updated_at = NOW() WHERE code = ?`, values);
    res.json({ success: true });
  } catch (err) {
    console.error('[discountTypes] 更新失败:', err.message);
    res.status(500).json({ error: '更新失败: ' + err.message });
  }
});

// 删除优惠类型（软删除）
router.delete('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    await db.query('UPDATE discount_types SET is_active = 0, updated_at = NOW() WHERE code = ?', [code]);
    res.json({ success: true });
  } catch (err) {
    console.error('[discountTypes] 删除失败:', err.message);
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;
