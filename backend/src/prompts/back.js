/**
 * 反面海报底版提示词（v6 - 把真实版式交给AI，放开装饰设计自由度）
 * AI负责整张反面底版的配色与装饰构图，活动文案/商家信息仍由SVG精确渲染。
 * 与v5的区别：不再要求"纯渐变、无任何图案线条"，而是先用 computeLayout 算出
 * 文字层的真实落位，把"活动承载带/自由装饰带"写进提示词，让模型围绕真实排版
 * 做整体设计；活动少（尤其只有1个）时，留白区域由AI负责撑起画面。
 */
const { getFestivalBgDesign, getIndustryVisual } = require('./front');
const { computeLayout, MERCHANT_BAND_TOP } = require('../services/posterRenderer');

/**
 * 将hex色号转为自然语言颜色名（防止色号泄露到AI生成图中）
 */
function hexToColorName(hex) {
  if (!hex || !hex.startsWith('#')) return '';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const hsl = rgbToHsl(r, g, b);
  const [h, s, l] = hsl;

  if (s < 10) {
    if (l < 15) return '深黑色';
    if (l < 35) return '深灰色';
    if (l < 65) return '灰色';
    if (l < 85) return '浅灰色';
    return '白色';
  }
  if (l < 15) return '深黑色';
  if (l > 90) return '白色';

  let name = '';
  if (h < 15 || h >= 345) name = '红色';
  else if (h < 35) name = '橙红色';
  else if (h < 50) name = '橙色';
  else if (h < 65) name = '金橙色';
  else if (h < 80) name = '金黄色';
  else if (h < 150) name = '绿色';
  else if (h < 180) name = '青绿色';
  else if (h < 210) name = '青色';
  else if (h < 250) name = '蓝色';
  else if (h < 280) name = '蓝紫色';
  else if (h < 320) name = '紫色';
  else name = '紫红色';

  if (s > 70 && l < 40) name = '深' + name;
  if (s > 70 && l > 60) name = '亮' + name;
  if (s < 40 && l > 50) name = '浅' + name;

  return name;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s * 100, l * 100];
}

/**
 * 把 computeLayout 的真实排版翻译成给生图模型的"版式分区"说明
 * 让 AI 的装饰构图与 SVG 文字层的落位一致，避免设计与排版互相打架
 */
