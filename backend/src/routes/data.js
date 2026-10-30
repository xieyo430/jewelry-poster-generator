const express = require('express');
const router = express.Router();
const db = require('../services/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { UPLOAD_DIR, PERSISTENT_DIR, findLocalFile } = require('../services/imageStore');

function parseJsonValue(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return {}; }
}

function resolveListName(items, id) {
  if (!Array.isArray(items) || !id) return '';
  return items.find(item => item.id === id || item.code === id)?.name || '';
}

const foodModeLabel = (mode) =>
  mode === 'combo' ? '套餐促销' : mode === 'store-event' ? '门店活动' : '招牌菜推广';
const foodFocus = (food) =>
  food.mode === 'combo' ? food.setContents : food.mode === 'store-event' ? food.eventType : food.dishName;

function buildProjectSummary(project, rawData) {
  const industry = rawData.industry
    || (project.materialType === 'food' ? 'food' : '')
    || (project.materialType === 'electronics' ? 'electronics' : '')
    || 'jewelry';
  const food = rawData.foodCampaign || {};
  const electronics = rawData.electronicsCampaign || {};
  const merchant = rawData.merchantInfo || {};
  const brandName = industry === 'jewelry'
    ? resolveListName(rawData.brands, rawData.brand) || rawData.customBrandName || ''
    : rawData.customBrandName || '';
  const festivalName = resolveListName(rawData.festivals, rawData.festival) || project.festivalCode || '';
  const focus = industry === 'food'
    ? foodFocus(food)
    : industry === 'electronics' ? electronics.productName : rawData.theme || rawData.mainPromotion?.mainTitle || '';
  const mainContent = rawData.mainPromotion?.content || rawData.mainPromotion?.mainTitle || '';
  const keyValues = industry === 'food'
    ? [
        ['经营目标', foodModeLabel(food.mode)],
        ['卖点', food.sellingPoints || food.dishDescription],
        ['优惠', food.promoPrice || food.gift || food.eventRule],
        ['行动', food.actionText || food.serviceMode],
      ]
    : industry === 'electronics'
      ? [
          ['产品', electronics.productName],
          ['卖点', electronics.sellingPoints || electronics.productDescription],
          ['优惠', electronics.promotionValue],
          ['服务', electronics.service],
        ]
      : [
          ['节日', festivalName],
          ['主爆点', mainContent],
          ['活动', Array.isArray(rawData.activities) ? `${rawData.activities.length} 个` : ''],
        ];
  const dateRange = rawData.startDate || rawData.endDate
    ? `${rawData.startDate || '未填写'}${rawData.endDate ? ` 至 ${rawData.endDate}` : ''}`
    : '';
  const commonDetails = [
    ['所属行业', industry === 'food' ? '餐饮美食' : industry === 'electronics' ? '数码家电' : '珠宝首饰'],
    ['品牌名称', brandName],
    ['商家名称', merchant.name],
    ['店铺地址', merchant.address],
    ['联系电话', merchant.phone],
    ['活动日期', dateRange],
  ];
  const industryDetails = industry === 'food'
    ? [
        ['经营目标', foodModeLabel(food.mode)],
        ['菜品 / 套餐', food.mode === 'combo' ? food.setContents : food.dishName],
        ['菜品描述', food.dishDescription],
        ['卖点', food.sellingPoints],
        ['优惠价格', food.promoPrice],
        ['活动规则', food.eventRule],
        ['赠品', food.gift],
        ['到店行动', food.actionText],
        ['服务方式', food.serviceMode],
      ]
    : industry === 'electronics'
      ? [
          ['产品名称', electronics.productName],
          ['产品描述', electronics.productDescription],
          ['卖点', electronics.sellingPoints],
          ['优惠类型', electronics.promotionType],
          ['优惠内容', electronics.promotionValue],
          ['产品特性', electronics.features],
          ['服务信息', electronics.service],
        ]
      : [
          ['节日主题', festivalName],
          ['活动主题', rawData.theme],
          ['优惠副标题', rawData.subtitle],
          ['主爆点', rawData.mainPromotion?.content || rawData.mainPromotion?.mainTitle],
          ['次爆点', rawData.secondaryPromotion?.content || rawData.secondaryPromotion?.mainTitle],
          ['活动数量', Array.isArray(rawData.activities) ? `${rawData.activities.length} 个` : ''],
        ];
  const activityDetails = Array.isArray(rawData.activities)
    ? rawData.activities.flatMap((activity, index) => [
        [`活动 ${index + 1}`, activity.discountDetail || activity.type || '未命名活动'],
        [`活动 ${index + 1}内容`, activity.content],
        [`活动 ${index + 1}亮点`, activity.highlight],
      ])
    : [];

  return {
    industry,
    brandName,
    merchantName: merchant.name || '',
    festivalName,
    focus: focus || '',
    theme: rawData.theme || '',
    startDate: rawData.startDate || project.startDate || '',
    endDate: rawData.endDate || project.endDate || '',
    activityCount: Array.isArray(rawData.activities) ? rawData.activities.length : 0,
    keyValues: keyValues.filter(([, value]) => value),
    details: [...commonDetails, ...industryDetails, ...activityDetails].filter(([, value]) => value),
  };
}

