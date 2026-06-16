/**
 * 反面海报背景提示词（v5 - 与正面保持一致，严禁色号等技术参数）
 * AI只画纯装饰背景，所有文字布局由SVG精确渲染
 */
const { getFestivalBgDesign } = require('./front');

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

function getColorBrightness(hex) {
  if (!hex || !hex.startsWith('#')) return 128;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return r * 0.299 + g * 0.587 + b * 0.114;
}

function buildBackBgPrompt(data) {
  const { primaryColor, secondaryColor, bgColor, festivalId } = data;

  const primaryName = hexToColorName(primaryColor) || '主色';
  const secondaryName = hexToColorName(secondaryColor) || '辅助色';
  const bgName = hexToColorName(bgColor) || '深色';

  const parts = [];
  parts.push('生成一张竖版纯装饰背景图，这是珠宝促销海报的反面，必须与正面海报属于同一套设计。');
  parts.push('');
  parts.push('【配色——必须与正面完全一致】');
  parts.push(`- 整体色调：以${bgName}为主基调，${primaryName}为辅助色调`);
  parts.push(`- 渐变：从画面顶部的${bgName}自然过渡到底部的${primaryName}，渐变方向与正面海报一致`);
  parts.push(`- ${secondaryName}仅作为极少量的光晕点缀，不可大面积使用`);
  parts.push('- 色彩饱和度、明暗对比必须与正面海报保持一致，正反面放在一起必须能明显看出是同一套设计');
  parts.push('');
  parts.push('【风格：简洁干净】');
  parts.push('- 背景以渐变色为绝对主体，占据画面95%以上面积');
  parts.push('- 只在画面四角和最边缘点缀极少量珠宝风格的微光粒子、细小钻石闪光');
  parts.push('- 中间大面积区域必须保持纯净渐变，不添加任何花纹、图案、纹理');
  parts.push('- 不需要任何具象元素（龙舟、粽子、灯笼等），只需要正确的配色');
  parts.push('');
  parts.push('【禁止】');
  parts.push('- 任何文字、数字、字母、符号');
  parts.push('- 色号、代码、百分比、坐标等技术参数');
  parts.push('- 水印、logo、平台标识');
  parts.push('- 黑边、留白、未绘制区域');
  parts.push('- 线框、方框、矩形框、网格线、分割线、装饰线条');
  parts.push('- 大面积花纹、密集装饰、具象节日图案');
  parts.push('- 与正面不一致的色调或渐变方向');
  parts.push('- 任何几何形状的边框或轮廓线');

  return parts.join('\n');
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

/**
 * v1 旧版提示词（兜底用）— AI生成完整海报含文字
 */
function buildBackPrompt(data) {
  const { activities, merchantInfo, colorScheme, brand, primaryColor, secondaryColor, bgColor } = data;
  const bgBright = getColorBrightness(bgColor || '#1A1A2E');
  const fillHint = bgBright < 128 ? '比背景更鲜亮、更饱和的颜色' : '比背景更鲜亮、更明亮的颜色';

  // 将色号转为自然语言，防止泄露到生成图中
  const primaryName = hexToColorName(primaryColor) || '主色';
  const secondaryName = hexToColorName(secondaryColor) || '辅助色';
  const bgName = hexToColorName(bgColor) || '深色';

  const parts = [];
  parts.push('生成一张竖版高端珠宝促销海报反面，整张画面从上到下铺满，不留空白边缘。');
  parts.push(`整体配色方案：${colorScheme}，使用${primaryName}作为主色调，${secondaryName}作为辅助色，${bgName}作为背景基底。`);
  parts.push('这张海报是同一套设计的反面，背景风格、配色、渐变方向、光效质感必须与正面海报高度一致。');
  parts.push('');
  parts.push('【背景】');
  parts.push('与正面海报完全相同的精致华丽渐变背景，包括相同的渐变方向、细腻的光泽纹理、柔光效果，视觉上正反面必须是一套完整的设计。');

  parts.push('');
  parts.push('【布局要求】');
  parts.push('海报从上到下分两个区域：');

  // 活动详情区
  parts.push('');
  parts.push('上方区域：活动详情区（占据海报大部分面积）');
  parts.push('- 顶部有一个精致的小标题"活动详情"或"更多优惠"，字体小巧优雅，带有装饰线');
  parts.push('- 下方排列各个活动模块，每个模块用简洁的圆角矩形线框包裹（纤细线条，不要太粗）');
  parts.push(`- 模块背景使用${fillHint}的半透明底色`);
  parts.push('- 每个活动模块内部只展示简洁的文案，不要出现"优惠类型：""活动内容：""优惠详情："等标签文字');
  parts.push('- 模块之间留有适当间距，整体整齐干净');

  if (!activities || activities.length === 0) {
    parts.push('（无活动内容）');
  } else {
    activities.forEach((act, idx) => {
      parts.push('');
      parts.push(`[活动${idx + 1}模块]`);
      if (act.bgColor) {
        parts.push(`模块背景色使用${hexToColorName(act.bgColor) || '柔和半透明'}的色调`);
      }
      const textLines = [];
      if (act.discountDetail) {
        textLines.push(act.discountDetail);
      } else if (act.content) {
        textLines.push(act.content);
      }
      if (textLines.length > 0) {
        parts.push('模块内文案（不要标签，直接展示以下文字）：');
        textLines.forEach(line => parts.push(`  - "${line}"`));
      }
    });
  }

  // 商家信息区
  parts.push('');
  parts.push('底部区域：商家信息区（紧贴海报底部）');
  parts.push('- 位于海报最底部，与上方区域有自然渐变过渡，不要明显的分割线');
  parts.push('- 字体正常大小，颜色柔和，居中排列');
  if (merchantInfo) {
    const infoLines = [];
    if (merchantInfo.name) infoLines.push(merchantInfo.name);
    if (merchantInfo.address) infoLines.push(merchantInfo.address);
    if (merchantInfo.phone) infoLines.push(`电话：${merchantInfo.phone}`);
    if (merchantInfo.wechat) infoLines.push(`微信：${merchantInfo.wechat}`);
    if (infoLines.length) {
      parts.push('商家信息（居中排列，不要标签头，直接展示信息）：');
      infoLines.forEach(line => parts.push(`  - "${line}"`));
    }
  }
  if (brand) {
    parts.push(`- 品牌标识：${brand}，精致小巧显示在最底部`);
  }

  // 约束
  parts.push('');
  parts.push('【重要约束】');
  parts.push('- 背景、配色、光效、纹理必须与正面海报保持完全一致');
  parts.push('- 背景必须铺满整张海报，不能有空白或黑边');
  parts.push('- 活动模块内只展示文案内容，不显示字段标签');
  parts.push('- 线框精致纤细，不可太粗或突兀');
  parts.push('- 只能使用上面列出的文案内容，不添加任何额外文案或虚构信息');
  parts.push('- 文字清晰可读，中文排版，高端大气');
  parts.push('- 严禁在海报上显示任何色号、十六进制颜色代码、RGB数值、百分比数字、百分号、比例数字、坐标或任何技术参数');
  parts.push('- 生成的海报不得包含任何水印、平台标识、LOGO或额外文字叠加');

  return parts.join('\n');
}

module.exports = { buildBackBgPrompt, buildCarStickerBgPrompt, buildBackPrompt };