function buildZoneGuide(activities, W, H, industry = 'jewelry') {
  let layout;
  try {
    layout = computeLayout(activities || [], W, H);
  } catch (e) {
    return null;
  }
  if (!layout || !Array.isArray(layout.M) || layout.M.length === 0) return null;

  // 同一行的模块 y 相同，按 y 归组即可还原行结构
  const rowMap = new Map();
  layout.M.forEach(md => {
    if (!rowMap.has(md.y)) rowMap.set(md.y, []);
    rowMap.get(md.y).push(md);
  });
  const rows = [...rowMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([y, mods]) => ({ y, h: mods[0].rowH, mods }));

  const pct = v => Math.round(v * 100);
  const contentTop = rows[0].y;
  const contentBottom = Math.max(...rows.map(r => r.y + r.h));
  const merchantTop = Math.round(H * MERCHANT_BAND_TOP);
  const bottomFree = Math.max(0, merchantTop - contentBottom);
  const visual = getIndustryVisual(industry);

  const lines = [];
  lines.push('【版式分区——本次设计最重要的信息，请严格按分区安排装饰】');
  lines.push('整张画面按高度自上而下分为四段（百分比为画面高度占比）：');
  lines.push(`- 顶部自由装饰带：0% ~ ${pct(contentTop / H)}%，可自由设计`);
  lines.push(`- 活动承载带：${pct(contentTop / H)}% ~ ${pct(contentBottom / H)}%，共 ${layout.M.length} 个活动块、${rows.length} 行：`);
  rows.forEach((r, i) => {
    const mod = r.mods[0];
    const range = `${pct(r.y / H)}% ~ ${pct((r.y + r.h) / H)}%`;
    if (r.mods.length === 1) {
      lines.push(`  · 第 ${i + 1} 行（画面高度 ${range}）：1 个活动块，左右通栏，宽约画面的 ${pct(mod.cardW / W)}%`);
    } else {
      lines.push(`  · 第 ${i + 1} 行（画面高度 ${range}）：${r.mods.length} 个活动块左右并排，每块宽约画面的 ${pct(mod.cardW / W)}%`);
    }
    if (r.mods.some(m => m.hasImg)) {
      const imgLayouts = [...new Set(r.mods.filter(m => m.hasImg).map(m => m.layout))];
      const posHint = imgLayouts.length === 1
        ? `，${imgLayouts[0] === 'tb' ? '图片在上、文字在下' : '文字在左、图片在右'}`
        : '';
      lines.push(`    （本行带商品图${posHint}，装饰请避开图片位置）`);
    }
  });
  const bottomIsMain = bottomFree >= H * 0.4;
  lines.push(`- 底部自由装饰带：${pct(contentBottom / H)}% ~ ${pct(merchantTop / H)}%${bottomIsMain ? '，面积最大的自由发挥区' : ''}`);
  lines.push(`- 商家信息带：${pct(merchantTop / H)}% ~ 100%，保持安静低对比的底衬，不放任何装饰`);
  lines.push('');
  lines.push('活动承载带的硬性要求（只有这一条是硬约束，其余都可以自由发挥）：');
  lines.push('- 这一带只做"安静"的底子：柔和渐变、轻微光晕即可，不要细密纹样、高饱和色块、强对比线条、密集闪光');
  lines.push('- 程序稍后会在这一带叠加半透明白色卡片和整段文字，所以底子越干净、成品越高级');
   lines.push('- 不要在承载带内画文字、数字、卡片方框或文字占位框（卡片与文字都由程序绘制）');
  lines.push('- 装饰不要横穿活动承载带；画面最外围可以做统一的装饰边框与角花，但不要压到文字区');
  lines.push('');
  lines.push('自由装饰带的发挥建议：');
  if (bottomIsMain) {
    lines.push(`- 下方自由装饰带约占画面 ${pct(bottomFree / H)}%，远大于活动承载带：请把整张图的视觉主体放在这里（${visual.decor}、对称纹样与柔和光带），用大面积渐变加一两处精致细节撑住画面`);
    lines.push('- 构图要"上轻下重"：上部是信息区、下部是视觉区，避免出现"上面一块小卡片、下面一大片空"的效果');
  } else {
    lines.push('- 自由空间不多，装饰要均匀有节奏：用横向的装饰线、光带把各活动块串成一套版面，而不是各自孤立的框');
  }
  if (layout.M.length === 1) {
    lines.push('- 本次只有 1 个活动块，不要把装饰都堆在它附近，周围留白处正是展示质感的地方');
  }
  return lines;
}

/**
 * 反面海报底版提示词 —— AI 设计整张底版，文字由 SVG 渲染
 */
