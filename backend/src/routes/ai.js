const express = require('express');
const router = express.Router();
const deepseek = require('../services/deepseek');
const { filterCopy } = require('../services/copyFilter');

const INDUSTRY_NAMES = {
  jewelry: '珠宝饰品',
  food: '餐饮美食',
  electronics: '数码家电',
};

function getIndustryName(industry) {
  return INDUSTRY_NAMES[industry] || INDUSTRY_NAMES.jewelry;
}

/**
 * 从文本中提取第一个完整的JSON对象（括号平衡法）
 */
function extractJsonObject(text) {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function parseAiJson(content) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1].trim());
    const jsonStr = extractJsonObject(content);
    if (jsonStr) return JSON.parse(jsonStr);
    throw new Error('无法解析AI返回结果');
  }
}

/**
 * POST /api/ai/analyze-activity
 * AI自动分析用户描述，提取优惠活动信息
 * Body: { rawDescription: string }
 */
router.post('/analyze-activity', async (req, res) => {
  try {
    const { rawDescription, industry } = req.body;

    if (!rawDescription || !rawDescription.trim()) {
      return res.status(400).json({ error: '请提供活动描述内容' });
    }

    const industryName = getIndustryName(industry);
    const systemPrompt = `你是${industryName}促销信息提取助手。只输出一个JSON对象，不要任何解释文字。

必须输出的JSON格式（用实际值替换，不要输出模板本身）：
{"suggestedDiscountType":"实际类型ID","explanation":"实际说明","fieldValues":{"实际key":"实际值"},"discountDetail":"实际描述","activityContent":"实际摘要","highlight":"实际关键词"}

优惠类型ID和字段：
- spend-reduce: 购物满减，字段spend(满多少元),reduce(减多少元)，模板"满{spend}元减{reduce}元"
- discount-rate: 折扣，字段rate,item，模板"{item}{rate}"
- fixed-price: 一口价，字段price,item，模板"{item}仅售{price}元"
- buy-give: 买赠，字段buyCondition,gift，模板"买{buyCondition}赠{gift}"
- full-gift: 满额送礼，字段spend,gift，模板"满{spend}元送{gift}"
- trade-in: 以旧换新，字段oldItem,newItem,extra
- custom-text: 自定义，字段customContent

示例：输入"满1000减200"时输出{"suggestedDiscountType":"spend-reduce","explanation":"满减优惠","fieldValues":{"spend":1000,"reduce":200},"discountDetail":"满1000元减200元","activityContent":"购物满1000元立减200元","highlight":"满1000减200"}

重要：只输出一个包含实际分析结果的JSON对象，不要输出模板占位符，不要其他文字`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请分析这个活动描述：${rawDescription}` },
    ];

    const result = await deepseek.chat({ messages, temperature: 0.1, max_tokens: 2048 });
    const content = result?.choices?.[0]?.message?.content || '{}';
    const parsed = parseAiJson(content);

    res.json({
      success: true,
      ...parsed,
      rawDescription,
    });
  } catch (err) {
    console.error('[AI分析错误]', err.message);
    res.status(500).json({
      error: 'AI分析失败',
      ...(process.env.NODE_ENV !== 'production' && { detail: err.response?.data || err.message }),
    });
  }
});

/**
 * POST /api/ai/generate-titles
 * AI生成海报主标题和副标题（基于优惠类型上下文）
 * Body: { rawDescription: string, discountType?: string, discountDetail?: string, fieldValues?: object }
 */
router.post('/generate-titles', async (req, res) => {
  try {
    const { rawDescription, discountType, discountDetail, fieldValues } = req.body;

    if (!rawDescription || !rawDescription.trim()) {
      return res.status(400).json({ error: '请提供活动描述内容' });
    }

    // 构建上下文信息
    let contextInfo = '';
    if (discountType && discountType !== 'custom-text') {
      contextInfo += `\n已识别的优惠类型：${discountType}`;
    }
    if (discountDetail) {
      contextInfo += `\n优惠详情：${discountDetail}`;
    }
    if (fieldValues && Object.keys(fieldValues).length > 0) {
      const fvStr = Object.entries(fieldValues).map(([k, v]) => `${k}=${v}`).join('，');
      contextInfo += `\n结构化字段：${fvStr}`;
    }

    const systemPrompt = `你是珠宝海报标题生成器。只输出JSON，不要任何解释。

规则：
- mainTitle：海报上最大的促销文字，6-15字，突出核心优惠数字或折扣力度
- subTitle：主标题下方的补充说明，可以为空字符串
- 如果文案包含多个优惠，把最有冲击力的一个作为mainTitle，其余归入subTitle
- 保留原文中的数字和单位，不要改写（如"928元/克"不要改成"九百二十八元"）
- 不能输出"..."或占位符，无法生成时设为空字符串

示例1：
输入：全场黄金8.5折，满1000减200
输出：{"mainTitle":"全场黄金8.5折","subTitle":"满1000减200"}

示例2：
输入：黄金928元/克 满10克享受一克 全场珠宝一件8折 第二件7.5折
输出：{"mainTitle":"黄金928元/克","subTitle":"全场珠宝一件8折 第二件7.5折"}

示例3：
输入：买任意项链送银饰手链
输出：{"mainTitle":"买项链送手链","subTitle":""}

只输出JSON，不要其他文字`;

    const userContent = `请为这个活动生成海报标题：${rawDescription}${contextInfo}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ];

    const result = await deepseek.chat({ messages, temperature: 0.3, max_tokens: 2048 });
    const content = result?.choices?.[0]?.message?.content || '{}';
    const parsed = parseAiJson(content);

    res.json({
      success: true,
      mainTitle: parsed.mainTitle || '',
      subTitle: parsed.subTitle || '',
      rawDescription,
    });
  } catch (err) {
    console.error('[AI标题生成错误]', err.message);
    res.status(500).json({
      error: 'AI标题生成失败',
      ...(process.env.NODE_ENV !== 'production' && { detail: err.response?.data || err.message }),
    });
  }
});

