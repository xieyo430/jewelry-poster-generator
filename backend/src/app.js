require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const db = require('./services/db');

const app = express();
const PORT = process.env.PORT || 3001;

// 确保上传和 LOGO 目录存在
const UPLOAD_DIR = path.join(__dirname, '../data/uploads');
const LOGO_DIR = path.join(__dirname, '../data/logos');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(LOGO_DIR)) fs.mkdirSync(LOGO_DIR, { recursive: true });

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 认证中间件 (设置 AUTH_TOKEN 环境变量后生效)
const AUTH_TOKEN = process.env.AUTH_TOKEN;
if (AUTH_TOKEN) {
  app.use('/api', (req, res, next) => {
    // 放行健康检查和 GET /api/settings
    if (req.path === '/health') return next();
    if (req.method === 'GET' && req.path === '/settings') return next();

    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    if (token !== AUTH_TOKEN) {
      return res.status(401).json({ error: '未授权，请提供有效的 AUTH_TOKEN' });
    }
    next();
  });
  console.log('[Auth] 认证已启用，需在请求头 Authorization: Bearer <token> 中携带令牌');
}

// 静态文件 - 上传目录
app.use('/uploads', express.static(path.join(__dirname, '../../data/uploads')));

// 限速中间件 — 保护 AI 接口防止滥用
const posterLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '海报生成请求过于频繁，请稍后再试' },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI 请求过于频繁，请稍后再试' },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '上传请求过于频繁，请稍后再试' },
});

// 路由
const brandsRouter = require('./routes/brands');
const festivalsRouter = require('./routes/festivals');
const discountTypesRouter = require('./routes/discountTypes');
const merchantInfoRouter = require('./routes/merchantInfo');
const logoRouter = require('./routes/logo');
const posterRouter = require('./routes/poster');
const dataRouter = require('./routes/data');
const aiRouter = require('./routes/ai');
const settingsRouter = require('./routes/settings');
const mattingRouter = require('./routes/matting');

// 启动时加载用户自定义设置覆盖 .env
settingsRouter.applySettings();

app.use('/api/brands', brandsRouter);
app.use('/api/festivals', festivalsRouter);
app.use('/api/discount-types', discountTypesRouter);
app.use('/api/merchant-info', merchantInfoRouter);
app.use('/api/logo', logoRouter);
app.use('/api/poster', posterLimiter, posterRouter);
app.use('/api/data/upload', uploadLimiter);
app.use('/api/data', dataRouter);
app.use('/api/ai', aiLimiter, aiRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/matting', mattingRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: '服务器内部错误', detail: err.message });
});

app.listen(PORT, async () => {
  console.log(`🖼️  珠宝海报生成器后端启动成功: http://localhost:${PORT}`);
  console.log(`📦 文生图模型: ${process.env.SILICONFLOW_IMAGE_MODEL || process.env.IMAGE_MODEL_ID || '未配置'}`);
  console.log(`💬 对话模型: ${process.env.DEEPSEEK_MODEL_ID || 'deepseek-v4-flash'} (DeepSeek)`);
  await db.testConnection();
});
