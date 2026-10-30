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

function getIndustryVisual(industry) {
  if (industry === 'food') {
    return {
      name: '餐饮美食',
      style: '温暖鲜明、富有烟火气与食欲感，突出真实食材纹理、菜品层次和新鲜热气',
      decor: '新鲜食材、招牌菜品、餐桌器皿、蒸汽热气与暖色食欲光',
      focus: '菜品与套餐优惠',
    }
  }
  if (industry === 'electronics') {
    return {
      name: '数码家电',
      style: '现代清晰、有科技感，突出真实产品轮廓、屏幕光效和简洁的性能氛围',
      decor: '手机、耳机、智能家电的简洁轮廓、屏幕光效与科技光轨',
      focus: '数码产品与价格优惠',
    }
  }
  return {
    name: '珠宝饰品',
    style: '高端、精致、奢华，突出金属光泽与珠宝质感',
    decor: '金属光泽、宝石折射、珠宝细节与优雅光点',
    focus: '珠宝与价格优惠',
  }
}

function getFestivalBgDesign(festivalId, industry = 'jewelry') {
  // 统一格式：节日色渐变 + 边缘少量节日物品和珠宝装饰
  const designs = {
    'spring-festival': {
      color: '以红色为主色调，从深血红渐变到鲜亮的中国红，搭配鎏金色点缀',
      deco: '画面四周和边缘装饰红灯笼、祥云、烟花、鞭炮、福字、春联剪影、金色元宝、红宝石闪光、金珠散落等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字',
      ban: '严禁出现绿色、蓝色等非春节配色',
    },
    'national-day': {
      color: '以国旗红色为主色调，从深绛红渐变到鲜亮的旗帜红，搭配五星明黄色点缀',
      deco: '画面四周和边缘装饰金色五角星、华表与天安门剪影、红绸、和平鸽、礼花、金珠散落等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字',
      ban: '严禁出现紫色、绿色等非国庆配色',
    },
    'yuanxiao': {
      color: '以靛蓝色夜空为主色调，画面下方晕染花灯透出的暖橙色光，搭配月白色点缀',
      deco: '画面四周和边缘装饰透出暖光的花灯、圆月、祥云、汤圆、灯谜条幅、珍珠光点、金色吊坠、琥珀散光等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字',
      ban: '严禁大面积使用纯红色，避免与春节雷同',
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
      color: '以深玫瑰红色为主色调，从酒红渐变到玫红，搭配藕粉色点缀',
      deco: '画面四周和边缘装饰玫瑰花瓣、爱心、蝴蝶结、巧克力、情书、丘比特剪影、粉水晶光泽、玫瑰金细链、红宝石散光等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字',
      ban: '严禁出现绿色、蓝色等冷色调',
    },
    'white-valentine': {
      color: '以淡粉色和白色为主色调，从纯白渐变到浅粉，搭配银色点缀',
      deco: '画面四周和边缘装饰白色玫瑰、蝴蝶结、蕾丝纹理、白色巧克力、棉花、珍珠光泽、银白细链、钻石碎光等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字',
      ban: '',
    },
    '520-day': {
      color: '以鲜亮的珊瑚红色为主色调，搭配暖橙色点缀',
      deco: '画面四周和边缘装饰爱心、玫瑰、星光、气球、情书、告白气球、红宝石光泽、金色心形吊坠、粉钻闪光等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字',
      ban: '',
    },
    'new-year': {
      color: '以深蓝色跨年夜空为主色调，搭配香槟金色烟花和暖红色点缀',
      deco: '画面四周和边缘装饰绽放的烟花、气球、彩带、礼花、金色光点、钻石微光等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字',
      ban: '',
    },
    'grand-opening': {
      color: '以朱红色为主色调，搭配鎏金色点缀',
      deco: '画面四周和边缘装饰开业花篮、红绸、礼花、迎宾灯笼柱、金色牌匾、金箔、钻石微光等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字',
      ban: '',
    },
    'women-day': {
      color: '以玫金粉色为主色调，搭配香槟金色点缀',
      deco: '画面四周和边缘装饰花朵、丝带、蝴蝶、爱心、珍珠光泽、玫瑰金细链、粉钻微光等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字',
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

  if (industry !== 'jewelry') {
    const visual = getIndustryVisual(industry)
    const festivalDecor = d.deco
      .replace(/红宝石闪光|金珠散落|珍珠光点|金色吊坠|琥珀散光|翡翠光泽|金色细链|绿松石光点|钻石星辉|月光石光泽|银色星点|琥珀光泽|金色饰纹|蜜蜡光晕|翡翠淡绿光晕|银白细链|雪花形钻石闪光|铂金光泽|钻石闪光|钻石微光|粉水晶光泽|玫瑰金细链|粉钻闪光|金色心形吊坠|珍珠光泽/g, '')
      .replace(/等节日与珠宝元素/g, '')
      .replace(/、{2,}/g, '、')
      .replace(/、+([，,])/g, '$1')
      .replace(/[、，\s]+$/, '')
    return [
      '背景设计：',
      `- ${d.color}`,
      `- ${festivalDecor}，融入${visual.decor}，构图有节日氛围但不遮挡中央文字`,
      '- 装饰分布在画面边缘，中央信息区保持干净清晰',
      d.ban && `- ${d.ban}`,
    ].filter(Boolean).join('\n')
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
  const visual = getIndustryVisual(data.industry)

  const primaryName = hexToColorName(primaryColor) || '主色';
  const secondaryName = hexToColorName(secondaryColor) || '辅助色';
  const bgName = hexToColorName(bgColor) || '深色';

  if (data.industry === 'food') {
    const food = data.foodCampaign || {};
    const mode = food.mode === 'combo' ? '套餐促销' : food.mode === 'store-event' ? '门店活动' : '招牌菜推荐';
    const foodTexts = [brand, theme, subtitle, mainTitle, subTitle, secMainTitle, secSubTitle,
      food.dishName, food.sellingPoints, food.setContents, food.eventType, food.eventRule,
      food.gift, food.actionText, food.promoPrice, food.originalPrice].filter(Boolean);
    const dateText = startDate && endDate ? `${startDate} 至 ${endDate}` : startDate ? `${startDate}起` : '';
    if (dateText) foodTexts.push(dateText);
    return [
      `你是餐饮美食行业的专业平面设计师，生成一张竖版${mode}海报正面。`,
      '这不是珠宝海报，不要使用珠宝、金属、钻石、首饰、奢华礼盒或节日珠宝装饰。',
      '',
      '【文字白名单】海报只允许出现以下文字，必须逐字显示，不得新增、改写或重复：',
      ...[...new Set(foodTexts)].map(text => `  "${text}"`),
      '除白名单外不得出现任何文字、数字、英文、二维码、水印或平台标识。',
      '',
      `视觉方向：${visual.style}。使用${primaryName}作为主色、${secondaryName}作为强调色、${bgName}作为背景。`,
      '整张画面铺满，采用真实美食摄影广告感：自然光、食材纹理、热气、酱汁光泽、餐桌质感，主体清晰且有食欲。',
      food.dishImageUrl ? '优先围绕用户提供的真实菜品图片进行主视觉构图，不要重新捏造完全不同的菜品。' : '主视觉使用清晰、真实、可辨认的菜品或套餐摆盘，不要使用抽象珠宝物件。',
      mode === '招牌菜推荐' ? '布局：顶部品牌名；中部大面积菜品主视觉；下方突出菜品名、口味卖点和价格/优惠；行动文案放在底部清晰位置。' :
        mode === '套餐促销' ? '布局：顶部品牌名；中部展示套餐组合；下方用清晰价格对比突出原价与活动价、适用人数和立即预订行动。' :
          '布局：顶部品牌名；中部以活动机制和优惠数字为第一视觉；下方补充赠品、参与方式和到店行动。',
      '文字区域保持干净，有足够留白和高对比度，任何背景纹理、食物或装饰都不得覆盖文字。',
      '禁止大面积不透明色块遮挡菜品，禁止双图堆叠造成主体覆盖，禁止乱码、重复品牌名和无关文案。',
    ].join('\n');
  }

  // 收集所有必须显示的文案，用引号明确标出
  const allTexts = [brand, theme, subtitle, mainTitle, subTitle, secMainTitle, secSubTitle].filter(Boolean);

  const parts = [];

  // 严格声明
  parts.push(`你是${visual.name}行业的专业海报设计师，正在生成一张竖版${visual.name}促销海报。`);
  parts.push('');
  parts.push('【最重要的规则】');
  parts.push('海报上允许出现的文字有且仅有以下这些，用引号标出，多一个字都不行：');
  allTexts.forEach(t => parts.push(`  "${t}"`));
  if (startDate && endDate) parts.push(`  "${startDate} 至 ${endDate}"`);
  else if (startDate) parts.push(`  "${startDate}起"`);
  parts.push('除以上文字外，海报上不得出现任何其他文字、数字、字母、标签、注释、说明、水印。');
  parts.push('');

  // 整体风格
  parts.push(`整体采用${visual.style}。配色方案：${colorScheme}，使用${primaryName}作为主色调，${secondaryName}作为辅助色，${bgName}作为背景基底。围绕${visual.focus}设计主视觉，整张画面从上到下铺满，不留空白边缘。`);

  // 节日背景
  parts.push('');
  parts.push(getFestivalBgDesign(festivalId, data.industry));

  // 布局
  parts.push('');
  parts.push('海报从上到下分为三个区域：');

  // 品牌
  parts.push('');
  parts.push(`顶部区域：海报最顶部居中显示"${brand}"，字体精致优雅，使用书法体或衬线体，紧凑不占过多空间。`);

  // 主题+时间
  parts.push('');
  parts.push('中部区域：海报中央偏上的视觉中心位置。');
  if (theme) {
    parts.push(`显示"${theme}"，字体非常大而醒目，加粗突出，居中对齐，使用华丽艺术字体效果，可带有描金或发光效果。`);
  }
  if (subtitle) {
    parts.push(`下方显示"${subtitle}"，字体明显小于主题，居中排列，纤细优雅。`);
  }
  if (startDate && endDate) {
    parts.push(`再下方显示"${startDate} 至 ${endDate}"，字体小巧精致。`);
  } else if (startDate) {
    parts.push(`再下方显示"${startDate}起"，字体小巧，居中。`);
  }

  // 爆点活动
  parts.push('');
  parts.push(`下半部区域：海报下方大面积区域，这是整个海报最重要的促销核心。下方中央放置一个${primaryName}系圆角矩形色块，色块外围有一圈纤细的${secondaryName}描边。色块占据海报下方约一半面积。`);

  // 上方大字
  if (mainTitle) {
    parts.push(`在色块内居中显示"${mainTitle}"，字号非常大而醒目，使用特大号加粗白色字体，带有发光或描边效果，确保一眼就能看到。`);
    if (/\d+/.test(mainTitle)) {
      const nums = mainTitle.match(/\d+/g)?.join('、');
      parts.push(`其中的价格数字${nums}必须额外突出：更大字号、加粗、使用${secondaryName}或高对比亮色，与周围文字形成对比。`);
    }
  }
  if (subTitle) {
    parts.push(`下方居中显示"${subTitle}"，字号明显小于上方文字，使用纤细优雅的白色字体。`);
  }

  // 分割线
  if (mainTitle && secMainTitle) {
    parts.push('上下两组文字之间，居中显示一条纤细的金色水平分割线，长度约为色块宽度的三分之一。');
  }

  // 下方大字
  if (secMainTitle) {
    parts.push(`分割线下方居中显示"${secMainTitle}"，字号与上方大字接近，使用特大号加粗白色字体，带有发光效果。`);
  }
  if (secSubTitle) {
    parts.push(`再下方居中显示"${secSubTitle}"，字号明显小于大字，使用纤细优雅的白色字体。`);
  }

  // 约束
  parts.push('');
  parts.push('【严格约束】');
  parts.push('- 海报上只显示上面引号内的文案，一字不改原样展示，不得增删改');
  parts.push('- 同一文案只出现一次，不能重复');
  parts.push('- 所有文字颜色必须与背景形成足够对比，确保清晰可读');
  parts.push('- 严禁出现色号、RGB值、百分比、坐标等任何技术参数');
  parts.push('- 严禁出现"AI生成"、水印、平台标识');
  parts.push('- 背景铺满整张海报，不留空白');

  return parts.join('\n');
}

/**
 * 正面海报背景提示词 — AI只画背景，文字由Leafer UI渲染
 */
function buildFrontBgPrompt(data) {
  const { colorScheme, primaryColor, secondaryColor, bgColor, festivalId } = data;
  const visual = getIndustryVisual(data.industry)

  const primaryName = hexToColorName(primaryColor) || '主色';
  const secondaryName = hexToColorName(secondaryColor) || '辅助色';
  const bgName = hexToColorName(bgColor) || '深色';

  const parts = [];
  parts.push(`生成一张竖版纯装饰背景图，这是${visual.name}促销海报的正面；采用${visual.style}。`);
  parts.push('');
  parts.push('【配色】');
  parts.push(`- 整体色调：以${bgName}为主基调，${primaryName}为辅助色调`);
  parts.push(`- 渐变：从画面顶部的${bgName}自然过渡到底部的${primaryName}`);
  parts.push(`- ${secondaryName}仅作为极少量的光晕点缀，不可大面积使用`);
  parts.push('');
  parts.push('【背景设计】');
  parts.push(getFestivalBgDesign(festivalId, data.industry));
  parts.push('');
  parts.push('【风格要求】');
  parts.push('- 海报从上到下分为三个视觉区域：顶部品牌区、中部主题区、下半部促销区');
  parts.push(`- 顶部区域：简洁干净，大面积${bgName}渐变，为品牌名留白`);
  parts.push(`- 中部区域：${primaryName}渐变过渡，装饰元素逐渐增多`);
  parts.push(`- 下半部促销区：${visual.decor}与节日元素集中在此，保持商品真实、简洁、易识别`);
  parts.push('- 装饰元素分布在画面四周和边缘，丰富但不遮挡中央文字区域');
  parts.push('- 整张画面铺满，不留空白边缘');
  parts.push('');
  parts.push('【禁止】');
  parts.push('- 任何文字、数字、字母、符号');
  parts.push('- 色号、代码、百分比、坐标等技术参数');
  parts.push('- 水印、logo、平台标识');
  parts.push('- 黑边、留白、未绘制区域');
  parts.push('- 线框、方框、矩形框、网格线');
  parts.push('- 任何几何形状的边框或轮廓线');

  return parts.join('\n');
}

module.exports = { buildFrontPrompt, buildFrontBgPrompt, getFestivalBgDesign, getIndustryVisual };