/**
 * POST /api/ai/smart-fill
 * 快速生成海报主标题和副标题
 * Body: { rawDescription: string }
 */
router.post('/smart-fill', async (req, res) => {
  try {
    const { rawDescription, industry } = req.body;

    if (!rawDescription || !rawDescription.trim()) {
      return res.status(400).json({ error: '请提供活动描述内容' });
    }

    const industryName = getIndustryName(industry);
    const systemPrompt = `你是${industryName}促销标题提取器。严格按以下要求执行：

1. 仔细阅读用户输入的文案
2. 按文案中出现的顺序，第一条优惠作为mainTitle（6-15字，保留实际数字）
3. 后面的优惠作为subTitle（可以为空字符串）
4. 只输出JSON，禁止任何解释

格式：{"mainTitle":"xxx","subTitle":"xxx"}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: rawDescription },
    ];

    const result = await deepseek.chat({ messages, temperature: 0.1, max_tokens: 2048 });
    const content = result?.choices?.[0]?.message?.content || '{}';
    const parsed = parseAiJson(content);

    res.json({
      success: true,
      mainTitle: parsed.mainTitle || '',
      subTitle: parsed.subTitle || '',
      rawDescription,
    });
  } catch (err) {
    console.error('[AI智能填充错误]', err.message);
    res.status(500).json({
      error: 'AI智能填充失败',
      ...(process.env.NODE_ENV !== 'production' && { detail: err.response?.data || err.message }),
    });
  }
});

/**
 * POST /api/ai/write-copy
 * 基于第一步上下文生成 3 组主/副标题候选
 * Body: { festival, brand, brandTone, theme, subtitle, startDate, endDate,
 *         currentTitle, currentSubtitle }
 */
router.post('/write-copy', async (req, res) => {
  try {
    const { target = 'main', festival, brand, brandTone, theme, subtitle, startDate, endDate, currentTitle, currentSubtitle, industry } = req.body;
    const industryName = getIndustryName(industry);
    const industryGuidance = industry === 'food'
      ? '符合餐饮美食行业调性，突出菜品、套餐、到店体验、折扣、满减或赠饮等真实优惠'
      : industry === 'electronics'
        ? '符合数码家电行业调性，突出具体产品、新品、直降、满减、赠品或以旧换新等真实优惠'
        : '符合珠宝饰品行业调性，突出商品、折扣、满减、赠礼或克减等真实优惠';
    const subtitleExample = industry === 'food'
      ? '招牌双人套餐限时99元'
      : industry === 'electronics'
        ? '热门新品直降300元再赠延保'
        : '全场珠宝低至5折';

    if (!brand || (industry === 'jewelry' && !festival)) {
      return res.status(400).json({ error: industry === 'jewelry' ? '请先选择节日并填写品牌' : '请先填写品牌信息' });
    }

    // 正面推广的文案必须基于第一步的活动主标题
    if (target !== 'theme' && !theme) {
      return res.status(400).json({ error: '请先在第一步填写活动主标题' });
    }

    // target=theme 时 theme/subtitle 正是要生成的字段，不放进已知上下文
    const ctx = [
      `节日主题：${festival}`,
      `行业：${industryName}`,
      `品牌：${brand}${brandTone ? `（${brandTone}）` : ''}`,
      target !== 'theme' && `活动主题：${theme}`,
      target !== 'theme' && subtitle && `优惠副标题：${subtitle}`,
      (startDate || endDate) && `活动时间：${startDate || '?'} 至 ${endDate || '?'}`,
    ].filter(Boolean).join('\n');

    const styleRef = (currentTitle || currentSubtitle)
      ? `\n用户已写内容（仅作风格参考，不要照抄）：${currentTitle || ''} ${currentSubtitle || ''}`
      : '';

    const systemPrompt = `你是${industryName}行业资深促销文案。只输出JSON，禁止任何解释。

输出格式：{"options":[{"title":"","subtitle":""}]}

${target === 'theme'
  ? `- title 为活动主题（6-10字），subtitle 为优惠副标题（10-16字，如"${subtitleExample}"）`
  : `- 必须围绕活动主题"${theme}"生成：title 承接主题并融入核心优惠（8-12字），subtitle 用具体优惠支撑主题（14-20字）
- 不要原样照抄主题，要把它扩写成有冲击力的促销文案`}
- 一次输出3组，互不相同
- 每组必须包含具体优惠信息，禁止空洞口号
- 简体中文，营销感强但不浮夸，${industryGuidance}
- 严禁广告法极限词：最、第一、顶级、国家级、极品、绝对、100%等
- 不要输出占位符或省略号`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `活动信息：\n${ctx}${styleRef}\n请生成3组文案候选` },
    ];

    // flash 模型偶发返回空对象，空结果时内部重试
    let parsed;
    for (let attempt = 0; attempt < 3; attempt++) {
      // deepseek-flash 会把部分 token 用于 reasoning；2048 容易导致可见 JSON 被截空。
      const result = await deepseek.chat({ messages, temperature: 0.8, max_tokens: 4096 });
      const raw = result?.choices?.[0]?.message?.content || '{}';
      parsed = parseAiJson(raw) || {};
      if (Array.isArray(parsed.options) && parsed.options.length) break;
      if (attempt === 2) console.warn('[write-copy] 三次均未得到 options，末次原文：', raw.slice(0, 300));
    }

    let options = Array.isArray(parsed.options) ? parsed.options : [];
    let filtered = false;
    options = options
      .filter(o => o && (o.title || o.subtitle))
      .slice(0, 3)
      .map(o => {
        const t = filterCopy(String(o.title || ''));
        const s = filterCopy(String(o.subtitle || ''));
        filtered = filtered || t.replaced || s.replaced;
        return { title: t.text.trim(), subtitle: s.text.trim() };
      });

    if (!options.length) {
      return res.status(503).json({ error: 'AI 帮写暂未生成结果，请重试' });
    }

    res.json({ success: true, options, filtered });
  } catch (err) {
    console.error('[AI帮写错误]', err.response?.status || err.code || 'unknown', err.response?.data || err.message || err);
    res.status(500).json({
      error: 'AI 帮写失败，请重试',
      ...(process.env.NODE_ENV !== 'production' && { detail: err.response?.data || err.message }),
    });
  }
});

module.exports = router;
