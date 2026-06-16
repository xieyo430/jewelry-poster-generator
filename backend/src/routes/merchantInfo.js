const express = require('express');
const router = express.Router();

const MERCHANT_TEMPLATES = [
  { id: 'store-1', name: '总店', address: '', phone: '', wechat: '' },
  { id: 'store-2', name: '旗舰店', address: '', phone: '', wechat: '' },
  { id: 'store-3', name: '分店', address: '', phone: '', wechat: '' },
  { id: 'custom', name: '自定义商家信息', address: '', phone: '', wechat: '' },
];

router.get('/', (req, res) => {
  res.json({ merchantTemplates: MERCHANT_TEMPLATES });
});

module.exports = router;