// 图片上传配置
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024;
const PERSISTED_PREFIXES = ['poster_front_', 'poster_back_', 'car_sticker_', 'poster_enhanced_'];

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

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
// 保存项目时把图片收敛到持久目录 data/posters（TTL 清理只扫 data/uploads）。
// 返回 { url, file }：file 是本次新写入的绝对路径，事务失败时由调用方删除孤儿文件。
async function persistImageUrl(url, prefix) {
  if (!url || typeof url !== 'string') return { url: null, file: null };

  if (url.startsWith('data:')) {
    const match = url.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\r\n]+)$/i);
    if (!match) throw badRequest('图片数据格式不正确，请重新生成后再保存');
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > MAX_SIZE) throw badRequest('图片大小不能超过 10MB');
    const ext = /jpeg/i.test(match[1]) ? 'jpg' : match[1].split('/')[1].toLowerCase();
    const filename = `${prefix}_${uuidv4()}.${ext}`;
    const file = path.join(PERSISTENT_DIR, filename);
    await fs.promises.writeFile(file, buffer);
    return { url: `/uploads/${filename}`, file };
  }

  if (url.startsWith('/uploads/')) {
    const src = findLocalFile(url);
    if (!src) throw badRequest('海报图片已失效，请重新生成后再保存');
    // 已在持久目录（重复保存同一张图）：直接复用，不重复复制
    if (path.dirname(src) === PERSISTENT_DIR) return { url, file: null };
    const filename = `${prefix}_${uuidv4()}${path.extname(url) || '.png'}`;
    const file = path.join(PERSISTENT_DIR, filename);
    await fs.promises.copyFile(src, file);
    return { url: `/uploads/${filename}`, file };
  }

  // 外链原样保留（正常流程中 AI 成图已落盘，不会走到这里）
  return { url, file: null };
}

/**
 * POST /api/data/save
 * 保存海报项目到数据库
 */
