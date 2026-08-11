const express = require('express');
const router = express.Router();
const db = require('../services/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 图片上传配置
const UPLOAD_DIR = path.join(__dirname, '../../../data/uploads');
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024;

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
 * 保存海报项目到数据库
 */
router.post('/save', async (req, res) => {
  try {
    const { projectId, projectCode, title, materialType, festivalCode, brandCode,
            startDate, endDate, theme, subtitle, frontPosterUrl, backPosterUrl,
            backBgUrl, carStickerUrl, activities, merchantInfo, rawData } = req.body;

    const code = projectCode || projectId || `project_${Date.now()}`;

    // 查找已有项目
    const existing = await db.queryOne(
      'SELECT id FROM poster_projects WHERE project_code = ?', [code]
    );

    if (existing) {
      // 更新
      await db.query(
        `UPDATE poster_projects SET
          title=?, material_type=?, festival_code=?, brand_code=?,
          start_date=?, end_date=?, theme=?, subtitle=?,
          front_poster_url=?, back_poster_url=?, back_bg_url=?, car_sticker_url=?,
          raw_data=?, status='completed', updated_at=NOW()
         WHERE project_code=?`,
        [title || '', materialType || 'poster', festivalCode || null, brandCode || null,
         startDate || null, endDate || null, theme || '', subtitle || '',
         frontPosterUrl || null, backPosterUrl || null, backBgUrl || null, carStickerUrl || null,
         JSON.stringify(rawData || req.body), code]
      );

      // 更新活动：先删后插
      if (activities && activities.length > 0) {
        await db.query('DELETE FROM project_activities WHERE project_id = ?', [existing.id]);
        for (let i = 0; i < activities.length; i++) {
          const a = activities[i];
          await db.query(
            `INSERT INTO project_activities
              (project_id, discount_type_code, activity_type, discount_detail, content, highlight, field_values, image_urls, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [existing.id, a.discountType || '', a.type || '', a.discountDetail || '',
             a.content || '', a.highlight || null,
             JSON.stringify(a.fieldValues || null), JSON.stringify(a.imageUrls || null), i]
          );
        }
      }

      res.json({ success: true, projectId: code });
    } else {
      // 新建
      const result = await db.query(
        `INSERT INTO poster_projects
          (project_code, title, material_type, festival_code, brand_code,
           start_date, end_date, theme, subtitle,
           front_poster_url, back_poster_url, back_bg_url, car_sticker_url,
           raw_data, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
        [code, title || '', materialType || 'poster', festivalCode || null, brandCode || null,
         startDate || null, endDate || null, theme || '', subtitle || '',
         frontPosterUrl || null, backPosterUrl || null, backBgUrl || null, carStickerUrl || null,
         JSON.stringify(rawData || req.body)]
      );

      if (result && activities && activities.length > 0) {
        for (let i = 0; i < activities.length; i++) {
          const a = activities[i];
          await db.query(
            `INSERT INTO project_activities
              (project_id, discount_type_code, activity_type, discount_detail, content, highlight, field_values, image_urls, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [result.insertId, a.discountType || '', a.type || '', a.discountDetail || '',
             a.content || '', a.highlight || null,
             JSON.stringify(a.fieldValues || null), JSON.stringify(a.imageUrls || null), i]
          );
        }
      }

      res.json({ success: true, projectId: code });
    }
  } catch (err) {
    console.error('[保存数据错误]', err.message);
    res.status(500).json({ error: '保存失败', detail: err.message });
  }
});

/**
 * GET /api/data/load/:projectId
 * 从数据库加载项目
 */
router.get('/load/:projectId', async (req, res) => {
  try {
    const project = await db.queryOne(
      'SELECT * FROM poster_projects WHERE project_code = ?', [req.params.projectId]
    );
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }

    const activities = await db.query(
      'SELECT * FROM project_activities WHERE project_id = ? ORDER BY sort_order', [project.id]
    );

    res.json({
      success: true,
      data: {
        ...project,
        activities: activities || [],
      },
    });
  } catch (err) {
    res.status(500).json({ error: '加载失败', detail: err.message });
  }
});

/**
 * GET /api/data/list
 * 列出所有项目
 */
router.get('/list', async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT project_code AS id, title, material_type AS materialType,
              festival_code AS festivalCode, brand_code AS brandCode,
              front_poster_url AS frontPosterUrl, status, created_at AS createdAt
       FROM poster_projects ORDER BY created_at DESC LIMIT 100`
    );
    res.json({ success: true, projects: rows || [] });
  } catch (err) {
    res.status(500).json({ error: '列表获取失败', detail: err.message });
  }
});

/**
 * POST /api/data/upload
 * 上传活动图片，保存到磁盘，返回可访问的URL
 * 每次上传时自动清理12小时前的旧文件（异步，不阻塞响应）
 */
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未上传文件' });
  }

  try {
    // 异步清理，不阻塞上传响应
    autoCleanupUploads().catch(e => console.error('[Upload] 自动清理失败:', e.message));

    const url = `/uploads/${req.file.filename}`;
    res.json({ success: true, url, originalName: req.file.originalname });
  } catch (err) {
    console.error('[Upload] 失败:', err.message);
    res.status(500).json({ error: '图片处理失败' });
  }
});

/**
 * 自动清理：删除12小时前的上传文件（异步，不阻塞事件循环）
 */
async function autoCleanupUploads() {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) return;
    const cutoff = Date.now() - 12 * 60 * 60 * 1000;
    const files = await fs.promises.readdir(UPLOAD_DIR);
    let cleaned = 0;
    for (const file of files) {
      try {
        const fp = path.join(UPLOAD_DIR, file);
        const stat = await fs.promises.stat(fp);
        if (stat.isFile() && stat.mtimeMs < cutoff) {
          await fs.promises.unlink(fp);
          cleaned++;
        }
      } catch { /* skip */ }
    }
    if (cleaned > 0) console.log(`[Upload] 自动清理 ${cleaned} 个过期文件`);
  } catch (e) {
    console.error('[Upload] 自动清理失败:', e.message);
  }
}

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

/**
 * POST /api/data/cleanup-uploads
 * 清理过期的上传文件
 * Body: { days: number } 默认清理7天前的文件
 */
router.post('/cleanup-uploads', async (req, res) => {
  try {
    const days = parseInt(req.body.days) || 7;
    // days=0 表示清理所有文件，否则清理指定天数前的文件
    const cutoffTime = days === 0 ? Date.now() + 1000 : Date.now() - days * 24 * 60 * 60 * 1000;

    if (!fs.existsSync(UPLOAD_DIR)) {
      return res.json({ success: true, deleted: 0, message: '上传目录不存在' });
    }

    const files = await fs.promises.readdir(UPLOAD_DIR);
    let deleted = 0;
    let freedSpace = 0;

    for (const file of files) {
      const filePath = path.join(UPLOAD_DIR, file);
      try {
        const stat = await fs.promises.stat(filePath);
        if (stat.mtimeMs < cutoffTime) {
          freedSpace += stat.size;
          await fs.promises.unlink(filePath);
          deleted++;
        }
      } catch (e) {
        console.error('[Cleanup] 删除文件失败:', file, e.message);
      }
    }

    const freedMB = (freedSpace / 1024 / 1024).toFixed(2);
    res.json({
      success: true,
      deleted,
      freedSpace: `${freedMB} MB`,
      message: `已清理 ${deleted} 个 ${days} 天前的文件，释放 ${freedMB} MB 空间`,
    });
  } catch (err) {
    console.error('[Cleanup] 清理失败:', err.message);
    res.status(500).json({ error: '清理失败: ' + err.message });
  }
});

/**
 * GET /api/data/upload-stats
 * 查看上传目录统计
 */
router.get('/upload-stats', async (req, res) => {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      return res.json({ success: true, count: 0, totalSize: '0 MB' });
    }

    const files = await fs.promises.readdir(UPLOAD_DIR);
    let totalSize = 0;

    for (const file of files) {
      try {
        const stat = await fs.promises.stat(path.join(UPLOAD_DIR, file));
        totalSize += stat.size;
      } catch (e) {
        // ignore
      }
    }

    res.json({
      success: true,
      count: files.length,
      totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
    });
  } catch (err) {
    res.status(500).json({ error: '获取统计失败: ' + err.message });
  }
});

module.exports = router;
