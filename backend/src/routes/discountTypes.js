const express = require('express');
const router = express.Router();

const DISCOUNT_TYPES = [
  // === 价格优惠 ===
  {
    id: 'spend-reduce',
    category: '价格优惠',
    name: '购物满减',
    shortDesc: '满1000减200',
    fields: [
      { key: 'spend', label: '满（元）', type: 'number', placeholder: '例如: 1000' },
      { key: 'reduce', label: '减（元）', type: 'number', placeholder: '例如: 200' },
    ],
    format: '满{spend}元减{reduce}元',
    inputPrompts: '请输入满减金额门槛和减免金额',
  },
  {
    id: 'discount-rate',
    category: '价格优惠',
    name: '折扣优惠',
    shortDesc: '全场商品8.8折',
    fields: [
      { key: 'rate', label: '折扣率', type: 'text', placeholder: '例如: 8.8折' },
      { key: 'item', label: '适用商品', type: 'text', placeholder: '例如: 全场商品' },
    ],
    format: '{item}{rate}',
    inputPrompts: '请输入折扣率和适用商品',
  },
  {
    id: 'fixed-price',
    category: '价格优惠',
    name: '一口价/爆款价',
    shortDesc: '18K金项链仅售999元',
    fields: [
      { key: 'price', label: '价格（元）', type: 'number', placeholder: '例如: 999' },
      { key: 'item', label: '商品名称', type: 'text', placeholder: '例如: 18K金项链' },
    ],
    format: '{item}仅售{price}元',
    inputPrompts: '请输入商品名称和一口价',
  },
  {
    id: 'multi-discount',
    category: '价格优惠',
    name: '多买多折',
    shortDesc: '买2件享8折',
    fields: [
      { key: 'condition', label: '购买条件', type: 'text', placeholder: '例如: 买2件' },
      { key: 'discount', label: '折扣', type: 'text', placeholder: '例如: 8折' },
    ],
    format: '买{condition}享{discount}',
    inputPrompts: '请输入多买多折的购买条件和折扣力度',
  },
  {
    id: 'second-half',
    category: '价格优惠',
    name: '第二件半价',
    shortDesc: '全场银饰第二件半价',
    fields: [
      { key: 'item', label: '适用商品', type: 'text', placeholder: '例如: 全场银饰' },
      { key: 'description', label: '活动描述', type: 'text', placeholder: '例如: 第二件半价' },
    ],
    format: '{item}第二件半价',
    inputPrompts: '请输入适用商品',
  },
  {
    id: 'tiered-spend',
    category: '价格优惠',
    name: '阶梯满减',
    shortDesc: '满1000减100，满2000减300',
    fields: [
      { key: 'tier1', label: '第一档', type: 'text', placeholder: '满1000减100' },
      { key: 'tier2', label: '第二档', type: 'text', placeholder: '满2000减300' },
      { key: 'tier3', label: '第三档', type: 'text', placeholder: '满5000减1000（可选）' },
    ],
    format: '{tier1}，{tier2}',
    inputPrompts: '请输入阶梯满减各档位信息',
  },

  // === 赠品活动 ===
  {
    id: 'buy-give',
    category: '赠品活动',
    name: '买赠活动',
    shortDesc: '买任一款赠银饰手链',
    fields: [
      { key: 'buyCondition', label: '购买条件', type: 'text', placeholder: '例如: 购买任一款' },
      { key: 'gift', label: '赠品', type: 'text', placeholder: '例如: 银饰手链' },
    ],
    format: '买{buyCondition}赠{gift}',
    inputPrompts: '请输入购买条件和赠品信息',
  },
  {
    id: 'full-gift',
    category: '赠品活动',
    name: '满额送礼',
    shortDesc: '满2000元送珍珠耳钉',
    fields: [
      { key: 'spend', label: '消费门槛（元）', type: 'number', placeholder: '例如: 2000' },
      { key: 'gift', label: '礼品', type: 'text', placeholder: '例如: 珍珠耳钉' },
    ],
    format: '满{spend}元送{gift}',
    inputPrompts: '请输入消费门槛和赠品信息',
  },
  {
    id: 'trade-in',
    category: '赠品活动',
    name: '以旧换新',
    shortDesc: '旧金饰换新款足金',
    fields: [
      { key: 'oldItem', label: '旧物', type: 'text', placeholder: '例如: 旧金饰' },
      { key: 'newItem', label: '新品', type: 'text', placeholder: '例如: 新款足金' },
      { key: 'extra', label: '加价说明', type: 'text', placeholder: '例如: 旧金饰换新款补贴100元' },
    ],
    format: '{oldItem}换{newItem}，{extra}',
    inputPrompts: '请输入以旧换新的旧物、新品和加价说明',
  },

  // === 会员营销 ===
  {
    id: 'member-only',
    category: '会员营销',
    name: '会员专享价',
    shortDesc: '注册会员享双倍积分',
    fields: [
      { key: 'benefit', label: '会员权益', type: 'text', placeholder: '例如: 双倍积分' },
      { key: 'condition', label: '会员条件', type: 'text', placeholder: '例如: 注册会员' },
    ],
    format: '{condition}享{benefit}',
    inputPrompts: '请输入会员权益和条件',
  },
  {
    id: 'points-exchange',
    category: '会员营销',
    name: '积分兑换',
    shortDesc: '10000积分兑换珍珠项链',
    fields: [
      { key: 'points', label: '所需积分', type: 'number', placeholder: '例如: 10000' },
      { key: 'item', label: '兑换商品', type: 'text', placeholder: '例如: 珍珠项链' },
    ],
    format: '{points}积分兑换{item}',
    inputPrompts: '请输入所需积分和兑换商品',
  },
  {
    id: 'new-member',
    category: '会员营销',
    name: '新人专享',
    shortDesc: '注册即领首单立减200',
    fields: [
      { key: 'benefit', label: '新人权益', type: 'text', placeholder: '例如: 首单立减200' },
      { key: 'condition', label: '领取条件', type: 'text', placeholder: '例如: 注册即领' },
    ],
    format: '{condition} {benefit}',
    inputPrompts: '请输入新人专享权益和领取条件',
  },
  {
    id: 'store-card',
    category: '会员营销',
    name: '储值卡优惠',
    shortDesc: '充值2000送200',
    fields: [
      { key: 'recharge', label: '充值金额', type: 'text', placeholder: '例如: 充值2000' },
      { key: 'bonus', label: '赠送金额', type: 'text', placeholder: '例如: 送200' },
    ],
    format: '{recharge}送{bonus}',
    inputPrompts: '请输入充值金额和赠送金额',
  },

  // === 促销活动 ===
  {
    id: 'flash-sale',
    category: '促销活动',
    name: '限时秒杀',
    shortDesc: '8月1日20:00限量款手镯仅299元',
    fields: [
      { key: 'time', label: '秒杀时间', type: 'text', placeholder: '例如: 8月1日 20:00' },
      { key: 'item', label: '秒杀商品', type: 'text', placeholder: '例如: 限量款手镯' },
      { key: 'price', label: '秒杀价', type: 'text', placeholder: '例如: 仅299元' },
    ],
    format: '{time} {item} {price}',
    inputPrompts: '请输入秒杀时间、商品和价格',
  },
  {
    id: 'group-buy',
    category: '促销活动',
    name: '拼团优惠',
    shortDesc: '3人团指定款项链仅999元',
    fields: [
      { key: 'people', label: '成团人数', type: 'text', placeholder: '例如: 3人团' },
      { key: 'price', label: '拼团价', type: 'text', placeholder: '例如: 999元' },
      { key: 'item', label: '拼团商品', type: 'text', placeholder: '例如: 指定款项链' },
    ],
    format: '{people}拼团{item}仅{price}',
    inputPrompts: '请输入成团人数、价格和商品',
  },
  {
    id: 'combo-deal',
    category: '促销活动',
    name: '组合套餐',
    shortDesc: '项链+手链+耳钉组合套餐1999',
    fields: [
      { key: 'items', label: '套餐内容', type: 'text', placeholder: '例如: 项链+手链+耳钉' },
      { key: 'price', label: '套餐价', type: 'text', placeholder: '例如: 原价2999套餐价1999' },
    ],
    format: '{items}组合套餐{price}',
    inputPrompts: '请输入套餐包含商品和价格',
  },
  {
    id: 'coupon',
    category: '促销活动',
    name: '优惠券领取',
    shortDesc: '领满500减100优惠券到店扫码',
    fields: [
      { key: 'amount', label: '优惠券面额', type: 'text', placeholder: '例如: 满500减100' },
      { key: 'way', label: '领取方式', type: 'text', placeholder: '例如: 到店扫码领取' },
    ],
    format: '领{amount}优惠券{way}',
    inputPrompts: '请输入优惠券面额和领取方式',
  },
  {
    id: 'lucky-draw',
    category: '促销活动',
    name: '抽奖活动',
    shortDesc: '消费满500元抽金条大奖',
    fields: [
      { key: 'condition', label: '参与条件', type: 'text', placeholder: '例如: 消费满500元' },
      { key: 'prizes', label: '奖品', type: 'text', placeholder: '例如: 抽金条大奖' },
    ],
    format: '{condition}参与抽奖{prizes}',
    inputPrompts: '请输入参与条件和奖品信息',
  },

  // === 金融方案 ===
  {
    id: 'deposit-expand',
    category: '金融方案',
    name: '定金膨胀',
    shortDesc: '交100元定金抵300元',
    fields: [
      { key: 'deposit', label: '定金（元）', type: 'number', placeholder: '例如: 100' },
      { key: 'expand', label: '膨胀倍数', type: 'text', placeholder: '例如: 抵300元' },
      { key: 'item', label: '适用商品', type: 'text', placeholder: '例如: 全场商品' },
    ],
    format: '交{deposit}元定金{expand}',
    inputPrompts: '请输入定金金额和膨胀权益',
  },
  {
    id: 'installment',
    category: '金融方案',
    name: '分期免息',
    shortDesc: '指定款珠宝12期分期免息',
    fields: [
      { key: 'period', label: '分期期数', type: 'text', placeholder: '例如: 12期' },
      { key: 'item', label: '适用商品', type: 'text', placeholder: '例如: 指定款珠宝' },
    ],
    format: '{item}{period}分期免息',
    inputPrompts: '请输入分期期数和适用商品',
  },

  // === 其他自定义 ===
  {
    id: 'custom-text',
    category: '其他',
    name: '其他自定义',
    shortDesc: '用户自由输入活动文案',
    fields: [
      { key: 'customContent', label: '自定义文案', type: 'text', placeholder: '直接输入活动描述，例如：黄金928元/克，满10克享受一克优惠' },
    ],
    format: '{customContent}',
    inputPrompts: '请输入自定义活动文案',
  },
];

router.get('/', (req, res) => {
  res.json({ discountTypes: DISCOUNT_TYPES });
});

module.exports = router;
