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

  const primaryName = hexToColorName(primaryColor) || '主色';
  const secondaryName = hexToColorName(secondaryColor) || '辅助色';
  const bgName = hexToColorName(bgColor) || '深色';

  // 收集所有必须显示的文案
  const allTexts = [];
  if (merchantInfo?.name) allTexts.push(merchantInfo.name);
  if (merchantInfo?.address) allTexts.push(merchantInfo.address);
  if (merchantInfo?.phone) allTexts.push('电话：' + merchantInfo.phone);
  if (brand) allTexts.push(brand);
  (activities || []).forEach(act => {
    const text = act.discountDetail || act.content;
    if (text) allTexts.push(text);
  });

  const parts = [];
  parts.push('生成一张竖版高端珠宝促销海报反面，整张画面从上到下铺满，不留空白边缘。');
  parts.push(`配色方案：${colorScheme}，${primaryName}为主色调，${secondaryName}为辅助色，${bgName}为背景。与正面海报风格一致。`);
  parts.push('');
  parts.push('【最重要的规则】');
  parts.push('海报上允许出现的文字有且仅有以下这些，多一个字都不行：');
  allTexts.forEach(t => parts.push(`  "${t}"`));
  parts.push('除以上文字外，不得出现任何其他文字、标签、注释、说明、水印。');
  parts.push('');

  parts.push('【背景】');
  parts.push('与正面海报相同的渐变背景，配色、光效、纹理保持一致。');

  parts.push('');
  parts.push('【布局】');
  parts.push('上方排列活动模块，底部显示商家信息。');

  if (!activities || activities.length === 0) {
    parts.push('（无活动内容）');
  } else {
    activities.forEach((act, idx) => {
      const text = act.discountDetail || act.content;
      if (text) {
        parts.push(`模块${idx + 1}：用圆角矩形线框包裹，内部居中显示"${text}"。`);
      }
    });
  }

  if (merchantInfo) {
    const infoLine = [merchantInfo.name, merchantInfo.address, merchantInfo.phone ? '电话：' + merchantInfo.phone : ''].filter(Boolean).join('  |  ');
    if (infoLine) {
      parts.push(`底部居中显示"${infoLine}"，字体柔和，与上方有自然过渡。`);
    }
  }

  // 约束
  parts.push('');
  parts.push('【严格约束】');
  parts.push('- 只显示上面引号内的文案，一字不改');
  parts.push('- 同一文案只出现一次');
  parts.push('- 背景铺满，无空白或黑边');
  parts.push('- 线框纤细精致');
  parts.push('- 严禁色号、技术参数、水印');

  return parts.join('\n');
}

module.exports = { buildBackBgPrompt, buildCarStickerBgPrompt, buildBackPrompt };
