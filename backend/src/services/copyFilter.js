// 广告法极限词替换。模型侧已有约束，这层是确定性兜底。
const RULES = [
  [/全国第一|世界第一|全网第一|销量第一|第一名|NO\.?1/g, '热销'],
  [/国家级|国宾级|世界级|国际级|宇宙级/g, '精选'],
  [/顶级|顶尖|顶配|极品|极致|帝王级|王牌/g, '臻选'],
  [/最佳|最优|最好|最强|最棒|最牛/g, '优质'],
  [/最低|最划算|最便宜/g, '特惠'],
  [/最高/g, '超值'],
  [/最新(?!款|品|系列)/g, '新品'],
  [/最大|最高档|最先进/g, '大型'],
  [/最受欢迎|最爱/g, '热门'],
  [/100%|百分百|百分之百|绝对|永久|万能|史无前例|前无古人|独一无二|绝无仅有/g, '精选'],
  [/最(?![新低价好佳优强棒牛大])/g, ''],
]

function filterCopy(text) {
  let replaced = false
  for (const [re, rep] of RULES) {
    if (re.test(text)) { text = text.replace(re, rep); replaced = true }
  }
  return { text, replaced }
}

module.exports = { filterCopy }

if (require.main === module) {
  const assert = require('assert')
  assert.equal(filterCopy('全国最低价').text, '全国特惠价')
  assert.equal(filterCopy('最低价').text, '特惠价')
  assert.equal(filterCopy('顶级钻石').text, '臻选钻石')
  assert.equal(filterCopy('国家级大师').text, '精选大师')
  assert.equal(filterCopy('全场黄金8.5折').replaced, false)
  assert.equal(filterCopy('最新款钻戒').text, '最新款钻戒')
  assert.equal(filterCopy('全网第一').replaced, true)
  console.log('copyFilter ok')
}