router.post('/save', async (req, res) => {
  let conn;
  let transactionStarted = false;
  const writtenFiles = [];
  try {
    conn = await db.getConnection();
    const { projectId, projectCode, title, materialType, festivalCode, brandCode,
            startDate, endDate, theme, subtitle, frontPosterUrl, backPosterUrl,
            backBgUrl, carStickerUrl, activities, rawData } = req.body;

    const code = projectCode || projectId || `project_${Date.now()}`;

    // 1) 先做无效编码拦截，避免校验失败时已经往磁盘写了图片
    if (festivalCode) {
      const [rows] = await conn.query('SELECT 1 FROM festivals WHERE code = ?', [festivalCode]);
      if (!rows.length) return res.status(400).json({ error: `节日编码不存在: ${festivalCode}` });
    }
    if (brandCode) {
      const [rows] = await conn.query('SELECT 1 FROM brands WHERE code = ?', [brandCode]);
      if (!rows.length) return res.status(400).json({ error: `品牌编码不存在: ${brandCode}` });
    }

    // 2) 取旧行：本次没传图（null/空串）时保留旧 URL，不能用 NULL 覆盖
    const [existingRows] = await conn.query(
      `SELECT id, front_poster_url, back_poster_url, back_bg_url, car_sticker_url
       FROM poster_projects WHERE project_code = ?`, [code]
    );
    const existing = existingRows[0];

    // 3) 四张图并发落盘到持久目录；任一失败统一清掉本次写入的孤儿文件
    let savedFrontPosterUrl, savedBackPosterUrl, savedBackBgUrl, savedCarStickerUrl;
    try {
      const persisted = await Promise.all([
        persistImageUrl(frontPosterUrl || existing?.front_poster_url, 'poster_front'),
        persistImageUrl(backPosterUrl || existing?.back_poster_url, 'poster_back'),
        persistImageUrl(backBgUrl || existing?.back_bg_url, 'poster_back_bg'),
        persistImageUrl(carStickerUrl || existing?.car_sticker_url, 'car_sticker'),
      ]);
      [savedFrontPosterUrl, savedBackPosterUrl, savedBackBgUrl, savedCarStickerUrl] = persisted.map(p => p.url);
      writtenFiles.push(...persisted.map(p => p.file).filter(Boolean));
    } catch (persistErr) {
      await Promise.all(writtenFiles.map(f => fs.promises.unlink(f).catch(() => {})));
      const status = persistErr.status || 500;
      return res.status(status).json({
        error: status === 400 ? persistErr.message : '保存失败',
        ...(process.env.NODE_ENV !== 'production' && { detail: persistErr.message }),
      });
    }

    const safeRawData = rawData && typeof rawData === 'object' ? { ...rawData } : req.body;
    for (const key of ['frontPosterUrl', 'backPosterUrl', 'carStickerUrl', 'backBgImageUrl', 'enhancedFrontUrl', 'enhancedBackUrl']) {
      delete safeRawData[key];
    }
    const rawDataJson = JSON.stringify(safeRawData);

    await conn.beginTransaction();
    transactionStarted = true;

    // 4) 原子 upsert：uk_project_code 上不再先 SELECT 再 INSERT/UPDATE，消除并发请求的竞态
    //    id=LAST_INSERT_ID(id) 让 insertId 在更新分支也返回既有主键
    const [result] = await conn.query(
      `INSERT INTO poster_projects
        (project_code, title, material_type, festival_code, brand_code,
         start_date, end_date, theme, subtitle,
         front_poster_url, back_poster_url, back_bg_url, car_sticker_url,
         raw_data, status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', NOW())
       ON DUPLICATE KEY UPDATE
         id=LAST_INSERT_ID(id),
         title=VALUES(title), material_type=VALUES(material_type),
         festival_code=VALUES(festival_code), brand_code=VALUES(brand_code),
         start_date=VALUES(start_date), end_date=VALUES(end_date),
         theme=VALUES(theme), subtitle=VALUES(subtitle),
         front_poster_url=VALUES(front_poster_url), back_poster_url=VALUES(back_poster_url),
         back_bg_url=VALUES(back_bg_url), car_sticker_url=VALUES(car_sticker_url),
         raw_data=VALUES(raw_data), status='completed', updated_at=NOW()`,
      [code, title || '', materialType || 'poster', festivalCode || null, brandCode || null,
       startDate || null, endDate || null, theme || '', subtitle || '',
       savedFrontPosterUrl, savedBackPosterUrl, savedBackBgUrl, savedCarStickerUrl,
       rawDataJson]
    );
    const projectPk = result.insertId;

    // 活动写在事务内：先删后插，中途失败整体回滚，不会出现"旧的已删、新的没写完"
    if (Array.isArray(activities)) {
      await conn.query('DELETE FROM project_activities WHERE project_id = ?', [projectPk]);
      for (let i = 0; i < activities.length; i++) {
        const a = activities[i];
        await conn.query(
          `INSERT INTO project_activities
            (project_id, discount_type_code, activity_type, discount_detail, content, highlight, field_values, image_urls, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [projectPk, a.discountType || '', a.type || '', a.discountDetail || '',
           a.content || '', a.highlight || null,
           JSON.stringify(a.fieldValues || null), JSON.stringify(a.imageUrls || null), i]
        );
      }
    }

    await conn.commit();
    res.json({ success: true, projectId: code });
  } catch (err) {
    if (conn && transactionStarted) {
      try { await conn.rollback(); } catch (rollbackErr) {
        console.error('[保存回滚失败]', rollbackErr.message);
      }
    }
    // DB 失败：本次新写入的图片成为孤儿，删掉；复用的旧持久文件 file=null 不会被删
    await Promise.all(writtenFiles.map(f => fs.promises.unlink(f).catch(() => {})));
    console.error('[保存数据错误]', err.message);
    res.status(err.status || 500).json({
      error: err.status === 400 ? err.message : '保存失败',
      ...(process.env.NODE_ENV !== 'production' && { detail: err.message }),
    });
  } finally {
    if (conn) conn.release();
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
              start_date AS startDate, end_date AS endDate,
              front_poster_url AS frontPosterUrl, status,
              created_at AS createdAt, updated_at AS updatedAt, raw_data AS rawData
       FROM poster_projects ORDER BY updated_at DESC, created_at DESC LIMIT 100`
    );
    const projects = (rows || []).map((project) => {
      const rawData = parseJsonValue(project.rawData);
      const projectSummary = buildProjectSummary(project, rawData);
      const { rawData: _rawData, ...summary } = project;
      return { ...summary, ...projectSummary };
    });
    res.json({ success: true, projects });
  } catch (err) {
    res.status(500).json({ error: '列表获取失败', detail: err.message });
  }
});

/**
 * POST /api/data/upload
 * 上传活动图片，保存到磁盘，返回可访问的URL
 * 过期文件由 app.js 的定时任务按小时清理，不在请求路径上做 I/O
 */
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未上传文件' });
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ success: true, url, originalName: req.file.originalname });
});

