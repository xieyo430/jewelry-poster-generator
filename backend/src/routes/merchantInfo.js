const express = require('express');
const router = express.Router();
const db = require('../services/db');

// 获取所有商家
router.get('/', async (req, res) => {
  try {
    const rows = await db.query(
      'SELECT id, name, address, phone, is_default AS isDefault FROM merchants ORDER BY is_default DESC, id ASC'
    );
    res.json({ merchantTemplates: rows || [] });
  } catch (err) {
    console.error('[merchantInfo] 查询失败:', err.message);
    res.status(500).json({ error: '查询失败' });
  }
});

// 新增自定义商家
router.post('/custom', async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '商家名称不能为空' });
    }

    const result = await db.query(
      'INSERT INTO merchants (name, address, phone, is_default) VALUES (?, ?, ?, 0)',
      [name.trim(), (address || '').trim(), (phone || '').trim()]
    );

    const merchant = {
      id: result.insertId,
      name: name.trim(),
      address: (address || '').trim(),
      phone: (phone || '').trim(),
      isDefault: 0,
    };
    res.json({ success: true, merchant });
  } catch (err) {
    console.error('[merchantInfo] 新增失败:', err.message);
    res.status(500).json({ error: '添加失败: ' + err.message });
  }
});

// 更新商家
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone } = req.body;

    const merchant = await db.queryOne('SELECT id FROM merchants WHERE id = ?', [id]);
    if (!merchant) return res.status(404).json({ error: '商家不存在' });

    const fields = [];
    const values = [];
    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (address !== undefined) { fields.push('address = ?'); values.push(address); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }

    if (fields.length === 0) return res.json({ success: true });

    values.push(id);
    await db.query(`UPDATE merchants SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    console.error('[merchantInfo] 更新失败:', err.message);
    res.status(500).json({ error: '更新失败: ' + err.message });
  }
});

// 删除自定义商家
router.delete('/custom/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const merchant = await db.queryOne(
      'SELECT id, is_default FROM merchants WHERE id = ?',
      [id]
    );

    if (!merchant) {
      return res.status(404).json({ error: '商家不存在' });
    }
    if (merchant.is_default) {
      return res.status(403).json({ error: '默认商家不能删除' });
    }

    await db.query('DELETE FROM merchants WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[merchantInfo] 删除失败:', err.message);
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;
