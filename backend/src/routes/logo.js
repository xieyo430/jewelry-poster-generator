const express = require('express');
const router = express.Router();
const doubao = require('../services/doubao');
const { buildLogoPrompt } = require('../prompts/logo');

/**
 * POST /api/logo
 * 根据品牌名称和节日生成品牌LOGO
 * Body: { brandName, festival }
 */
router.post('/', async (req, res) => {
  try {
    const { brandName, festival } = req.body;

    if (!brandName) {
      return res.status(400).json({ error: '缺少品牌名称' });
    }

    const prompt = buildLogoPrompt(brandName, festival || '');

    const result = await doubao.generateImage({ prompt, size: '1920x1920', n: 1 });

    const imageUrl = result?.data?.[0]?.url || result?.data?.[0]?.b64_json || null;

    res.json({
      success: true,
      brandName,
      imageUrl,
      rawResult: result,
    });
  } catch (err) {
    console.error('[LOGO生成错误]', err.message);
    res.status(500).json({
      error: 'LOGO生成失败',
      detail: err.response?.data || err.message,
    });
  }
});

module.exports = router;
