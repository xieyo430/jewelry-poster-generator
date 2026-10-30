// 节日分组：按 festival code（接口返回的 id）归类
// 未命中任何分组的 code 由 festivalGroupKey 兜底到电商节点，保证新节日不丢失
export const FESTIVAL_GROUPS = [
  {
    key: 'traditional',
    label: '传统节日',
    codes: [
      'spring-festival', 'yuanxiao', 'qingming', 'dragon-boat', 'qixi',
      'mid-autumn', 'chongyang', 'winter-solstice', 'laban',
    ],
  },
  {
    key: 'modern',
    label: '现代节日',
    codes: [
      'new-year', 'valentine', 'white-valentine', '520-day', 'mother-day',
      'father-day', 'teachers-day', 'national-day', 'christmas', 'halloween',
      'thanksgiving', 'women-day', 'girl-day',
    ],
  },
  {
    key: 'ecommerce',
    label: '电商节点',
    codes: [
      'double-eleven', 'double-twelve', '618-sale', 'black-friday',
      'anniversary', 'grand-opening', 'new-arrival-spring', 'new-arrival-autumn',
      'season-clearance', 'member-day', 'wedding-season',
    ],
  },
]

export const FALLBACK_GROUP = 'ecommerce'

export function festivalGroupKey(code) {
  return FESTIVAL_GROUPS.find(g => g.codes.includes(code))?.key || FALLBACK_GROUP
}