/**
 * 异步清理上传目录：删除 24 小时前的文件
 * 由 app.js setInterval（每小时）驱动，避免同步 I/O 阻塞事件循环
 */
async function cleanupUploads(maxAgeMs = 24 * 60 * 60 * 1000) {
  let files;
  try {
    files = await fs.promises.readdir(UPLOAD_DIR);
  } catch (e) {
    if (e.code !== 'ENOENT') console.error('[Upload] 自动清理失败:', e.message);
    return 0;
  }
  const cutoff = Date.now() - maxAgeMs;
  let cleaned = 0;
  for (const file of files) {
    // ponytail: 旧版本持久海报直接写在 uploads，按前缀保护；新版本持久图都在 data/posters
    if (PERSISTED_PREFIXES.some(p => file.startsWith(p))) continue;
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
  return cleaned;
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

    const files = fs.readdirSync(UPLOAD_DIR);
    let deleted = 0;
    let freedSpace = 0;

    for (const file of files) {
      if (PERSISTED_PREFIXES.some(p => file.startsWith(p))) continue;
      const filePath = path.join(UPLOAD_DIR, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat.mtimeMs < cutoffTime) {
          freedSpace += stat.size;
          fs.unlinkSync(filePath);
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
router.get('/upload-stats', (req, res) => {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      return res.json({ success: true, count: 0, totalSize: '0 MB' });
    }

    const files = fs.readdirSync(UPLOAD_DIR);
    let totalSize = 0;

    for (const file of files) {
      try {
        const stat = fs.statSync(path.join(UPLOAD_DIR, file));
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
module.exports.cleanupUploads = cleanupUploads;
