require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./services/db');

const app = express();
const PORT = process.env.PORT || 3001;

// 确保运行时目录存在（uploads/posters 由 imageStore 统一创建）
const { UPLOAD_DIR, PERSISTENT_DIR } = require('./services/imageStore');
const LOGO_DIR = path.join(__dirname, '../data/logos');
if (!fs.existsSync(LOGO_DIR)) fs.mkdirSync(LOGO_DIR, { recursive: true });

// 中间件
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 认证中间件 (设置 AUTH_TOKEN 环境变量后生效)
const AUTH_TOKEN = process.env.AUTH_TOKEN;

// 生产环境必须启用认证：免鉴权的 PUT /api/settings 可写入任意 Key，暴露到局域网/公网即高危
if (process.env.NODE_ENV === 'production' && !AUTH_TOKEN) {
  console.error('[安全] NODE_ENV=production 时必须设置 AUTH_TOKEN，服务拒绝启动');
  process.exit(1);
}

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

// 静态文件：持久目录优先，临时目录兜底（express.static 找不到文件会自动 next 级联）
app.use('/uploads', express.static(PERSISTENT_DIR));
app.use('/uploads', express.static(UPLOAD_DIR));

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
app.use('/api/poster', posterRouter);
app.use('/api/data', dataRouter);
app.use('/api/ai', aiRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/matting', mattingRouter);

// 上传目录定时清理：启动即跑一次，之后每小时（异步 I/O，不阻塞请求，不拖垮进程退出）
dataRouter.cleanupUploads().catch(e => console.error('[Upload] 启动清理失败:', e.message));
const cleanupTimer = setInterval(
  () => dataRouter.cleanupUploads().catch(e => console.error('[Upload] 自动清理失败:', e.message)),
  60 * 60 * 1000
);
cleanupTimer.unref();

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理：生产环境只返回泛化信息，避免 SQL/堆栈随 err.message 外泄
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  const body = { error: '服务器内部错误' };
  if (process.env.NODE_ENV !== 'production') body.detail = err.message;
  res.status(500).json(body);
});

app.listen(PORT, '127.0.0.1', async () => {
  console.log(`🖼️  珠宝海报生成器后端启动成功: http://localhost:${PORT}`);
  console.log(`📦 文生图模型(主力: 火山引擎 ARK): ${process.env.IMAGE_MODEL_ID || process.env.ENHANCE_MODEL_ID || '未配置'}`);
  console.log(`💬 对话模型: ${process.env.DEEPSEEK_MODEL_ID || 'deepseek-chat'} (DeepSeek)`);
  await db.testConnection();
});
