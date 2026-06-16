/**
 * SVG渲染测试脚本（完整版）
 * 不调用AI接口，用纯色背景测试布局效果
 * 用法: node test-svg.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { renderBackPoster, computeLayout } = require('./src/services/posterRenderer');

const W = 2100;
const H = 2970;
const OUTPUT_DIR = path.join(__dirname, '../data/uploads');

// 通用图片引用
const IMG = '/uploads/test.png';

// ===== 测试数据 =====
const testCases = [

  // =============================================
  //  A. 纯文字 (1~6条)
  // =============================================
  {
    name: 'A1-纯文字1条',
    activities: [
      { id: 1, content: '黄金每克立减50元', discountDetail: '黄金每克立减50元，工费全免' },
    ],
  },
  {
    name: 'A2-纯文字2条',
    activities: [
      { id: 1, content: '黄金每克立减50元', discountDetail: '黄金每克立减50元，工费全免' },
      { id: 2, content: '满1000减100', discountDetail: '满1000减100，可叠加使用' },
    ],
  },
  {
    name: 'A3-纯文字3条',
    activities: [
      { id: 1, content: '黄金每克立减50元', discountDetail: '黄金每克立减50元，工费全免' },
      { id: 2, content: '满1000减100', discountDetail: '满1000减100，可叠加使用' },
      { id: 3, content: '钻石8折', discountDetail: '精选钻石全场8折优惠' },
    ],
  },
  {
    name: 'A4-纯文字4条',
    activities: [
      { id: 1, content: '黄金每克立减50元', discountDetail: '黄金每克立减50元，工费全免' },
      { id: 2, content: '满1000减100', discountDetail: '满1000减100，可叠加使用' },
      { id: 3, content: '钻石8折', discountDetail: '精选钻石全场8折优惠' },
      { id: 4, content: '翡翠满减', discountDetail: '翡翠满2000减400' },
    ],
  },
  {
    name: 'A5-纯文字5条',
    activities: [
      { id: 1, content: '黄金每克立减50元', discountDetail: '黄金每克立减50元，工费全免' },
      { id: 2, content: '满1000减100', discountDetail: '满1000减100，可叠加使用' },
      { id: 3, content: '钻石8折', discountDetail: '精选钻石全场8折优惠' },
      { id: 4, content: '翡翠满减', discountDetail: '翡翠满2000减400' },
      { id: 5, content: '珍珠买一送一', discountDetail: '珍珠饰品买一送一' },
    ],
  },
  {
    name: 'A6-纯文字6条',
    activities: [
      { id: 1, content: '黄金每克立减50元', discountDetail: '黄金每克立减50元，工费全免' },
      { id: 2, content: '满1000减100', discountDetail: '满1000减100，可叠加使用' },
      { id: 3, content: '钻石8折', discountDetail: '精选钻石全场8折优惠' },
      { id: 4, content: '翡翠满减', discountDetail: '翡翠满2000减400' },
      { id: 5, content: '珍珠买一送一', discountDetail: '珍珠饰品买一送一' },
      { id: 6, content: '白银特价', discountDetail: '白银手镯每克立减5元' },
    ],
  },

  // =============================================
  //  B. 单图 (1~6个，tb/lr)
  // =============================================
  {
    name: 'B1-单图1个tb',
    activities: [
      { id: 1, content: '钻石特惠', discountDetail: '精选钻石8折优惠', imageUrls: [IMG] },
    ],
  },
  {
    name: 'B2-单图1个lr',
    activities: [
      { id: 1, content: '黄金克减', discountDetail: '黄金每克立减50元，工费全免，满额再减', imageUrls: [IMG] },
    ],
  },
  {
    name: 'B3-单图2个tb',
    activities: [
      { id: 1, content: '黄金优惠', discountDetail: '黄金每克立减30元', imageUrls: [IMG] },
      { id: 2, content: '钻石优惠', discountDetail: '精选钻石7折', imageUrls: [IMG] },
    ],
  },
  {
    name: 'B4-单图2个lr',
    activities: [
      { id: 1, content: '黄金优惠', discountDetail: '黄金每克立减30元，工费全免，满额再减', imageUrls: [IMG] },
      { id: 2, content: '钻石优惠', discountDetail: '精选钻石7折，镶嵌工费全免', imageUrls: [IMG] },
    ],
  },
  {
    name: 'B5-单图3个',
    activities: [
      { id: 1, content: '黄金优惠', discountDetail: '黄金每克立减30元', imageUrls: [IMG] },
      { id: 2, content: '钻石优惠', discountDetail: '精选钻石7折', imageUrls: [IMG] },
      { id: 3, content: '翡翠优惠', discountDetail: '翡翠满1000减200', imageUrls: [IMG] },
    ],
  },
  {
    name: 'B6-单图4个',
    activities: [
      { id: 1, content: '黄金', discountDetail: '黄金每克立减50元', imageUrls: [IMG] },
      { id: 2, content: '钻石', discountDetail: '精选钻石8折', imageUrls: [IMG] },
      { id: 3, content: '翡翠', discountDetail: '翡翠满1000减200', imageUrls: [IMG] },
      { id: 4, content: '珍珠', discountDetail: '珍珠买一送一', imageUrls: [IMG] },
    ],
  },
  {
    name: 'B7-单图5个强制LR',
    activities: [
      { id: 1, content: '黄金', discountDetail: '黄金每克立减50元', imageUrls: [IMG] },
      { id: 2, content: '钻石', discountDetail: '精选钻石8折', imageUrls: [IMG] },
      { id: 3, content: '翡翠', discountDetail: '翡翠满1000减200', imageUrls: [IMG] },
      { id: 4, content: '珍珠', discountDetail: '珍珠买一送一', imageUrls: [IMG] },
      { id: 5, content: '铂金', discountDetail: '铂金9折优惠', imageUrls: [IMG] },
    ],
  },
  {
    name: 'B8-单图6个',
    activities: [
      { id: 1, content: '黄金', discountDetail: '黄金每克立减50元', imageUrls: [IMG] },
      { id: 2, content: '钻石', discountDetail: '精选钻石8折', imageUrls: [IMG] },
      { id: 3, content: '翡翠', discountDetail: '翡翠满1000减200', imageUrls: [IMG] },
      { id: 4, content: '珍珠', discountDetail: '珍珠买一送一', imageUrls: [IMG] },
      { id: 5, content: '铂金', discountDetail: '铂金9折优惠', imageUrls: [IMG] },
      { id: 6, content: '白银', discountDetail: '白银手镯特价', imageUrls: [IMG] },
    ],
  },

  // =============================================
  //  C. 多图 (1~3个，每个2张图)
  // =============================================
  {
    name: 'C1-多图1个',
    activities: [
      { id: 1, content: '黄金手镯', discountDetail: '黄金手镯每克立减50元', imageUrls: [IMG, IMG] },
    ],
  },
  {
    name: 'C2-多图2个',
    activities: [
      { id: 1, content: '黄金手镯', discountDetail: '黄金手镯每克立减50元', imageUrls: [IMG, IMG] },
      { id: 2, content: '钻石项链', discountDetail: '钻石项链原价8999现价5999', imageUrls: [IMG, IMG] },
    ],
  },
  {
    name: 'C3-多图3个',
    activities: [
      { id: 1, content: '黄金手镯', discountDetail: '黄金手镯每克立减50元', imageUrls: [IMG, IMG] },
      { id: 2, content: '钻石项链', discountDetail: '钻石项链原价8999现价5999', imageUrls: [IMG, IMG] },
      { id: 3, content: '翡翠吊坠', discountDetail: '翡翠吊坠满2000减400', imageUrls: [IMG, IMG] },
    ],
  },

  // =============================================
  //  D. 混合布局
  // =============================================
  {
    name: 'D1-2纯文字2单图',
    activities: [
      { id: 1, content: '进店送礼', discountDetail: '进店即送精美礼品一份' },
      { id: 2, content: '抽奖活动', discountDetail: '消费满500即可参与抽奖' },
      { id: 3, content: '黄金', discountDetail: '黄金克减50', imageUrls: [IMG] },
      { id: 4, content: '钻石', discountDetail: '钻石8折', imageUrls: [IMG] },
    ],
  },
  {
    name: 'D2-2纯文字1多图',
    activities: [
      { id: 1, content: '进店送礼', discountDetail: '进店即送精美礼品一份' },
      { id: 2, content: '抽奖活动', discountDetail: '消费满500即可参与抽奖' },
      { id: 3, content: '黄金手镯', discountDetail: '黄金手镯每克立减50元', imageUrls: [IMG, IMG] },
    ],
  },
  {
    name: 'D3-3单图1多图',
    activities: [
      { id: 1, content: '黄金', discountDetail: '黄金克减50', imageUrls: [IMG] },
      { id: 2, content: '钻石', discountDetail: '钻石8折', imageUrls: [IMG] },
      { id: 3, content: '翡翠', discountDetail: '翡翠满减', imageUrls: [IMG] },
      { id: 4, content: '黄金手镯', discountDetail: '黄金手镯每克立减50元', imageUrls: [IMG, IMG] },
    ],
  },
  {
    name: 'D4-1单图2多图',
    activities: [
      { id: 1, content: '黄金', discountDetail: '黄金克减50', imageUrls: [IMG] },
      { id: 2, content: '黄金手镯', discountDetail: '黄金手镯每克立减50元', imageUrls: [IMG, IMG] },
      { id: 3, content: '钻石项链', discountDetail: '钻石项链原价8999现价5999', imageUrls: [IMG, IMG] },
    ],
  },
  {
    name: 'D5-2纯文字1单图1多图',
    activities: [
      { id: 1, content: '进店送礼', discountDetail: '进店即送精美礼品一份' },
      { id: 2, content: '抽奖活动', discountDetail: '消费满500即可参与抽奖' },
      { id: 3, content: '黄金', discountDetail: '黄金克减50', imageUrls: [IMG] },
      { id: 4, content: '黄金手镯', discountDetail: '黄金手镯每克立减50元', imageUrls: [IMG, IMG] },
    ],
  },
  {
    name: 'D6-1纯文字2单图1多图',
    activities: [
      { id: 1, content: '进店送礼', discountDetail: '进店即送精美礼品一份' },
      { id: 2, content: '黄金', discountDetail: '黄金克减50', imageUrls: [IMG] },
      { id: 3, content: '钻石', discountDetail: '钻石8折', imageUrls: [IMG] },
      { id: 4, content: '黄金手镯', discountDetail: '黄金手镯每克立减50元', imageUrls: [IMG, IMG] },
    ],
  },
  {
    name: 'D7-2纯文字2单图1多图',
    activities: [
      { id: 1, content: '进店送礼', discountDetail: '进店即送精美礼品一份' },
      { id: 2, content: '抽奖活动', discountDetail: '消费满500即可参与抽奖' },
      { id: 3, content: '黄金', discountDetail: '黄金克减50', imageUrls: [IMG] },
      { id: 4, content: '钻石', discountDetail: '钻石8折', imageUrls: [IMG] },
      { id: 5, content: '黄金手镯', discountDetail: '黄金手镯每克立减50元', imageUrls: [IMG, IMG] },
    ],
  },
  {
    name: 'D8-1纯文字2单图2多图',
    activities: [
      { id: 1, content: '进店送礼', discountDetail: '进店即送精美礼品一份' },
      { id: 2, content: '黄金', discountDetail: '黄金克减50', imageUrls: [IMG] },
      { id: 3, content: '钻石', discountDetail: '钻石8折', imageUrls: [IMG] },
      { id: 4, content: '黄金手镯', discountDetail: '黄金手镯每克立减50元', imageUrls: [IMG, IMG] },
      { id: 5, content: '钻石项链', discountDetail: '钻石项链原价8999现价5999', imageUrls: [IMG, IMG] },
    ],
  },
  {
    name: 'D9-2纯文字2单图2多图极限6',
    activities: [
      { id: 1, content: '进店送礼', discountDetail: '进店即送精美礼品一份' },
      { id: 2, content: '抽奖活动', discountDetail: '消费满500即可参与抽奖' },
      { id: 3, content: '黄金', discountDetail: '黄金克减50', imageUrls: [IMG] },
      { id: 4, content: '钻石', discountDetail: '钻石8折', imageUrls: [IMG] },
      { id: 5, content: '黄金手镯', discountDetail: '黄金手镯每克立减50元', imageUrls: [IMG, IMG] },
      { id: 6, content: '钻石项链', discountDetail: '钻石项链原价8999现价5999', imageUrls: [IMG, IMG] },
    ],
  },
  {
    name: 'D10-3种类型各1个',
    activities: [
      { id: 1, content: '进店送礼', discountDetail: '进店即送精美礼品一份' },
      { id: 2, content: '黄金', discountDetail: '黄金克减50', imageUrls: [IMG] },
      { id: 3, content: '黄金手镯', discountDetail: '黄金手镯每克立减50元', imageUrls: [IMG, IMG] },
    ],
  },
  {
    name: 'D11-1纯文字4单图1多图',
    activities: [
      { id: 1, content: '全场大促', discountDetail: '全场商品低至5折起，进店即送精美礼品' },
      { id: 2, content: '黄金', discountDetail: '黄金每克立减50元', imageUrls: [IMG] },
      { id: 3, content: '钻石', discountDetail: '精选钻石8折优惠', imageUrls: [IMG] },
      { id: 4, content: '翡翠', discountDetail: '翡翠满1000减200', imageUrls: [IMG] },
      { id: 5, content: '珍珠', discountDetail: '珍珠买一送一', imageUrls: [IMG] },
      { id: 6, content: '黄金手镯', discountDetail: '黄金手镯每克立减50元', imageUrls: [IMG, IMG] },
    ],
  },

  // =============================================
  //  E. 特殊效果
  // =============================================
  {
    name: 'E1-价格数字高亮',
    activities: [
      { id: 1, content: '黄金特惠', discountDetail: '黄金每克立减50元，满1000减100' },
      { id: 2, content: '钻石特惠', discountDetail: '钻石项链原价8999元，现价5999元' },
    ],
  },
  {
    name: 'E2-商品名白底高亮',
    activities: [
      { id: 1, content: '珠宝盛宴', discountDetail: '黄金铂金钻石翡翠全场满减', highlight: '黄金', bgColor: '#1A3C2A' },
      { id: 2, content: '手镯专场', discountDetail: '古法金手镯翡翠手镯特价促销', highlight: '手镯', bgColor: '#1A3C2A' },
    ],
  },
  {
    name: 'E2b-高亮+单图混合',
    activities: [
      { id: 1, content: '珠宝盛宴', discountDetail: '黄金铂金钻石翡翠全场满减', highlight: '黄金', bgColor: '#1A3C2A' },
      { id: 2, content: '钻石', discountDetail: '精选钻石8折优惠', imageUrls: [IMG] },
    ],
  },
  {
    name: 'E3-大量活动溢出',
    activities: [
      { id: 1, content: '进店送礼', discountDetail: '进店即送精美礼品一份' },
      { id: 2, content: '抽奖活动', discountDetail: '消费满500即可参与抽奖' },
      { id: 3, content: '黄金', discountDetail: '黄金克减50', imageUrls: [IMG] },
      { id: 4, content: '钻石', discountDetail: '钻石8折', imageUrls: [IMG] },
      { id: 5, content: '翡翠', discountDetail: '翡翠满减', imageUrls: [IMG] },
      { id: 6, content: '珍珠', discountDetail: '珍珠买一送一', imageUrls: [IMG] },
      { id: 7, content: '白银', discountDetail: '白银手镯特价', imageUrls: [IMG] },
      { id: 8, content: '黄金手镯', discountDetail: '黄金手镯每克立减50元', imageUrls: [IMG, IMG] },
    ],
  },
  {
    name: 'E4-超长文字',
    activities: [
      { id: 1, content: '黄金大促', discountDetail: '黄金每克立减50元，工费全免，满额再减，进店即送精美礼品，消费满1000还可参与抽奖' },
      { id: 2, content: '钻石盛宴', discountDetail: '精选钻石全场8折优惠，镶嵌工费全免，购买钻石项链赠送精美首饰盒' },
    ],
  },
  {
    name: 'E5-短文字极简',
    activities: [
      { id: 1, content: '黄金', discountDetail: '克减50' },
      { id: 2, content: '钻石', discountDetail: '8折' },
      { id: 3, content: '翡翠', discountDetail: '满减' },
    ],
  },
];

// 生成纯色渐变背景
async function createTestBackground() {
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1A3C2A"/>
        <stop offset="50%" stop-color="#0D2818"/>
        <stop offset="100%" stop-color="#061510"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <text x="${W / 2}" y="300" text-anchor="middle" font-size="80px" fill="#FFD700" font-family="SimHei">测试背景</text>
  </svg>`;
  return await sharp(Buffer.from(svg)).png().toBuffer();
}

async function run() {
  console.log(`\n===== SVG渲染测试（完整版）=====`);
  console.log(`画布: ${W}x${H}`);
  console.log(`测试用例: ${testCases.length}个\n`);

  const bg = await createTestBackground();
  let pass = 0;
  let fail = 0;

  for (const tc of testCases) {
    console.log(`--- ${tc.name} ---`);
    console.log(`  活动数: ${tc.activities.length}`);
    const types = tc.activities.map(a =>
      !a.imageUrls || a.imageUrls.length === 0 ? 'T' :
      a.imageUrls.length === 1 ? 'S' : 'M'
    );
    console.log(`  类型组合: [${types.join(', ')}]`);

    // 打印布局信息
    const layout = computeLayout(tc.activities, W, H);
    if (layout) {
      console.log(`  行模式: [${layout.rowPattern.join(', ')}]`);
      layout.M.forEach((m, i) => {
        console.log(`    模块${i + 1}: ${m.layout.toUpperCase()} | ${m.cols}列 | ${m.hasImg ? '有图' : '无图'} | 尺寸${m.moduleW}x${m.rowH}`);
      });
    }

    // 渲染
    try {
      const merchantInfo = { address: 'XX市XX区珠宝街888号', phone: '400-888-9999' };
      const result = await renderBackPoster(bg, tc.activities, merchantInfo, '测试品牌', {
        width: W, height: H,
        bgColor: '#1A3C2A',
        primaryColor: '#2E8B57',
        secondaryColor: '#8B4513',
      });
      const outPath = path.join(OUTPUT_DIR, `test_${tc.name}.png`);
      fs.writeFileSync(outPath, result);
      console.log(`  输出: ${outPath}`);
      pass++;
    } catch (err) {
      console.error(`  !! 渲染失败: ${err.message}`);
      fail++;
    }
    console.log('');
  }

  console.log(`===== 全部完成 =====`);
  console.log(`通过: ${pass} / 失败: ${fail} / 总计: ${testCases.length}`);
  console.log(`输出目录: ${OUTPUT_DIR}`);
}

run().catch(console.error);
