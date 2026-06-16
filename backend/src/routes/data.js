const express = require('express');
const router = express.Router();
const storage = require('../services/storage');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 图片上传配置
const UPLOAD_DIR = path.join(__dirname, '../../../data/uploads');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const uploadStorage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 JPG、PNG、WebP 格式的图片'), false);
  }
};

const upload = multer({
  storage: uploadStorage,
  fileFilter,
  limits: { fileSize: MAX_SIZE }
});

/**
 * POST /api/data/save
 * 保存海报项目数据
 */
router.post('/save', async (req, res) => {
  try {
    const { projectId, ...data } = req.body;
    const key = projectId || `project_${Date.now()}`;
    await storage.save(key, { ...data, updatedAt: new Date().toISOString() });
    res.json({ success: true, projectId: key });
  } catch (err) {
    console.error('[保存数据错误]', err.message);
    res.status(500).json({ error: '保存失败', detail: err.message });
  }
});

/**
 * GET /api/data/load/:projectId
 * 加载海报项目数据
 */
router.get('/load/:projectId', async (req, res) => {
  try {
    const data = await storage.load(req.params.projectId);
    if (!data) {
      return res.status(404).json({ error: '项目不存在' });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: '加载失败', detail: err.message });
  }
});

/**
 * GET /api/data/list
 * 列出所有保存的项目
 */
router.get('/list', async (req, res) => {
  try {
    const list = await storage.list();
    res.json({ success: true, projects: list });
  } catch (err) {
    res.status(500).json({ error: '列表获取失败', detail: err.message });
  }
});

/**
 * POST /api/data/upload
 * 上传活动图片
 */
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未上传文件' });
  }
  const fileId = uuidv4();
  const url = `/uploads/${req.file.filename}`;
  res.json({ success: true, fileId, url, originalName: req.file.originalname });
});

// multer错误处理
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '文件大小不能超过10MB' });
    }
    return res.status(400).json({ error: `上传错误: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;
