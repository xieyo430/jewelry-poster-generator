const express = require('express');
const router = express.Router();
const deepseek = require('../services/deepseek');

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
    const { rawDescription } = req.body;

    if (!rawDescription || !rawDescription.trim()) {
      return res.status(400).json({ error: '请提供活动描述内容' });
    }

    const systemPrompt = `你是珠宝促销信息提取助手。只输出一个JSON对象，不要任何解释文字。

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
      detail: err.response?.data || err.message,
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
      detail: err.response?.data || err.message,
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
    const { rawDescription } = req.body;

    if (!rawDescription || !rawDescription.trim()) {
      return res.status(400).json({ error: '请提供活动描述内容' });
    }

    const systemPrompt = `你是珠宝促销标题提取器。严格按以下要求执行：

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
      detail: err.response?.data || err.message,
    });
  }
});

module.exports = router;
