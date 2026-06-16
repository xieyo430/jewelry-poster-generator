/**
 * 正面海报提示词（v5 - 严禁色号等技术参数，每个节日独立背景）
 */

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

function pickContrastColorName(bgColor, color1, color2) {
  const bgBright = getColorBrightness(bgColor);
  const b1 = getColorBrightness(color1);
  const b2 = getColorBrightness(color2);
  if (bgBright < 128) {
    return hexToColorName(b1 > b2 ? color1 : color2);
  } else {
    return hexToColorName(b1 < b2 ? color1 : color2);
  }
}

function getFestivalBgDesign(festivalId) {
  // 统一格式：节日色渐变 + 边缘少量节日物品和珠宝装饰
  const designs = {
    'spring-festival': {
      color: '以红色为主色调，从深红渐变到亮红，搭配鎏金色点缀',
      deco: '画面四周和边缘装饰红灯笼、祥云、烟花、鞭炮、福字、春联剪影、金色元宝、红宝石闪光、金珠散落等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字',
      ban: '严禁出现绿色、蓝色等非春节配色',
    },
    'yuanxiao': {
      color: '以暖橙红色为主色调，搭配金色点缀',
      deco: '画面四周和边缘装饰花灯、圆月、祥云、汤圆、灯谜条幅、珍珠光点、金色吊坠、琥珀散光等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字',
      ban: '',
    },
    'dragon-boat': {
      color: '以翠绿色为主色调，从深绿渐变到青绿，搭配金色点缀',
      deco: '画面四周和边缘装饰粽叶、水波纹、龙舟剪影、粽子、艾草、香囊、翡翠光泽、金色细链、绿松石光点等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字',
      ban: '严禁出现红灯笼、春联等春节元素',
    },
    'mid-autumn': {
      color: '以深蓝夜空色为主色调，搭配银白月光和金色点缀',
      deco: '画面四周和边缘装饰圆月、桂花枝、祥云、玉兔、月饼、嫦娥剪影、钻石星辉、月光石光泽、银色星点等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字',
      ban: '',
    },
    'chongyang': {
      color: '以暖黄、橙色为主色调，搭配金色点缀',
      deco: '画面四周和边缘装饰菊花、山峦、仙鹤、茱萸、酒杯、风筝、琥珀光泽、金色饰纹、蜜蜡光晕等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字',
      ban: '',
    },
    'laban': {
      color: '以暖红、深棕为主色调，搭配金色点缀',
      deco: '画面四周和边缘装饰窗花、年画纹样、腊八粥碗、五谷杂粮、红玛瑙光泽、金色祥云、朱砂光点等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字',
      ban: '',
    },
    'qingming': {
      color: '以嫩绿色、浅青色为主色调，搭配淡金色点缀',
      deco: '画面四周和边缘装饰柳枝、纸鸢、桃花、燕子、青团、踏青人物剪影、翡翠淡绿光晕、银白细链等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字',
      ban: '',
    },
    'winter-solstice': {
      color: '以深蓝、银白为主色调，搭配金色暖光点缀',
      deco: '画面四周和边缘装饰雪花、梅花、饺子、汤圆、冰晶、冬青枝、雪花形钻石闪光、银色冰晶纹理、铂金光泽等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字',
      ban: '',
    },
    'double-holiday': {
      color: '以红色和墨绿色为主色调，上下分区，搭配鎏金色点缀',
      deco: '上半区装饰元旦元素（烟花、金马、礼炮、气球），下半区装饰圣诞元素（冬青、铃铛、圣诞树、雪花），以及钻石闪光、金色吊坠等珠宝元素',
      ban: '红绿色块严格分区，不交错混搭',
    },
    'new-arrival-autumn': {
      color: '以暖黄色为主色调，搭配橙色和鎏金色点缀',
      deco: '画面四周和边缘装饰枫叶、麦穗、稻穗、南瓜、秋叶飘落、金色麦穗纹理、琥珀暖光、金箔散落等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字',
      ban: '',
    },
    'valentine': {
      color: '以粉红色为主色调，从浅粉渐变到玫瑰红，搭配金色点缀',
      deco: '画面四周和边缘装饰玫瑰花瓣、爱心、蝴蝶结、巧克力、情书、丘比特剪影、粉水晶光泽、玫瑰金细链、红宝石散光等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字',
      ban: '严禁出现绿色、蓝色等冷色调',
    },
    'white-valentine': {
      color: '以淡粉色和白色为主色调，从纯白渐变到浅粉，搭配银色点缀',
      deco: '画面四周和边缘装饰白色玫瑰、蝴蝶结、蕾丝纹理、白色巧克力、棉花、珍珠光泽、银白细链、钻石碎光等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字',
      ban: '',
    },
    '520-day': {
      color: '以玫红色为主色调，从深粉渐变到炽热红，搭配金色点缀',
      deco: '画面四周和边缘装饰爱心、玫瑰、星光、气球、情书、告白气球、红宝石光泽、金色心形吊坠、粉钻闪光等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字',
      ban: '',
    },
  };

  const d = designs[festivalId];
  if (!d) {
    return [
      '背景设计：',
      '- 以节日主色的大面积渐变为背景主体',
      '- 画面边缘点缀少量金色细线和钻石微光，中间区域保持干净',
    ].join('\n');
  }

  const lines = [
    '背景设计：',
    `- ${d.color}`,
    `- ${d.deco}`,
    '- 装饰元素分布在画面四周和边缘，丰富但不遮挡中央的品牌名、主题和优惠信息',
  ];
  if (d.ban) lines.push(`- ${d.ban}`);
  return lines.join('\n');
}

