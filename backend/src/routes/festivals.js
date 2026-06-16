const express = require('express');
const router = express.Router();

const FESTIVALS = [
  // 传统节日
  { id: 'spring-festival', name: '春节', colorScheme: '中国红与金色', primaryColor: '#C41E3A', secondaryColor: '#FFD700', bgColor: '#8B0000' },
  { id: 'yuanxiao', name: '元宵节', colorScheme: '红色与暖黄', primaryColor: '#DC143C', secondaryColor: '#FFD700', bgColor: '#3B0A0A' },
  { id: 'qingming', name: '清明节', colorScheme: '青绿与素白', primaryColor: '#2E8B57', secondaryColor: '#F0F0F0', bgColor: '#1A2A1A' },
  { id: 'dragon-boat', name: '端午节', colorScheme: '翠绿与粽叶绿', primaryColor: '#2E8B57', secondaryColor: '#8B4513', bgColor: '#1A3C2A' },
  { id: 'qixi', name: '七夕节', colorScheme: '紫色与粉色渐变', primaryColor: '#9B59B6', secondaryColor: '#FF69B4', bgColor: '#2C0E37' },
  { id: 'mid-autumn', name: '中秋节', colorScheme: '金色与深蓝色', primaryColor: '#FFD700', secondaryColor: '#1A237E', bgColor: '#0D1B2A' },
  { id: 'chongyang', name: '重阳节', colorScheme: '暖金色与茱萸红', primaryColor: '#D2691E', secondaryColor: '#8B0000', bgColor: '#2A1A0A' },
  { id: 'winter-solstice', name: '冬至', colorScheme: '暖红与雪白', primaryColor: '#CD5C5C', secondaryColor: '#F5FFFA', bgColor: '#1A1A2E' },
  { id: 'laban', name: '腊八节', colorScheme: '温暖的陶土红', primaryColor: '#B22222', secondaryColor: '#DEB887', bgColor: '#2A1A0A' },

  // 现代节日
  { id: 'new-year', name: '元旦', colorScheme: '金色与红色', primaryColor: '#FF4500', secondaryColor: '#FFD700', bgColor: '#2B0F0F' },
  { id: 'valentine', name: '情人节', colorScheme: '粉色与玫瑰红', primaryColor: '#FF69B4', secondaryColor: '#FF1493', bgColor: '#FFF0F5' },
  { id: 'white-valentine', name: '白色情人节', colorScheme: '纯白与淡粉', primaryColor: '#FFB6C1', secondaryColor: '#F0F0F0', bgColor: '#2A1A2A' },
  { id: '520-day', name: '520表白日', colorScheme: '浪漫粉与炽热红', primaryColor: '#FF1493', secondaryColor: '#FF4500', bgColor: '#2A0A1A' },
  { id: 'mother-day', name: '母亲节', colorScheme: '暖粉与香槟金', primaryColor: '#FFB6C1', secondaryColor: '#F5E6CC', bgColor: '#4A1A2C' },
  { id: 'father-day', name: '父亲节', colorScheme: '深蓝与银灰', primaryColor: '#1C3D5A', secondaryColor: '#C0C0C0', bgColor: '#0A1628' },
  { id: 'teachers-day', name: '教师节', colorScheme: '温暖米色与金色', primaryColor: '#DAA520', secondaryColor: '#F5DEB3', bgColor: '#1A1A0A' },
  { id: 'national-day', name: '国庆节', colorScheme: '中国红与金色', primaryColor: '#E60012', secondaryColor: '#FFD700', bgColor: '#8B0000' },
  { id: 'christmas', name: '圣诞节', colorScheme: '圣诞红与松绿', primaryColor: '#CC0000', secondaryColor: '#2E8B57', bgColor: '#0A2F0A' },
  { id: 'halloween', name: '万圣节', colorScheme: '暗紫与鬼魅橙', primaryColor: '#FF8C00', secondaryColor: '#6A0DAD', bgColor: '#0A0A1A' },
  { id: 'thanksgiving', name: '感恩节', colorScheme: '暖橙与丰收金', primaryColor: '#D2691E', secondaryColor: '#FFD700', bgColor: '#2A1A0A' },

  // 女性相关
  { id: 'women-day', name: '三八女神节', colorScheme: '优雅粉与玫瑰金', primaryColor: '#FF69B4', secondaryColor: '#E8B4B8', bgColor: '#3A1A2A' },
  { id: 'girl-day', name: '女生节', colorScheme: '樱花粉与薰衣草紫', primaryColor: '#FFB7C5', secondaryColor: '#B19CD9', bgColor: '#2A1A3A' },

  // 购物/促销
  { id: 'double-eleven', name: '双11', colorScheme: '黑色与橙色', primaryColor: '#FF4500', secondaryColor: '#000000', bgColor: '#1A1A2E' },
  { id: 'double-twelve', name: '双12', colorScheme: '蓝色与橙色', primaryColor: '#4169E1', secondaryColor: '#FF6347', bgColor: '#0D1B2A' },
  { id: '618-sale', name: '618年中促', colorScheme: '活力红与科技蓝', primaryColor: '#E60012', secondaryColor: '#4169E1', bgColor: '#1A0A0A' },
  { id: 'black-friday', name: '黑五狂欢', colorScheme: '黑金撞色', primaryColor: '#FFD700', secondaryColor: '#1A1A1A', bgColor: '#000000' },

  // 珠宝行业特色
  { id: 'anniversary', name: '周年庆', colorScheme: '华丽金与庆典红', primaryColor: '#FFD700', secondaryColor: '#DC143C', bgColor: '#1A0A0A' },
  { id: 'grand-opening', name: '开业庆典', colorScheme: '喜庆红与金色', primaryColor: '#FF0000', secondaryColor: '#FFD700', bgColor: '#2B0F0F' },
  { id: 'new-arrival-spring', name: '春季上新', colorScheme: '春意绿与樱花粉', primaryColor: '#4CAF50', secondaryColor: '#FFB7C5', bgColor: '#0A1A0A' },
  { id: 'new-arrival-autumn', name: '秋季上新', colorScheme: '秋日金与枫叶红', primaryColor: '#FF6347', secondaryColor: '#DAA520', bgColor: '#1A0A0A' },
  { id: 'season-clearance', name: '换季清仓', colorScheme: '明黄与亮橙', primaryColor: '#FFD700', secondaryColor: '#FF8C00', bgColor: '#1A1A0A' },
  { id: 'member-day', name: '会员日', colorScheme: '尊贵紫与金色', primaryColor: '#800080', secondaryColor: '#FFD700', bgColor: '#1A0A2A' },
  { id: 'wedding-season', name: '婚嫁季', colorScheme: '浪漫粉与纯白', primaryColor: '#FFB6C1', secondaryColor: '#F5FFFA', bgColor: '#2A0A1A' },
];

router.get('/', (req, res) => {
  res.json({ festivals: FESTIVALS });
});

module.exports = router;
