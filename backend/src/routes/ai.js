const express = require('express');
const router = express.Router();
const mimo = require('../services/mimo');

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

    const systemPrompt = `你是一个珠宝促销活动信息提取助手。你的任务是从用户输入的原始文案中，判断属于哪种优惠类型，并提取对应的字段值。

## 匹配规则
1. 仔细阅读用户文案，判断它匹配哪个优惠类型
2. 从文案中提取该类型需要的所有字段值
3. 如果文案包含多种优惠，选择最主要的一种
4. 只有完全无法匹配时才用 "custom"

## 完整的优惠类型定义

### 价格优惠
1. spend-reduce 购物满减
  字段: spend(满多少元), reduce(减多少元)
  格式: "满{spend}元减{reduce}元"
  示例: "满1000减200" → {spend:1000, reduce:200}

2. discount-rate 折扣优惠
  字段: rate(折扣率), item(适用商品)
  格式: "{item}{rate}"
  示例: "全场商品8.8折" → {rate:"8.8折", item:"全场商品"}

3. fixed-price 一口价/爆款价
  字段: price(价格), item(商品名称)
  格式: "{item}仅售{price}元"
  示例: "18K金项链仅售999元" → {price:999, item:"18K金项链"}

4. multi-discount 多买多折
  字段: condition(购买条件), discount(折扣)
  格式: "买{condition}享{discount}"
  示例: "买2件享8折" → {condition:"2件", discount:"8折"}

5. second-half 第二件半价
  字段: item(适用商品), description(活动描述)
  格式: "{item}第二件半价"
  示例: "全场银饰第二件半价" → {item:"全场银饰", description:"第二件半价"}

6. tiered-spend 阶梯满减
  字段: tier1(第一档), tier2(第二档), tier3(第三档-可选)
  格式: "{tier1}，{tier2}"
  示例: "满1000减100，满2000减300" → {tier1:"满1000减100", tier2:"满2000减300"}

### 赠品活动
7. buy-give 买赠活动
  字段: buyCondition(购买条件), gift(赠品)
  格式: "买{buyCondition}赠{gift}"
  示例: "买任一款赠银饰手链" → {buyCondition:"任一款", gift:"银饰手链"}

8. full-gift 满额送礼
  字段: spend(消费门槛), gift(礼品)
  格式: "满{spend}元送{gift}"
  示例: "满2000元送珍珠耳钉" → {spend:2000, gift:"珍珠耳钉"}

9. trade-in 以旧换新
  字段: oldItem(旧物), newItem(新品), extra(加价说明)
  格式: "{oldItem}换{newItem}，{extra}"
  示例: "旧金饰换新款足金，补贴100元" → {oldItem:"旧金饰", newItem:"新款足金", extra:"补贴100元"}

### 会员营销
10. member-only 会员专享价
  字段: benefit(会员权益), condition(会员条件)
  格式: "{condition}享{benefit}"
  示例: "注册会员享双倍积分" → {condition:"注册会员", benefit:"双倍积分"}

11. points-exchange 积分兑换
  字段: points(所需积分), item(兑换商品)
  格式: "{points}积分兑换{item}"
  示例: "10000积分兑换珍珠项链" → {points:10000, item:"珍珠项链"}

12. new-member 新人专享
  字段: benefit(新人权益), condition(领取条件)
  格式: "{condition} {benefit}"
  示例: "注册即领首单立减200" → {condition:"注册即领", benefit:"首单立减200"}

13. store-card 储值卡优惠
  字段: recharge(充值金额), bonus(赠送金额)
  格式: "{recharge}送{bonus}"
  示例: "充值2000送200" → {recharge:"充值2000", bonus:"送200"}

### 促销活动
14. flash-sale 限时秒杀
  字段: time(秒杀时间), item(秒杀商品), price(秒杀价)
  格式: "{time} {item} {price}"
  示例: "8月1日20:00限量款手镯仅299元" → {time:"8月1日20:00", item:"限量款手镯", price:"仅299元"}

15. group-buy 拼团优惠
  字段: people(成团人数), price(拼团价), item(拼团商品)
  格式: "{people}拼团{item}仅{price}"
  示例: "3人团拼团指定款项链仅999元" → {people:"3人团", price:"999元", item:"指定款项链"}

16. combo-deal 组合套餐
  字段: items(套餐内容), price(套餐价)
  格式: "{items}组合套餐{price}"
  示例: "项链+手链+耳钉组合套餐原价2999套餐价1999" → {items:"项链+手链+耳钉", price:"原价2999套餐价1999"}

17. coupon 优惠券领取
  字段: amount(优惠券面额), way(领取方式)
  格式: "领{amount}优惠券{way}"
  示例: "领满500减100优惠券到店扫码领取" → {amount:"满500减100", way:"到店扫码领取"}

18. lucky-draw 抽奖活动
  字段: condition(参与条件), prizes(奖品)
  格式: "{condition}参与抽奖{prizes}"
  示例: "消费满500元参与抽奖抽金条大奖" → {condition:"消费满500元", prizes:"抽金条大奖"}

### 金融方案
19. deposit-expand 定金膨胀
  字段: deposit(定金金额), expand(膨胀倍数), item(适用商品)
  格式: "交{deposit}元定金{expand}"
  示例: "交100元定金抵300元" → {deposit:100, expand:"抵300元", item:"全场商品"}

20. installment 分期免息
  字段: period(分期期数), item(适用商品)
  格式: "{item}{period}分期免息"
  示例: "指定款珠宝12期分期免息" → {period:"12期", item:"指定款珠宝"}

21. custom-text 其他自定义（以上类型都不匹配时使用）
  字段: customContent(自定义文案)
  格式: "{customContent}"
  示例: 任何不匹配上述类型的文案 → {customContent:"原文"}

## 输出格式（纯JSON，不要markdown包裹）
{
  "suggestedDiscountType": "匹配的优惠类型ID",
  "explanation": "为什么匹配这个类型（一句话）",
  "fieldValues": {
    "字段key": "提取的值"
  },
  "discountDetail": "使用该类型的format模板生成的完整优惠描述",
  "activityContent": "活动的简短摘要（10-20字）"
}

## 要求
- fieldValues的key必须严格匹配定义中的字段key
- discountDetail必须用format模板填入提取的值，不得在模板之外添加任何文字
- 数字字段尽量提取纯数字
- 文案明确匹配但缺字段时，缺的填"___"
- 不要编造不存在的类型ID

## 绝对禁止
- discountDetail只能使用format模板生成，不得添加模板中没有的文字或标点
- 例如原文"满1000减200" → discountDetail应为"满1000元减200元"，不额外加"活动期间"等
- 如果原文不包含format模板所需的全部关键字段值，或者字段值类型不符（如需要金额但原文只有重量），则必须使用"custom-text"类型，将原文填入customContent字段
- 不要擅自将重量单位（克、件）换算成金额单位（元），也不要在原文基础上填充你猜测的数值`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请分析这个活动描述：${rawDescription}` },
    ];

    const result = await mimo.chat({ messages, temperature: 0.1, max_tokens: 2048 });

    const content = result?.choices?.[0]?.message?.content || '{}';

    // 尝试提取JSON
    let parsed;
    try {
      // 先尝试直接解析
      parsed = JSON.parse(content);
    } catch {
      // 尝试从markdown代码块提取
      const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        parsed = JSON.parse(match[1].trim());
      } else {
        throw new Error('无法解析AI返回结果');
      }
    }

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

module.exports = router;