/**
 * 从爆点文案中提取商品名称
 */
function extractProductNames(text) {
  if (!text) return [];
  const patterns = [
    /黄金/g, /铂金/g, /白银/g, /钻石/g, /翡翠/g, /玉石/g, /珍珠/g,
    /珠宝/g, /金饰/g, /银饰/g, /手链/g, /手镯/g, /项链/g, /戒指/g,
    /吊坠/g, /耳环/g, /耳钉/g, /胸针/g, /摆件/g, /金条/g, /金币/g,
    /全场/g, /足金/g, /古法金/g, /硬金/g, /K金/g,
    /绯红/g, /玫瑰金/g, /彩金/g,
  ];
  const found = [];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) found.push(...m);
  }
  // 尝试匹配引号内的名称
  const quoted = text.match(/[""「]([^""」]+)[""」]/g);
  if (quoted) found.push(...quoted.map(q => q.replace(/[""「」]/g, '')));
  return [...new Set(found)];
}

function buildFrontPrompt(data) {
  const { brand, theme, subtitle, startDate, endDate, mainPromotion, secondaryPromotion,
          mainTitle, subTitle, secMainTitle, secSubTitle,
          colorScheme, primaryColor, secondaryColor, bgColor, festivalId } = data;

  const primaryName = hexToColorName(primaryColor) || '主色';
  const secondaryName = hexToColorName(secondaryColor) || '辅助色';
  const bgName = hexToColorName(bgColor) || '深色';

  const parts = [];

  // 严格声明：海报上只能出现引号内的文案
  parts.push('你是一个专业海报设计师，正在生成一张竖版高端珠宝促销海报。');
  parts.push('');
  parts.push('最重要的规则：海报上出现的全部文字必须且只能是下面用引号括起来的文案内容。不允许出现任何其他文字、标签、标题、注释、说明性文字。');
  parts.push('');

  // 整体风格
  parts.push(`整体为高端奢华珠宝风格，配色方案：${colorScheme}，使用${primaryName}作为主色调，${secondaryName}作为辅助色，${bgName}作为背景基底。整张画面从上到下铺满，不留空白边缘。`);

  // 节日背景
  parts.push('');
  parts.push(getFestivalBgDesign(festivalId));

  // 布局
  parts.push('');
  parts.push('海报从上到下分为三个部分：');

  // 品牌
  parts.push('');
  parts.push(`第一部分：海报最顶部居中显示品牌名"${brand}"，字体精致优雅，使用书法体或衬线体，紧凑不占过多空间。`);

  // 主题+时间
  parts.push('');
  parts.push('第二部分：海报中央偏上的视觉中心位置。');
  if (theme) {
    parts.push(`显示活动主题"${theme}"，字体非常大而醒目，加粗突出，居中对齐，使用华丽艺术字体效果，可带有描金或发光效果。`);
  }
  if (subtitle) {
    parts.push(`主题下方显示副标题"${subtitle}"，字体明显小于主题，居中排列，纤细优雅。`);
  }
  if (startDate && endDate) {
    parts.push(`副标题下方显示活动时间"${startDate} 至 ${endDate}"，字体小巧精致。`);
  } else if (startDate) {
    parts.push(`副标题下方显示活动时间"${startDate}起"，字体小巧，居中。`);
  }

  // 爆点活动
  parts.push('');
  parts.push(`第三部分：海报下方大面积区域，这是整个海报最重要的促销核心，视觉权重必须最高。海报下方中央放置一个${primaryName}系圆角矩形色块，色块外围有一圈纤细的${secondaryName}描边，无外层白色包裹，背景铺满。色块占据海报下方约一半的面积，占据海报最大视觉比重。`);

  // 主爆点
  if (mainTitle) {
    parts.push(`在色块内居中显示主标题"${mainTitle}"，字号非常大而醒目，使用特大号加粗白色字体，带有发光或描边效果，确保一眼就能看到。`);
    // 检查标题中是否包含价格数字
    if (/\d+/.test(mainTitle)) {
      parts.push(`主标题中的价格数字（如${mainTitle.match(/\d+/g)?.join('、')}）必须额外突出处理：使用更大的字号、加粗、颜色改为金色或鎏金色，与周围白色文字形成明显对比，让价格数字成为视觉焦点。`);
    }
  }
  if (subTitle) {
    parts.push(`主标题下方居中显示副标题"${subTitle}"，字号明显小于主标题，使用纤细优雅的白色字体。`);
  }

  // 分割线
  if (mainTitle && secMainTitle) {
    parts.push('在主爆点和次爆点之间，居中显示一条纤细的金色水平分割线，长度约为色块宽度的三分之一，线条细腻精致。');
  }

  // 次爆点
  if (secMainTitle) {
    parts.push(`分割线下方居中显示次爆点主标题"${secMainTitle}"，字号与上方主标题接近，使用特大号加粗白色字体，带有发光效果。`);
  }
  if (secSubTitle) {
    parts.push(`次爆点主标题下方居中显示副标题"${secSubTitle}"，字号明显小于主标题，使用纤细优雅的白色字体。`);
  }

  // 约束 — 纯自然语言，无任何标签
  parts.push('');
  parts.push('严格遵守以下约束：');
  parts.push('- 海报上只能出现上面引号内的文案，不允许出现任何其他文字、标签、标题、注释');
  parts.push('- 文案内容必须一字不改原样展示，不得增删改');
  parts.push('- 同一信息只展示一次，不能重复出现');
  parts.push('- 所有文字颜色必须与背景色形成足够对比，确保清晰可读');
  parts.push('- 不得出现任何色号、十六进制颜色代码、RGB数值、百分比数字、坐标、像素值或任何技术参数');
  parts.push('- 不得出现"AI生成"、"AIGC"等水印字样，不得包含任何水印、平台标识');
  parts.push('- 背景必须铺满整张海报，从最顶部到最底部，不留任何空白区域');

  return parts.join('\n');
}

module.exports = { buildFrontPrompt, getFestivalBgDesign };
