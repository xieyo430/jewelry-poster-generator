const express = require('express');
const router = express.Router();

const BRANDS = [
  { id: 'chow-tai-fook', name: '周大福', description: '中国最大珠宝品牌' },
  { id: 'chow-sang-sang', name: '周生生', description: '经典珠宝品牌' },
  { id: 'lao-feng-xiang', name: '老凤祥', description: '百年民族品牌' },
  { id: 'chow-tai-seng', name: '周大生', description: '知名珠宝品牌' },
  { id: 'luk-fook', name: '六福珠宝', description: '国际珠宝品牌' },
  { id: 'tsl', name: '谢瑞麟', description: '轻奢珠宝品牌' },
  { id: 'ming-pai', name: '明牌珠宝', description: '时尚珠宝品牌' },
  { id: 'chic-legend', name: '潮宏基', description: '时尚设计珠宝品牌' },
];

router.get('/', (req, res) => {
  res.json({ brands: BRANDS });
});

module.exports = router;
