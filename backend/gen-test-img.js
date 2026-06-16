/**
 * 生成测试替代图 test.png
 * 用法: node gen-test-img.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SIZE = 400;
const OUTPUT = path.join(__dirname, '../data/uploads/test.png');

async function main() {
  // 确保目录存在
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

  const svg = `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFF8E7"/>
      <stop offset="100%" stop-color="#F5E6CC"/>
    </linearGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFD700"/>
      <stop offset="50%" stop-color="#FFA500"/>
      <stop offset="100%" stop-color="#FFD700"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>
  <!-- 珠宝图标：钻石 -->
  <polygon points="200,80 260,180 200,220 140,180" fill="none" stroke="url(#ring)" stroke-width="4"/>
  <polygon points="200,80 260,180 200,160 140,180" fill="#E8F4FD" opacity="0.6"/>
  <line x1="200" y1="160" x2="200" y2="220" stroke="#FFD700" stroke-width="2"/>
  <line x1="140" y1="180" x2="260" y2="180" stroke="#FFD700" stroke-width="2"/>
  <!-- 底座 -->
  <ellipse cx="200" cy="260" rx="80" ry="20" fill="none" stroke="#FFD700" stroke-width="3"/>
  <text x="200" y="340" text-anchor="middle" font-size="36px" fill="#8B6914" font-family="SimHei">测试商品</text>
</svg>`;

  const buf = Buffer.from(svg);
  await sharp(buf).png().toFile(OUTPUT);
  console.log('已生成:', OUTPUT);
}

main().catch(console.error);
