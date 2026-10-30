// 系统预设活动模板，按折扣类型分类
export const presetActivities = [
  // === 购物满减 ===
  { discountTypeId: 'spend-reduce', discountType: '购物满减', discountDetail: '满500元减50元', content: '满500减50', fieldValues: { spend: 500, reduce: 50 } },
  { discountTypeId: 'spend-reduce', discountType: '购物满减', discountDetail: '满800元减80元', content: '满800减80', fieldValues: { spend: 800, reduce: 80 } },
  { discountTypeId: 'spend-reduce', discountType: '购物满减', discountDetail: '满1000元减100元', content: '满1000减100', fieldValues: { spend: 1000, reduce: 100 } },
  { discountTypeId: 'spend-reduce', discountType: '购物满减', discountDetail: '满1000元减150元', content: '满1000减150', fieldValues: { spend: 1000, reduce: 150 } },
  { discountTypeId: 'spend-reduce', discountType: '购物满减', discountDetail: '满1500元减200元', content: '满1500减200', fieldValues: { spend: 1500, reduce: 200 } },
  { discountTypeId: 'spend-reduce', discountType: '购物满减', discountDetail: '满2000元减200元', content: '满2000减200', fieldValues: { spend: 2000, reduce: 200 } },
  { discountTypeId: 'spend-reduce', discountType: '购物满减', discountDetail: '满2000元减300元', content: '满2000减300', fieldValues: { spend: 2000, reduce: 300 } },
  { discountTypeId: 'spend-reduce', discountType: '购物满减', discountDetail: '满2000元减400元', content: '满2000减400', fieldValues: { spend: 2000, reduce: 400 } },
  { discountTypeId: 'spend-reduce', discountType: '购物满减', discountDetail: '满3000元减300元', content: '满3000减300', fieldValues: { spend: 3000, reduce: 300 } },
  { discountTypeId: 'spend-reduce', discountType: '购物满减', discountDetail: '满3000元减500元', content: '满3000减500', fieldValues: { spend: 3000, reduce: 500 } },
  { discountTypeId: 'spend-reduce', discountType: '购物满减', discountDetail: '满5000元减500元', content: '满5000减500', fieldValues: { spend: 5000, reduce: 500 } },
  { discountTypeId: 'spend-reduce', discountType: '购物满减', discountDetail: '满5000元减800元', content: '满5000减800', fieldValues: { spend: 5000, reduce: 800 } },
  { discountTypeId: 'spend-reduce', discountType: '购物满减', discountDetail: '满5000元减1000元', content: '满5000减1000', fieldValues: { spend: 5000, reduce: 1000 } },
  { discountTypeId: 'spend-reduce', discountType: '购物满减', discountDetail: '满8000元减1500元', content: '满8000减1500', fieldValues: { spend: 8000, reduce: 1500 } },
  { discountTypeId: 'spend-reduce', discountType: '购物满减', discountDetail: '满10000元减1000元', content: '满10000减1000', fieldValues: { spend: 10000, reduce: 1000 } },
  { discountTypeId: 'spend-reduce', discountType: '购物满减', discountDetail: '满10000元减2000元', content: '满10000减2000', fieldValues: { spend: 10000, reduce: 2000 } },
  { discountTypeId: 'spend-reduce', discountType: '购物满减', discountDetail: '满10000元减3000元', content: '满10000减3000', fieldValues: { spend: 10000, reduce: 3000 } },
  { discountTypeId: 'spend-reduce', discountType: '购物满减', discountDetail: '满20000元减5000元', content: '满20000减5000', fieldValues: { spend: 20000, reduce: 5000 } },

  // === 折扣优惠 ===
  { discountTypeId: 'discount-rate', discountType: '折扣优惠', discountDetail: '全场珠宝5折起', content: '全场珠宝5折起', fieldValues: { rate: '5折起', item: '珠宝' } },
  { discountTypeId: 'discount-rate', discountType: '折扣优惠', discountDetail: '全场珠宝6折', content: '全场珠宝6折', fieldValues: { rate: '6折', item: '珠宝' } },
  { discountTypeId: 'discount-rate', discountType: '折扣优惠', discountDetail: '黄金饰品7折', content: '黄金饰品7折', fieldValues: { rate: '7折', item: '黄金饰品' } },
  { discountTypeId: 'discount-rate', discountType: '折扣优惠', discountDetail: '黄金珠宝7.5折', content: '黄金珠宝7.5折', fieldValues: { rate: '7.5折', item: '黄金珠宝' } },
  { discountTypeId: 'discount-rate', discountType: '折扣优惠', discountDetail: '翡翠玉石7.5折', content: '翡翠玉石7.5折', fieldValues: { rate: '7.5折', item: '翡翠玉石' } },
  { discountTypeId: 'discount-rate', discountType: '折扣优惠', discountDetail: '黄金珠宝8折', content: '黄金珠宝8折', fieldValues: { rate: '8折', item: '黄金珠宝' } },
  { discountTypeId: 'discount-rate', discountType: '折扣优惠', discountDetail: 'K金饰品8折', content: 'K金饰品8折', fieldValues: { rate: '8折', item: 'K金饰品' } },
  { discountTypeId: 'discount-rate', discountType: '折扣优惠', discountDetail: '钻石饰品8折', content: '钻石饰品8折', fieldValues: { rate: '8折', item: '钻石饰品' } },
  { discountTypeId: 'discount-rate', discountType: '折扣优惠', discountDetail: '银饰8.5折', content: '银饰8.5折', fieldValues: { rate: '8.5折', item: '银饰' } },
  { discountTypeId: 'discount-rate', discountType: '折扣优惠', discountDetail: '珍珠饰品8.8折', content: '珍珠饰品8.8折', fieldValues: { rate: '8.8折', item: '珍珠饰品' } },
  { discountTypeId: 'discount-rate', discountType: '折扣优惠', discountDetail: '全场银饰8.8折', content: '全场银饰8.8折', fieldValues: { rate: '8.8折', item: '银饰' } },
  { discountTypeId: 'discount-rate', discountType: '折扣优惠', discountDetail: '黄金珠宝9折', content: '黄金珠宝9折', fieldValues: { rate: '9折', item: '黄金珠宝' } },
  { discountTypeId: 'discount-rate', discountType: '折扣优惠', discountDetail: '钻石饰品9折', content: '钻石饰品9折', fieldValues: { rate: '9折', item: '钻石饰品' } },
  { discountTypeId: 'discount-rate', discountType: '折扣优惠', discountDetail: '铂金饰品9.5折', content: '铂金饰品9.5折', fieldValues: { rate: '9.5折', item: '铂金饰品' } },
  { discountTypeId: 'discount-rate', discountType: '折扣优惠', discountDetail: '和田玉9折', content: '和田玉9折', fieldValues: { rate: '9折', item: '和田玉' } },
  { discountTypeId: 'discount-rate', discountType: '折扣优惠', discountDetail: '红蓝宝石8.5折', content: '红蓝宝石8.5折', fieldValues: { rate: '8.5折', item: '红蓝宝石' } },
  { discountTypeId: 'discount-rate', discountType: '折扣优惠', discountDetail: '琥珀蜜蜡8折', content: '琥珀蜜蜡8折', fieldValues: { rate: '8折', item: '琥珀蜜蜡' } },

  // === 一口价/爆款价 ===
  { discountTypeId: 'fixed-price', discountType: '一口价/爆款价', discountDetail: '银耳钉仅售49元', content: '银耳钉仅售49元', fieldValues: { price: 49, item: '银耳钉' } },
  { discountTypeId: 'fixed-price', discountType: '一口价/爆款价', discountDetail: '银手链仅售99元', content: '银手链仅售99元', fieldValues: { price: 99, item: '银手链' } },
  { discountTypeId: 'fixed-price', discountType: '一口价/爆款价', discountDetail: '银吊坠仅售129元', content: '银吊坠仅售129元', fieldValues: { price: 129, item: '银吊坠' } },
  { discountTypeId: 'fixed-price', discountType: '一口价/爆款价', discountDetail: '珍珠耳钉仅售199元', content: '珍珠耳钉仅售199元', fieldValues: { price: 199, item: '珍珠耳钉' } },
  { discountTypeId: 'fixed-price', discountType: '一口价/爆款价', discountDetail: '黄金转运珠仅售299元', content: '黄金转运珠仅售299元', fieldValues: { price: 299, item: '黄金转运珠' } },
  { discountTypeId: 'fixed-price', discountType: '一口价/爆款价', discountDetail: '银手镯仅售299元', content: '银手镯仅售299元', fieldValues: { price: 299, item: '银手镯' } },
  { discountTypeId: 'fixed-price', discountType: '一口价/爆款价', discountDetail: '18K金耳钉仅售399元', content: '18K金耳钉仅售399元', fieldValues: { price: 399, item: '18K金耳钉' } },
  { discountTypeId: 'fixed-price', discountType: '一口价/爆款价', discountDetail: '翡翠挂件仅售499元', content: '翡翠挂件仅售499元', fieldValues: { price: 499, item: '翡翠挂件' } },
  { discountTypeId: 'fixed-price', discountType: '一口价/爆款价', discountDetail: '黄金戒指仅售599元', content: '黄金戒指仅售599元', fieldValues: { price: 599, item: '黄金戒指' } },
  { discountTypeId: 'fixed-price', discountType: '一口价/爆款价', discountDetail: '珍珠项链仅售699元', content: '珍珠项链仅售699元', fieldValues: { price: 699, item: '珍珠项链' } },
  { discountTypeId: 'fixed-price', discountType: '一口价/爆款价', discountDetail: '翡翠挂件仅售888元', content: '翡翠挂件仅售888元', fieldValues: { price: 888, item: '翡翠挂件' } },
  { discountTypeId: 'fixed-price', discountType: '一口价/爆款价', discountDetail: '18K金项链仅售999元', content: '18K金项链仅售999元', fieldValues: { price: 999, item: '18K金项链' } },
  { discountTypeId: 'fixed-price', discountType: '一口价/爆款价', discountDetail: '钻石吊坠仅售1299元', content: '钻石吊坠仅售1299元', fieldValues: { price: 1299, item: '钻石吊坠' } },
  { discountTypeId: 'fixed-price', discountType: '一口价/爆款价', discountDetail: '黄金手链仅售1599元', content: '黄金手链仅售1599元', fieldValues: { price: 1599, item: '黄金手链' } },
  { discountTypeId: 'fixed-price', discountType: '一口价/爆款价', discountDetail: '足金手镯仅售2999元', content: '足金手镯仅售2999元', fieldValues: { price: 2999, item: '足金手镯' } },
  { discountTypeId: 'fixed-price', discountType: '一口价/爆款价', discountDetail: '和田玉手镯仅售3999元', content: '和田玉手镯仅售3999元', fieldValues: { price: 3999, item: '和田玉手镯' } },
  { discountTypeId: 'fixed-price', discountType: '一口价/爆款价', discountDetail: '钻石戒指仅售4999元', content: '钻石戒指仅售4999元', fieldValues: { price: 4999, item: '钻石戒指' } },
  { discountTypeId: 'fixed-price', discountType: '一口价/爆款价', discountDetail: '翡翠手镯仅售5999元', content: '翡翠手镯仅售5999元', fieldValues: { price: 5999, item: '翡翠手镯' } },

  // === 多买多折 ===
  { discountTypeId: 'multi-discount', discountType: '多买多折', discountDetail: '买2件享8折', content: '买2件享8折', fieldValues: { condition: '2件', discount: '8折' } },
  { discountTypeId: 'multi-discount', discountType: '多买多折', discountDetail: '买2件享8.5折', content: '买2件享8.5折', fieldValues: { condition: '2件', discount: '8.5折' } },
  { discountTypeId: 'multi-discount', discountType: '多买多折', discountDetail: '买3件享7折', content: '买3件享7折', fieldValues: { condition: '3件', discount: '7折' } },
  { discountTypeId: 'multi-discount', discountType: '多买多折', discountDetail: '买3件享7.5折', content: '买3件享7.5折', fieldValues: { condition: '3件', discount: '7.5折' } },
  { discountTypeId: 'multi-discount', discountType: '多买多折', discountDetail: '买2件银饰享7折', content: '买2件银饰享7折', fieldValues: { condition: '2件银饰', discount: '7折' } },
  { discountTypeId: 'multi-discount', discountType: '多买多折', discountDetail: '买3件黄金享8折', content: '买3件黄金享8折', fieldValues: { condition: '3件黄金', discount: '8折' } },

  // === 第二件半价 ===
  { discountTypeId: 'second-half', discountType: '第二件半价', discountDetail: '银饰第二件半价', content: '银饰第二件半价', fieldValues: { item: '银饰', description: '第二件半价' } },
  { discountTypeId: 'second-half', discountType: '第二件半价', discountDetail: '黄金饰品第二件半价', content: '黄金饰品第二件半价', fieldValues: { item: '黄金饰品', description: '第二件半价' } },
  { discountTypeId: 'second-half', discountType: '第二件半价', discountDetail: '珍珠饰品第二件半价', content: '珍珠饰品第二件半价', fieldValues: { item: '珍珠饰品', description: '第二件半价' } },
  { discountTypeId: 'second-half', discountType: '第二件半价', discountDetail: 'K金饰品第二件半价', content: 'K金饰品第二件半价', fieldValues: { item: 'K金饰品', description: '第二件半价' } },
  { discountTypeId: 'second-half', discountType: '第二件半价', discountDetail: '钻石饰品第二件半价', content: '钻石饰品第二件半价', fieldValues: { item: '钻石饰品', description: '第二件半价' } },
  { discountTypeId: 'second-half', discountType: '第二件半价', discountDetail: '全场珠宝第二件半价', content: '全场珠宝第二件半价', fieldValues: { item: '珠宝', description: '第二件半价' } },

  // === 阶梯满减 ===
  { discountTypeId: 'tiered-spend', discountType: '阶梯满减', discountDetail: '满500减50，满1000减150，满3000减500', content: '满500减50，满1000减150，满3000减500', fieldValues: { tier1: '满500减50', tier2: '满1000减150', tier3: '满3000减500' } },
  { discountTypeId: 'tiered-spend', discountType: '阶梯满减', discountDetail: '满1000减100，满2000减300，满5000减800', content: '满1000减100，满2000减300，满5000减800', fieldValues: { tier1: '满1000减100', tier2: '满2000减300', tier3: '满5000减800' } },
  { discountTypeId: 'tiered-spend', discountType: '阶梯满减', discountDetail: '满2000减200，满5000减600，满10000减1500', content: '满2000减200，满5000减600，满10000减1500', fieldValues: { tier1: '满2000减200', tier2: '满5000减600', tier3: '满10000减1500' } },
  { discountTypeId: 'tiered-spend', discountType: '阶梯满减', discountDetail: '满1000减100，满3000减400', content: '满1000减100，满3000减400', fieldValues: { tier1: '满1000减100', tier2: '满3000减400' } },

  // === 买赠活动 ===
  { discountTypeId: 'buy-give', discountType: '买赠活动', discountDetail: '买任一款项链赠银饰手链', content: '买任一款项链赠银饰手链', fieldValues: { buyCondition: '任一款项链', gift: '银饰手链' } },
  { discountTypeId: 'buy-give', discountType: '买赠活动', discountDetail: '买钻戒赠精美首饰盒', content: '买钻戒赠精美首饰盒', fieldValues: { buyCondition: '钻戒', gift: '精美首饰盒' } },
  { discountTypeId: 'buy-give', discountType: '买赠活动', discountDetail: '买黄金手链赠珍珠耳钉', content: '买黄金手链赠珍珠耳钉', fieldValues: { buyCondition: '黄金手链', gift: '珍珠耳钉' } },
  { discountTypeId: 'buy-give', discountType: '买赠活动', discountDetail: '买翡翠挂件赠银项链', content: '买翡翠挂件赠银项链', fieldValues: { buyCondition: '翡翠挂件', gift: '银项链' } },
  { discountTypeId: 'buy-give', discountType: '买赠活动', discountDetail: '买钻石赠品牌清洁套装', content: '买钻石赠品牌清洁套装', fieldValues: { buyCondition: '钻石', gift: '品牌清洁套装' } },
  { discountTypeId: 'buy-give', discountType: '买赠活动', discountDetail: '满3件赠精美礼品袋', content: '满3件赠精美礼品袋', fieldValues: { buyCondition: '满3件', gift: '精美礼品袋' } },
  { discountTypeId: 'buy-give', discountType: '买赠活动', discountDetail: '买铂金赠银耳钉', content: '买铂金赠银耳钉', fieldValues: { buyCondition: '铂金', gift: '银耳钉' } },
  { discountTypeId: 'buy-give', discountType: '买赠活动', discountDetail: '买和田玉赠玛瑙手串', content: '买和田玉赠玛瑙手串', fieldValues: { buyCondition: '和田玉', gift: '玛瑙手串' } },

  // === 满额送礼 ===
  { discountTypeId: 'full-gift', discountType: '满额送礼', discountDetail: '满1000元送银耳钉', content: '满1000元送银耳钉', fieldValues: { spend: 1000, gift: '银耳钉' } },
  { discountTypeId: 'full-gift', discountType: '满额送礼', discountDetail: '满2000元送珍珠耳钉', content: '满2000元送珍珠耳钉', fieldValues: { spend: 2000, gift: '珍珠耳钉' } },
  { discountTypeId: 'full-gift', discountType: '满额送礼', discountDetail: '满3000元送银手镯', content: '满3000元送银手镯', fieldValues: { spend: 3000, gift: '银手镯' } },
  { discountTypeId: 'full-gift', discountType: '满额送礼', discountDetail: '满5000元送黄金转运珠', content: '满5000元送黄金转运珠', fieldValues: { spend: 5000, gift: '黄金转运珠' } },
  { discountTypeId: 'full-gift', discountType: '满额送礼', discountDetail: '满8000元送品牌手表', content: '满8000元送品牌手表', fieldValues: { spend: 8000, gift: '品牌手表' } },
  { discountTypeId: 'full-gift', discountType: '满额送礼', discountDetail: '满10000元送钻石耳钉', content: '满10000元送钻石耳钉', fieldValues: { spend: 10000, gift: '钻石耳钉' } },
  { discountTypeId: 'full-gift', discountType: '满额送礼', discountDetail: '满15000元送翡翠吊坠', content: '满15000元送翡翠吊坠', fieldValues: { spend: 15000, gift: '翡翠吊坠' } },
  { discountTypeId: 'full-gift', discountType: '满额送礼', discountDetail: '满20000元送黄金金条', content: '满20000元送黄金金条', fieldValues: { spend: 20000, gift: '黄金金条' } },

  // === 以旧换新 ===
  { discountTypeId: 'trade-in', discountType: '以旧换新', discountDetail: '旧金饰换新款足金，补贴100元', content: '旧金饰换新款足金，补贴100元', fieldValues: { oldItem: '旧金饰', newItem: '新款足金', extra: '补贴100元' } },
  { discountTypeId: 'trade-in', discountType: '以旧换新', discountDetail: '旧金饰换新款足金，免折旧费', content: '旧金饰换新款足金，免折旧费', fieldValues: { oldItem: '旧金饰', newItem: '新款足金', extra: '免折旧费' } },
  { discountTypeId: 'trade-in', discountType: '以旧换新', discountDetail: '旧钻石换新款钻戒，免折旧费', content: '旧钻石换新款钻戒，免折旧费', fieldValues: { oldItem: '旧钻石', newItem: '新款钻戒', extra: '免折旧费' } },
  { discountTypeId: 'trade-in', discountType: '以旧换新', discountDetail: '旧银饰换新款银饰，工费5折', content: '旧银饰换新款银饰，工费5折', fieldValues: { oldItem: '旧银饰', newItem: '新款银饰', extra: '工费5折' } },
  { discountTypeId: 'trade-in', discountType: '以旧换新', discountDetail: '旧铂金换新款铂金，补贴200元', content: '旧铂金换新款铂金，补贴200元', fieldValues: { oldItem: '旧铂金', newItem: '新款铂金', extra: '补贴200元' } },
  { discountTypeId: 'trade-in', discountType: '以旧换新', discountDetail: '旧K金换新款18K金，工费8折', content: '旧K金换新款18K金，工费8折', fieldValues: { oldItem: '旧K金', newItem: '新款18K金', extra: '工费8折' } },

  // === 会员专享价 ===
  { discountTypeId: 'member-only', discountType: '会员专享价', discountDetail: '会员享双倍积分', content: '会员享双倍积分', fieldValues: { condition: '注册会员', benefit: '双倍积分' } },
  { discountTypeId: 'member-only', discountType: '会员专享价', discountDetail: '会员享额外9折', content: '会员享额外9折', fieldValues: { condition: '注册会员', benefit: '额外9折' } },
  { discountTypeId: 'member-only', discountType: '会员专享价', discountDetail: '会员享额外9.5折', content: '会员享额外9.5折', fieldValues: { condition: '注册会员', benefit: '额外9.5折' } },
  { discountTypeId: 'member-only', discountType: '会员专享价', discountDetail: '会员享专属折扣价', content: '会员享专属折扣价', fieldValues: { condition: '注册会员', benefit: '专属折扣价' } },
  { discountTypeId: 'member-only', discountType: '会员专享价', discountDetail: '会员生日月双倍积分', content: '会员生日月双倍积分', fieldValues: { condition: '会员生日月', benefit: '双倍积分' } },
  { discountTypeId: 'member-only', discountType: '会员专享价', discountDetail: '会员生日月额外减100', content: '会员生日月额外减100', fieldValues: { condition: '会员生日月', benefit: '额外减100' } },
  { discountTypeId: 'member-only', discountType: '会员专享价', discountDetail: 'VIP会员享8.5折', content: 'VIP会员享8.5折', fieldValues: { condition: 'VIP会员', benefit: '享8.5折' } },

  // === 积分兑换 ===
  { discountTypeId: 'points-exchange', discountType: '积分兑换', discountDetail: '3000积分兑换银耳钉', content: '3000积分兑换银耳钉', fieldValues: { points: 3000, item: '银耳钉' } },
  { discountTypeId: 'points-exchange', discountType: '积分兑换', discountDetail: '5000积分兑换银饰手链', content: '5000积分兑换银饰手链', fieldValues: { points: 5000, item: '银饰手链' } },
  { discountTypeId: 'points-exchange', discountType: '积分兑换', discountDetail: '8000积分兑换珍珠耳钉', content: '8000积分兑换珍珠耳钉', fieldValues: { points: 8000, item: '珍珠耳钉' } },
  { discountTypeId: 'points-exchange', discountType: '积分兑换', discountDetail: '10000积分兑换珍珠项链', content: '10000积分兑换珍珠项链', fieldValues: { points: 10000, item: '珍珠项链' } },
  { discountTypeId: 'points-exchange', discountType: '积分兑换', discountDetail: '20000积分兑换黄金转运珠', content: '20000积分兑换黄金转运珠', fieldValues: { points: 20000, item: '黄金转运珠' } },
  { discountTypeId: 'points-exchange', discountType: '积分兑换', discountDetail: '50000积分兑换钻石吊坠', content: '50000积分兑换钻石吊坠', fieldValues: { points: 50000, item: '钻石吊坠' } },

  // === 新人专享 ===
  { discountTypeId: 'new-member', discountType: '新人专享', discountDetail: '新客到店领50元无门槛券', content: '新客到店领50元无门槛券', fieldValues: { condition: '新客到店', benefit: '领50元无门槛券' } },
  { discountTypeId: 'new-member', discountType: '新人专享', discountDetail: '注册即领首单立减100', content: '注册即领首单立减100', fieldValues: { condition: '注册即领', benefit: '首单立减100' } },
  { discountTypeId: 'new-member', discountType: '新人专享', discountDetail: '注册即领首单立减200', content: '注册即领首单立减200', fieldValues: { condition: '注册即领', benefit: '首单立减200' } },
  { discountTypeId: 'new-member', discountType: '新人专享', discountDetail: '新人首单享8折', content: '新人首单享8折', fieldValues: { condition: '新人首单', benefit: '享8折' } },
  { discountTypeId: 'new-member', discountType: '新人专享', discountDetail: '新人首单享8.5折', content: '新人首单享8.5折', fieldValues: { condition: '新人首单', benefit: '享8.5折' } },
  { discountTypeId: 'new-member', discountType: '新人专享', discountDetail: '新客消费满1000减150', content: '新客消费满1000减150', fieldValues: { condition: '新客消费满1000', benefit: '减150' } },

  // === 储值卡优惠 ===
  { discountTypeId: 'store-card', discountType: '储值卡优惠', discountDetail: '充值1000送100', content: '充值1000送100', fieldValues: { recharge: '充值1000', bonus: '送100' } },
  { discountTypeId: 'store-card', discountType: '储值卡优惠', discountDetail: '充值2000送200', content: '充值2000送200', fieldValues: { recharge: '充值2000', bonus: '送200' } },
  { discountTypeId: 'store-card', discountType: '储值卡优惠', discountDetail: '充值3000送500', content: '充值3000送500', fieldValues: { recharge: '充值3000', bonus: '送500' } },
  { discountTypeId: 'store-card', discountType: '储值卡优惠', discountDetail: '充值5000送800', content: '充值5000送800', fieldValues: { recharge: '充值5000', bonus: '送800' } },
  { discountTypeId: 'store-card', discountType: '储值卡优惠', discountDetail: '充值5000送1000', content: '充值5000送1000', fieldValues: { recharge: '充值5000', bonus: '送1000' } },
  { discountTypeId: 'store-card', discountType: '储值卡优惠', discountDetail: '充值10000送2000', content: '充值10000送2000', fieldValues: { recharge: '充值10000', bonus: '送2000' } },
  { discountTypeId: 'store-card', discountType: '储值卡优惠', discountDetail: '充值10000送3000', content: '充值10000送3000', fieldValues: { recharge: '充值10000', bonus: '送3000' } },
  { discountTypeId: 'store-card', discountType: '储值卡优惠', discountDetail: '充值20000送5000', content: '充值20000送5000', fieldValues: { recharge: '充值20000', bonus: '送5000' } },

  // === 限时秒杀 ===
  { discountTypeId: 'flash-sale', discountType: '限时秒杀', discountDetail: '爆款银项链仅99元', content: '爆款银项链仅99元', fieldValues: { time: '活动期间', item: '爆款银项链', price: '仅99元' } },
  { discountTypeId: 'flash-sale', discountType: '限时秒杀', discountDetail: '银手链仅129元', content: '银手链仅129元', fieldValues: { time: '活动期间', item: '银手链', price: '仅129元' } },
  { discountTypeId: 'flash-sale', discountType: '限时秒杀', discountDetail: '珍珠耳环仅159元', content: '珍珠耳环仅159元', fieldValues: { time: '活动期间', item: '珍珠耳环', price: '仅159元' } },
  { discountTypeId: 'flash-sale', discountType: '限时秒杀', discountDetail: '黄金转运珠仅199元', content: '黄金转运珠仅199元', fieldValues: { time: '活动期间', item: '黄金转运珠', price: '仅199元' } },
  { discountTypeId: 'flash-sale', discountType: '限时秒杀', discountDetail: '翡翠吊坠仅299元', content: '翡翠吊坠仅299元', fieldValues: { time: '活动期间', item: '翡翠吊坠', price: '仅299元' } },
  { discountTypeId: 'flash-sale', discountType: '限时秒杀', discountDetail: '限量款手镯仅299元', content: '限量款手镯仅299元', fieldValues: { time: '活动期间', item: '限量款手镯', price: '仅299元' } },
  { discountTypeId: 'flash-sale', discountType: '限时秒杀', discountDetail: '18K金耳钉仅399元', content: '18K金耳钉仅399元', fieldValues: { time: '活动期间', item: '18K金耳钉', price: '仅399元' } },
  { discountTypeId: 'flash-sale', discountType: '限时秒杀', discountDetail: '黄金戒指仅599元', content: '黄金戒指仅599元', fieldValues: { time: '活动期间', item: '黄金戒指', price: '仅599元' } },

  // === 拼团优惠 ===
  { discountTypeId: 'group-buy', discountType: '拼团优惠', discountDetail: '2人团银饰套装仅299元', content: '2人团银饰套装仅299元', fieldValues: { people: '2人团', price: '299元', item: '银饰套装' } },
  { discountTypeId: 'group-buy', discountType: '拼团优惠', discountDetail: '3人团珍珠项链仅499元', content: '3人团珍珠项链仅499元', fieldValues: { people: '3人团', price: '499元', item: '珍珠项链' } },
  { discountTypeId: 'group-buy', discountType: '拼团优惠', discountDetail: '3人团指定款项链仅999元', content: '3人团指定款项链仅999元', fieldValues: { people: '3人团', price: '999元', item: '指定款项链' } },
  { discountTypeId: 'group-buy', discountType: '拼团优惠', discountDetail: '5人团黄金手链仅1599元', content: '5人团黄金手链仅1599元', fieldValues: { people: '5人团', price: '1599元', item: '黄金手链' } },
  { discountTypeId: 'group-buy', discountType: '拼团优惠', discountDetail: '5人团钻石吊坠仅2999元', content: '5人团钻石吊坠仅2999元', fieldValues: { people: '5人团', price: '2999元', item: '钻石吊坠' } },

  // === 组合套餐 ===
  { discountTypeId: 'combo-deal', discountType: '组合套餐', discountDetail: '戒指+项链组合套餐1299元', content: '戒指+项链组合套餐原价1899套餐价1299', fieldValues: { items: '戒指+项链', price: '套餐价1299' } },
  { discountTypeId: 'combo-deal', discountType: '组合套餐', discountDetail: '项链+手链+耳钉组合套餐1999元', content: '项链+手链+耳钉组合套餐原价2999套餐价1999', fieldValues: { items: '项链+手链+耳钉', price: '套餐价1999' } },
  { discountTypeId: 'combo-deal', discountType: '组合套餐', discountDetail: '手镯+耳钉+吊坠组合套餐3999元', content: '手镯+耳钉+吊坠组合套餐原价5999套餐价3999', fieldValues: { items: '手镯+耳钉+吊坠', price: '套餐价3999' } },
  { discountTypeId: 'combo-deal', discountType: '组合套餐', discountDetail: '黄金三件套组合套餐5999元', content: '黄金三件套组合套餐原价8999套餐价5999', fieldValues: { items: '黄金三件套', price: '套餐价5999' } },
  { discountTypeId: 'combo-deal', discountType: '组合套餐', discountDetail: '钻石对戒+项链组合套餐9999元', content: '钻石对戒+项链组合套餐原价15999套餐价9999', fieldValues: { items: '钻石对戒+项链', price: '套餐价9999' } },

  // === 优惠券领取 ===
  { discountTypeId: 'coupon', discountType: '优惠券领取', discountDetail: '领满300减30优惠券', content: '领满300减30优惠券到店扫码领取', fieldValues: { amount: '满300减30', way: '到店扫码领取' } },
  { discountTypeId: 'coupon', discountType: '优惠券领取', discountDetail: '领满500减50优惠券', content: '领满500减50优惠券到店扫码领取', fieldValues: { amount: '满500减50', way: '到店扫码领取' } },
  { discountTypeId: 'coupon', discountType: '优惠券领取', discountDetail: '领满500减100优惠券', content: '领满500减100优惠券到店扫码领取', fieldValues: { amount: '满500减100', way: '到店扫码领取' } },
  { discountTypeId: 'coupon', discountType: '优惠券领取', discountDetail: '领满1000减200优惠券', content: '领满1000减200优惠券关注公众号领取', fieldValues: { amount: '满1000减200', way: '关注公众号领取' } },
  { discountTypeId: 'coupon', discountType: '优惠券领取', discountDetail: '领满2000减500优惠券', content: '领满2000减500优惠券到店领取', fieldValues: { amount: '满2000减500', way: '到店领取' } },
  { discountTypeId: 'coupon', discountType: '优惠券领取', discountDetail: '领满5000减1000优惠券', content: '领满5000减1000优惠券到店领取', fieldValues: { amount: '满5000减1000', way: '到店领取' } },
  { discountTypeId: 'coupon', discountType: '优惠券领取', discountDetail: '领100元无门槛优惠券', content: '领100元无门槛优惠券小程序领取', fieldValues: { amount: '100元无门槛', way: '小程序领取' } },

  // === 抽奖活动 ===
  { discountTypeId: 'lucky-draw', discountType: '抽奖活动', discountDetail: '进店即抽精美礼品', content: '进店即参与抽奖抽精美礼品', fieldValues: { condition: '进店即', prizes: '抽精美礼品' } },
  { discountTypeId: 'lucky-draw', discountType: '抽奖活动', discountDetail: '消费满300元抽银饰大奖', content: '消费满300元参与抽奖抽银饰大奖', fieldValues: { condition: '消费满300元', prizes: '抽银饰大奖' } },
  { discountTypeId: 'lucky-draw', discountType: '抽奖活动', discountDetail: '消费满500元抽金条大奖', content: '消费满500元参与抽奖抽金条大奖', fieldValues: { condition: '消费满500元', prizes: '抽金条大奖' } },
  { discountTypeId: 'lucky-draw', discountType: '抽奖活动', discountDetail: '消费满1000元抽钻石项链', content: '消费满1000元参与抽奖抽钻石项链', fieldValues: { condition: '消费满1000元', prizes: '抽钻石项链' } },
  { discountTypeId: 'lucky-draw', discountType: '抽奖活动', discountDetail: '消费满2000元抽黄金大奖', content: '消费满2000元参与抽奖抽黄金大奖', fieldValues: { condition: '消费满2000元', prizes: '抽黄金大奖' } },
  { discountTypeId: 'lucky-draw', discountType: '抽奖活动', discountDetail: '扫码参与抽免单大奖', content: '扫码参与抽奖抽免单大奖', fieldValues: { condition: '扫码参与', prizes: '抽免单大奖' } },

  // === 定金膨胀 ===
  { discountTypeId: 'deposit-expand', discountType: '定金膨胀', discountDetail: '交50元定金抵100元', content: '交50元定金抵100元', fieldValues: { deposit: 50, expand: '抵100元', item: '全场商品' } },
  { discountTypeId: 'deposit-expand', discountType: '定金膨胀', discountDetail: '交50元定金抵150元', content: '交50元定金抵150元', fieldValues: { deposit: 50, expand: '抵150元', item: '全场商品' } },
  { discountTypeId: 'deposit-expand', discountType: '定金膨胀', discountDetail: '交100元定金抵200元', content: '交100元定金抵200元', fieldValues: { deposit: 100, expand: '抵200元', item: '全场商品' } },
  { discountTypeId: 'deposit-expand', discountType: '定金膨胀', discountDetail: '交100元定金抵300元', content: '交100元定金抵300元', fieldValues: { deposit: 100, expand: '抵300元', item: '全场商品' } },
  { discountTypeId: 'deposit-expand', discountType: '定金膨胀', discountDetail: '交200元定金抵500元', content: '交200元定金抵500元', fieldValues: { deposit: 200, expand: '抵500元', item: '全场商品' } },
  { discountTypeId: 'deposit-expand', discountType: '定金膨胀', discountDetail: '交500元定金抵1000元', content: '交500元定金抵1000元', fieldValues: { deposit: 500, expand: '抵1000元', item: '全场商品' } },

  // === 分期免息 ===
  { discountTypeId: 'installment', discountType: '分期免息', discountDetail: '黄金饰品3期分期免息', content: '黄金饰品3期分期免息', fieldValues: { period: '3期', item: '黄金饰品' } },
  { discountTypeId: 'installment', discountType: '分期免息', discountDetail: '钻戒6期分期免息', content: '钻戒6期分期免息', fieldValues: { period: '6期', item: '钻戒' } },
  { discountTypeId: 'installment', discountType: '分期免息', discountDetail: '翡翠手镯6期分期免息', content: '翡翠手镯6期分期免息', fieldValues: { period: '6期', item: '翡翠手镯' } },
  { discountTypeId: 'installment', discountType: '分期免息', discountDetail: '指定款珠宝12期分期免息', content: '指定款珠宝12期分期免息', fieldValues: { period: '12期', item: '指定款珠宝' } },
  { discountTypeId: 'installment', discountType: '分期免息', discountDetail: '钻石对戒12期分期免息', content: '钻石对戒12期分期免息', fieldValues: { period: '12期', item: '钻石对戒' } },
  { discountTypeId: 'installment', discountType: '分期免息', discountDetail: '全场珠宝24期分期免息', content: '全场珠宝24期分期免息', fieldValues: { period: '24期', item: '珠宝' } },
]
