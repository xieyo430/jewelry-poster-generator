require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件 - 上传目录
app.use('/uploads', express.static(path.join(__dirname, '../../data/uploads')));

// 路由
const brandsRouter = require('./routes/brands');
const festivalsRouter = require('./routes/festivals');
const discountTypesRouter = require('./routes/discountTypes');
const merchantInfoRouter = require('./routes/merchantInfo');
const logoRouter = require('./routes/logo');
const posterRouter = require('./routes/poster');
const dataRouter = require('./routes/data');
const aiRouter = require('./routes/ai');

app.use('/api/brands', brandsRouter);
app.use('/api/festivals', festivalsRouter);
app.use('/api/discount-types', discountTypesRouter);
app.use('/api/merchant-info', merchantInfoRouter);
app.use('/api/logo', logoRouter);
app.use('/api/poster', posterRouter);
app.use('/api/data', dataRouter);
app.use('/api/ai', aiRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: '服务器内部错误', detail: err.message });
});

app.listen(PORT, () => {
  console.log(`🖼️  珠宝海报生成器后端启动成功: http://localhost:${PORT}`);
  console.log(`📦 文生图模型(已切换): Doubao-Seedream-4.5`);
  console.log(`💬 对话模型: ${process.env.MIMO_MODEL_ID || '未配置'} (小米)`);
});
