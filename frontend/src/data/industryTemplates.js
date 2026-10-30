export const INDUSTRY_TEMPLATES = [
  { id: 'jewelry', name: '珠宝饰品', brandLabel: '珠宝品牌', defaultSubtitle: '全场珠宝低至5折', merchantSuffix: '珠宝门店', visualStyle: '高端、精致、奢华，突出金属光泽与珠宝质感' },
  { id: 'food', name: '餐饮美食', brandLabel: '餐饮品牌', defaultSubtitle: '招牌美食限时优惠', merchantSuffix: '餐饮门店', visualStyle: '鲜明、温暖、有食欲，突出食材纹理、热气与丰富层次' },
  { id: 'electronics', name: '数码家电', brandLabel: '数码家电品牌', defaultSubtitle: '热门新品限时直降', merchantSuffix: '数码家电门店', visualStyle: '现代、清晰、有科技感，突出产品轮廓、屏幕光效与参数层次' },
]

export const getIndustryTemplate = (id) =>
  INDUSTRY_TEMPLATES.find(item => item.id === id) || INDUSTRY_TEMPLATES[0]

export const getIndustryActivityPresets = (id) => {
  if (id === 'food') return [
    { discountTypeId: 'discount-rate', discountType: '折扣优惠', discountDetail: '招牌菜8折', content: '招牌菜8折', fieldValues: { rate: '8折', item: '招牌菜' } },
    { discountTypeId: 'spend-reduce', discountType: '购物满减', discountDetail: '满100元减20元', content: '满100减20', fieldValues: { spend: 100, reduce: 20 } },
    { discountTypeId: 'buy-give', discountType: '买赠活动', discountDetail: '消费满2份赠饮品1杯', content: '满2份赠饮品', fieldValues: { buyCondition: '2份', gift: '饮品1杯' } },
    { discountTypeId: 'fixed-price', discountType: '套餐特价', discountDetail: '双人套餐仅售99元', content: '双人套餐99元', fieldValues: { price: 99, item: '双人套餐' } },
  ]
  if (id === 'electronics') return [
    { discountTypeId: 'fixed-price', discountType: '一口价', discountDetail: '热门耳机仅售299元', content: '热门耳机299元', fieldValues: { price: 299, item: '热门耳机' } },
    { discountTypeId: 'spend-reduce', discountType: '购物满减', discountDetail: '满2000元减300元', content: '满2000减300', fieldValues: { spend: 2000, reduce: 300 } },
    { discountTypeId: 'trade-in', discountType: '以旧换新', discountDetail: '旧机换新最高补贴500元', content: '以旧换新补贴500元', fieldValues: { oldItem: '旧机', newItem: '新品', extra: '最高补贴500元' } },
    { discountTypeId: 'buy-give', discountType: '买赠活动', discountDetail: '购买指定家电赠延保服务', content: '买指定家电赠延保', fieldValues: { buyCondition: '指定家电', gift: '延保服务' } },
  ]
  return []
}
