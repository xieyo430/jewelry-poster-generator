/**
 * 抠图相关API路由
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mattingService = require('../services/matting');

const UPLOAD_DIR = path.join(__dirname, '../../../data/uploads');
const MATTED_DIR = path.join(__dirname, '../../../data/matted');

// 文件上传配置
const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

/**
 * POST /api/matting/remove-bg
 * 上传图片并抠图
 */
router.post('/remove-bg', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未上传文件' });
  }

  try {
    const sourcePath = req.file.path;
    const mattedBuffer = await mattingService.removeBackgroundFromFile(sourcePath);

    const mattedFilename = `matted_${uuidv4()}.png`;
    const mattedPath = path.join(MATTED_DIR, mattedFilename);
    require('fs').writeFileSync(mattedPath, mattedBuffer);

    res.json({
      success: true,
      originalUrl: `/uploads/${req.file.filename}`,
      mattedUrl: `/matted/${mattedFilename}`
    });
  } catch (err) {
    console.error('[抠图错误]', err.message);
    res.status(500).json({ error: '抠图失败', detail: err.message });
  }
});

/**
 * POST /api/matting/remove-bg-url
 * 根据已上传的图片URL进行抠图
 */
router.post('/remove-bg-url', async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: '缺少imageUrl参数' });
  }

  try {
    const mattedUrl = await mattingService.removeBackgroundAndSave(imageUrl);
    res.json({ success: true, mattedUrl });
  } catch (err) {
    console.error('[抠图错误]', err.message);
    res.status(500).json({ error: '抠图失败', detail: err.message });
  }
});

/**
 * GET /api/matting/health
 * 健康检查
 */
router.get('/health', async (req, res) => {
  const available = await mattingService.isAvailable();
  res.json({
    status: available ? 'ok' : 'unavailable',
    service: 'rembg'
  });
});

module.exports = router;