function buildBackBgPrompt(data) {
  const { primaryColor, secondaryColor, bgColor, festivalId, activities } = data;
  const visual = getIndustryVisual(data.industry);

  const primaryName = hexToColorName(primaryColor) || '主色';
  const secondaryName = hexToColorName(secondaryColor) || '辅助色';
  const bgName = hexToColorName(bgColor) || '深色';

  const W = data.size?.width || 2100;
  const H = data.size?.height || 2970;

  const zoneLines = buildZoneGuide(activities, W, H, data.industry);
  const festivalDesign = getFestivalBgDesign(festivalId, data.industry) || '';
  const decoLine = festivalDesign.split('\n').find(line => line.startsWith('-') && line.includes('装饰')) || '';
  const banLine = festivalDesign.split('\n').find(line => line.startsWith('-') && line.includes('严禁')) || '';
  const deco = decoLine.replace(/^[-\s]+/, '');
  const ban = banLine.replace(/^[-\s]+/, '');

  const parts = [];
  parts.push(`你是一位${visual.name}行业海报设计师，正在设计一张竖版${visual.name}促销海报的「反面」信息页底版。`);
  parts.push('正面海报已经完成，反面必须与它属于同一套设计；反面上的活动文案与商家信息由后期程序精确叠加，你不需要画任何文字。');
  parts.push('');
  parts.push('【配色——必须与正面完全一致】');
  parts.push(`- 整体色调：以${bgName}为主基调，${primaryName}为辅助色调，${secondaryName}仅作为极少量的光晕点缀`);
  parts.push(`- 渐变：从画面顶部的${bgName}自然过渡到底部的${primaryName}，渐变方向与正面海报一致`);
  parts.push(`- 质感：${visual.style}，但必须为后期信息卡片预留清晰、均匀、低纹理的承载面`);
  parts.push('');
  if (zoneLines) {
    zoneLines.forEach(l => parts.push(l));
    parts.push('');
  }
  parts.push('【放开去设计——下面这些都在你的发挥范围内】');
  parts.push(`- 节日与行业装饰元素：${deco || visual.decor}`);
  parts.push('- 可以把元素放大、重组，做对称构图或对角构图，不必只在四角点几个小装饰');
  parts.push('- 可以画统一的装饰外框、角花、缎带、分隔纹样、光带、星芒、丝绒与绸缎褶皱质感');
  parts.push('- 渐变之外允许光晕、光斑、柔光散景、细腻底纹，只要不破坏上面分区里"活动承载带要安静"这一条');
  parts.push('');
  parts.push('【禁止】');
  parts.push('- 任何文字、数字、字母、符号、书法笔触、文字占位框');
  parts.push('- 色号、代码、百分比、坐标等技术参数');
  parts.push('- 水印、logo、平台标识、二维码');
  parts.push('- 黑边、留白、未绘制区域（整张必须铺满）');
  parts.push('- 与正面不一致的色调或渐变方向');
  if (ban) parts.push(`- ${ban}`);

  return parts.join('\n');
}

function buildBackPosterPrompt(data) {
  const { brand, merchantInfo = {}, activities = [], primaryColor, secondaryColor, bgColor, festivalId } = data;
  const visual = getIndustryVisual(data.industry);
  const festival = getFestivalBgDesign(festivalId, data.industry) || '';
  const activityLines = activities.map((activity, index) => {
    const detail = activity.discountDetail || activity.content || '活动礼遇';
    const highlight = activity.highlight ? `，重点突出“${activity.highlight}”` : '';
    return `${index + 1}. ${activity.discountType || '优惠活动'}：${detail}${highlight}`;
  }).join('\n');
  const merchantName = String(merchantInfo.name || '').trim();
  const merchantDisplayName = brand && merchantName.startsWith(brand)
    ? merchantName.slice(brand.length).replace(/^(?:珠宝|餐饮|數码家电|数码家电)/, '').trim() || '门店'
    : merchantName;
  const merchantLine = [merchantDisplayName, merchantInfo.address, merchantInfo.phone && `电话：${merchantInfo.phone}`]
    .filter(Boolean).join(' | ');
  if (data.industry === 'food') {
    const food = data.foodCampaign || {};
    const mode = food.mode === 'combo' ? '套餐促销' : food.mode === 'store-event' ? '门店活动' : '招牌菜推荐';
    return [
      `你是餐饮美食行业平面设计师，请生成一张竖版${mode}海报反面信息页。`,
      '反面必须是清晰的餐饮运营信息页，不要使用珠宝、钻石、金属首饰或奢华珠宝装饰。',
      '这是最终成品，不要生成需要后期叠加的空背景；所有提供的文字必须清晰、完整、只出现一次。',
      `品牌：${brand}`,
      `活动信息：\n${activityLines || '暂无活动'}`,
      `门店信息：${merchantLine || '未提供'}`,
      food.setContents && `套餐内容：${food.setContents}`,
      food.dishDescription && `菜品卖点：${food.dishDescription}`,
      food.eventRule && `使用规则：${food.eventRule}`,
      `配色：${primaryColor || '暖色'}为主色，${secondaryColor || '高亮色'}强调价格和行动，${bgColor || '浅暖背景'}为底色。`,
      '版式：顶部只放一次品牌名和“活动详情”小标题；中部按“优惠利益点、菜品/套餐内容、使用规则”分区排列；底部放门店地址、电话和消费方式。',
      '采用温暖、明亮、易读的餐饮菜单视觉，卡片轻薄、留白充足，不能用厚重不透明色块覆盖食物或文字。',
      '禁止重复品牌名、增加未提供的菜品或价格、生成二维码、水印、平台标识、乱码或无关文字。',
    ].filter(Boolean).join('\n');
  }
  return [
    `你是一位${visual.name}行业平面设计师，请直接生成一张完整的竖版${visual.name}促销海报反面。`,
    `整体视觉风格：${visual.style}。`,
    '这是最终成品，不要生成单独背景，不要留给程序叠加任何卡片、文字或装饰。',
    '所有文字必须清晰、完整、简体中文，不能乱码，不能重复，不能添加未提供的信息。',
    `品牌：${brand}`,
    `节日风格参考：${festival || '与正面海报保持同一配色和材质'}`,
    `主色：${primaryColor || '节日主色'}，辅助色：${secondaryColor || '金色'}，背景：${bgColor || '深色渐变'}`,
    '',
    '反面版式：顶部只出现一次品牌名和“活动礼遇”小标题；中部使用 1 至 3 个层次清晰、留白充足的活动信息卡片；每张卡片只放一条活动，不要把多条活动挤在同一行；底部为普通门店信息栏。',
    '活动卡片要有清晰的主次字号，金额、折扣、赠品等重点用节日辅助色突出；不要使用覆盖整张画面的厚重色块，不要用大面积不透明黑框遮挡背景。',
    `活动内容：\n${activityLines || '暂无活动'}`,
    `底部门店信息（只能作为小号普通信息，不得作为品牌标题，不要重复品牌名）：${merchantLine || '未提供'}`,
    '',
    `禁止：品牌“${brand}”在画面中出现超过一次；水印、二维码、平台标识、AI字样、无关文字、乱码、英文占位符、边缘裁切、被背景纹理遮挡的文字。`,
  ].join('\n');
}

/**
 * 车贴背景提示词 — AI只画背景，文字由SVG渲染
 */
function buildCarStickerBgPrompt(data) {
  const { primaryColor, secondaryColor, bgColor, width, height } = data;

  const primaryName = hexToColorName(primaryColor) || '主色';
  const secondaryName = hexToColorName(secondaryColor) || '辅助色';
  const bgName = hexToColorName(bgColor) || '深色';
  const orientation = width > height ? '横版' : '竖版';

  const parts = [];
  parts.push(`生成一张${orientation}车贴装饰背景图，整张画面铺满，不留空白边缘。`);
  parts.push(`配色：以${bgName}为底色，从上到下渐变到${primaryName}，用${secondaryName}的光晕做点缀。`);
  parts.push('');
  parts.push('要求：');
  parts.push(`- 整张画面铺满${bgName}到${primaryName}的渐变`);
  parts.push(`- ${secondaryName}的醒目光泽、光晕点缀`);
  parts.push('- 画面鲜艳醒目、适合车贴使用');
  parts.push('- 带有金属质感纹理、钻石璀璨光效');
  parts.push('- 适当加入珠宝风格装饰：金色流线、星光闪烁、菱形切割面折射效果');
  parts.push('- 可以有细腻纹理、渐变光效');
  parts.push('');
  parts.push('禁止：');
  parts.push('- 任何文字、数字、字母、符号');
  parts.push('- 色号、代码、百分比、坐标等技术参数');
  parts.push('- 水印、logo、平台标识');
  parts.push('- 黑边、留白、未绘制区域');

  return parts.join('\n');
}

module.exports = { buildBackBgPrompt, buildBackPosterPrompt, buildCarStickerBgPrompt };
