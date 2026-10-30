<script setup>
import { computed } from 'vue'
import { usePosterStore } from '../store/poster'
import { ensureContrast, readableOn } from '../utils/color'

const store = usePosterStore()
const current = computed(() => store.festivals.find(item => item.id === store.festival) || null)
const isFood = computed(() => store.industry === 'food')
const isElectronics = computed(() => store.industry === 'electronics')
const brandName = computed(() => store.displayBrandName || (isFood.value || isElectronics.value ? '店铺名称' : '品牌名称'))
const palette = computed(() => {
  if (current.value) return { primary: current.value.primaryColor, secondary: current.value.secondaryColor, bg: current.value.bgColor, name: current.value.colorScheme || current.value.name }
  if (isFood.value) return { primary: '#C75C3C', secondary: '#F2A65A', bg: '#FFF5EB', name: '餐饮暖食欲' }
  if (isElectronics.value) return { primary: '#1769E0', secondary: '#42D4FF', bg: '#F2F7FF', name: '数码科技蓝' }
  return { primary: '#5567d9', secondary: '#a7b0ff', bg: '#f3f5ff', name: '主题配色' }
})
const campaignTitle = computed(() => {
  if (isFood.value) return store.foodCampaign.dishName || store.foodCampaign.setContents || store.foodCampaign.eventType || '招牌美食'
  if (isElectronics.value) return store.electronicsCampaign.productName || store.electronicsCampaign.promotionType || '新品上市'
  return store.theme || current.value?.name || '节日活动'
})
const defaultSubtitle = computed(() => {
  if (isFood.value) return store.foodCampaign.sellingPoints || store.foodCampaign.dishDescription || '招牌美食限时优惠'
  if (isElectronics.value) return store.electronicsCampaign.sellingPoints || store.electronicsCampaign.promotionValue || '热门新品限时直降'
  return store.industryTemplate?.defaultSubtitle || '全场优惠，限时开启'
})
const campaignEyebrow = computed(() => isFood.value ? 'FOOD CAMPAIGN' : isElectronics.value ? 'DIGITAL CAMPAIGN' : (store.industryTemplate?.name || 'SEASONAL CAMPAIGN'))
const campaignLabel = computed(() => isFood.value ? '到店尝鲜' : isElectronics.value ? '立即了解' : '查看活动详情')
const previewDetails = computed(() => {
  const details = [{ label: isFood.value || isElectronics.value ? '店铺' : '品牌', value: brandName.value }]
  if (isFood.value && store.foodCampaign.dishName) details.push({ label: '菜品', value: store.foodCampaign.dishName })
  if (isElectronics.value && store.electronicsCampaign.productName) details.push({ label: '产品', value: store.electronicsCampaign.productName })
  if (store.merchantInfo.name) details.push({ label: '商家', value: store.merchantInfo.name })
  details.push({ label: '活动日期', value: dateLabel.value })
  return details
})
const dateLabel = computed(() => {
  if (store.startDate && store.endDate) return `${store.startDate} 至 ${store.endDate}`
  if (store.startDate) return `${store.startDate} 起`
  return '活动日期待定'
})
const accent = computed(() => ensureContrast(palette.value.secondary, palette.value.bg, 4.5))
const paletteStyle = computed(() => {
  return {
    '--poster-primary': palette.value.primary,
    '--poster-secondary': accent.value,
    '--poster-bg': palette.value.bg,
    background: palette.value.bg,
    borderColor: palette.value.primary,
    boxShadow: `0 24px 50px color-mix(in srgb, ${palette.value.primary} 24%, transparent)`,
  }
})
const brandStyle = computed(() => ({ background: palette.value.primary, color: readableOn(palette.value.primary) }))
const ctaStyle = computed(() => ({ background: palette.value.primary, color: readableOn(palette.value.primary), borderColor: accent.value }))
</script>

<template>
  <aside class="theme-preview">
    <div class="theme-preview__head"><div><span class="studio-label">LIVE PREVIEW</span><h3>海报主题预览</h3></div><span class="theme-preview__live"><i /> 实时同步</span></div>
    <div class="theme-preview__content">
      <div class="poster-card" :style="paletteStyle">
        <div class="poster-card__wash" />
        <div class="poster-card__frame" />
        <div class="poster-card__brand-row"><span class="poster-card__brand" :style="brandStyle">{{ brandName }}</span><span class="poster-card__festival">{{ current?.name || palette.name }}</span></div>
        <div class="poster-card__decoration" aria-hidden="true">✦</div>
        <div class="poster-card__copy"><span class="poster-card__eyebrow">{{ campaignEyebrow }}</span><h4>{{ campaignTitle }}</h4><p>{{ store.subtitle || defaultSubtitle }}</p></div>
        <div class="poster-card__cta" :style="ctaStyle"><span>{{ campaignLabel }}</span><b>→</b></div>
        <div class="poster-card__footer"><span>{{ dateLabel }}</span><span>AI VISUAL / 01</span></div>
      </div>
      <p class="theme-preview__tip">根据当前行业信息实时更新预览</p>
      <dl class="theme-preview__details"><div v-for="item in previewDetails" :key="item.label"><dt>{{ item.label }}</dt><dd>{{ item.value }}</dd></div></dl>
      <div class="palette"><div class="palette__title"><span>主题配色</span><b>{{ palette.name }}</b></div><div class="palette__colors"><span :style="{ background: palette.primary }" title="主色" /><span :style="{ background: accent }" title="辅色" /><span :style="{ background: palette.bg }" title="底色" /></div><div class="palette__labels"><span>主色</span><span>辅色</span><span>底色</span></div></div>
    </div>
  </aside>
</template>

<style scoped>
.theme-preview{position:static;padding:20px;background:linear-gradient(160deg,color-mix(in srgb,var(--theme-surface) 97%,transparent),color-mix(in srgb,var(--theme-soft) 48%,var(--theme-surface)));border:1px solid color-mix(in srgb,var(--theme-primary) 17%,#e1e5ea);border-radius:16px;box-shadow:0 18px 44px color-mix(in srgb,var(--theme-primary) 10%,transparent);transition:background .45s ease,border-color .3s ease,box-shadow .3s ease}.theme-preview__head{display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:17px;border-bottom:1px solid color-mix(in srgb,var(--theme-primary) 13%,#edf0f3)}.theme-preview h3{margin-top:6px;font-size:15px;font-weight:600}.theme-preview__live{display:inline-flex;align-items:center;gap:5px;color:var(--theme-primary);font:9px var(--ed-mono);letter-spacing:.08em}.theme-preview__live i{width:6px;height:6px;border-radius:50%;background:var(--theme-primary)}.theme-preview__content{padding-top:20px}.poster-card{position:relative;display:flex;flex-direction:column;width:100%;aspect-ratio:4/5;padding:16px;border:2px solid var(--poster-primary);border-radius:13px;color:#fff;overflow:hidden;isolation:isolate;transition:all .35s ease}.poster-card__frame{position:absolute;inset:9px;border:2px solid var(--poster-secondary);border-radius:9px;z-index:1;pointer-events:none}.poster-card__wash{position:absolute;inset:0;z-index:0;background:linear-gradient(155deg,color-mix(in srgb,var(--poster-primary) 70%,var(--poster-bg)) 0%,var(--poster-bg) 58%,color-mix(in srgb,var(--poster-secondary) 28%,var(--poster-bg)) 100%)}.poster-card__brand-row{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;position:relative;z-index:2;min-height:28px}.poster-card__brand{max-width:135px;padding:5px 9px;border-radius:5px;font-size:10px;font-weight:700;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.poster-card__festival{max-width:85px;padding-top:5px;color:rgba(255,255,255,.75);font:9px/1.2 var(--ed-mono);text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.poster-card__decoration{position:absolute;right:-15px;top:55px;color:var(--poster-secondary);font-size:100px;opacity:.5;transform:rotate(14deg);z-index:1}.poster-card__copy{position:relative;z-index:2;min-width:0;margin-top:auto;padding:0 4px 12px}.poster-card__eyebrow{font:8px var(--ed-mono);letter-spacing:.14em;color:rgba(255,255,255,.68)}.poster-card h4{margin-top:12px;overflow-wrap:anywhere;font:700 25px/1.2 var(--ed-serif);letter-spacing:-.04em}.poster-card p{margin-top:7px;color:rgba(255,255,255,.82);font-size:11px;line-height:1.5;overflow-wrap:anywhere}.poster-card__cta{display:flex;align-items:center;justify-content:space-between;min-height:40px;height:auto;padding:10px 11px;border:1px solid;border-radius:7px;font-size:10px}.poster-card__cta b{font-size:16px;font-weight:400}.poster-card__footer{display:flex;justify-content:space-between;gap:8px;padding:12px 2px 0;color:rgba(255,255,255,.62);font:8px var(--ed-mono);letter-spacing:.06em}.theme-preview__tip{margin:12px 2px 20px;color:color-mix(in srgb,var(--theme-primary) 62%,#8c95a0);font-size:11px;line-height:1.6}.palette{padding-top:16px;border-top:1px solid color-mix(in srgb,var(--theme-primary) 13%,#edf0f3)}.palette__title,.palette__labels{display:flex;justify-content:space-between}.palette__title{color:var(--theme-primary);font-size:11px}.palette__title b{color:color-mix(in srgb,var(--theme-primary) 58%,#9aa2ad);font:9px var(--ed-mono);font-weight:400}.palette__colors,.palette__labels{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));column-gap:10px}.palette__colors{align-items:center;height:28px;margin-top:10px;overflow:visible;box-shadow:none}.palette__colors span{justify-self:stretch;width:auto;height:28px;border:1px solid color-mix(in srgb,var(--theme-primary) 18%,var(--theme-surface));border-radius:7px;box-shadow:0 3px 8px color-mix(in srgb,var(--theme-primary) 12%,transparent)}.palette__labels{margin-top:7px;color:#9aa2ad;font:9px var(--ed-mono)}.palette__labels span{text-align:center}.theme-preview__empty{min-height:330px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#86909c}.theme-preview__empty-icon{display:grid;place-items:center;width:48px;height:48px;margin-bottom:16px;border:1px dashed color-mix(in srgb,var(--theme-primary) 42%,#bfc6cf);border-radius:14px;color:var(--theme-primary);font-size:20px}.theme-preview__empty strong{font-size:13px;font-weight:500}.theme-preview__empty small{max-width:150px;margin-top:7px;color:#a1a8b1;font-size:10px;line-height:1.6}
@media(max-width:1000px){.theme-preview{position:static}}@media(max-width:720px){.theme-preview{margin-top:28px}.poster-card{max-width:300px;margin:auto}}
.theme-preview__details{display:grid;gap:8px;margin:0 0 16px;padding:12px;border:1px solid color-mix(in srgb,var(--theme-primary) 12%,#e1e5ea);border-radius:8px;background:color-mix(in srgb,var(--theme-soft) 42%,var(--theme-surface))}.theme-preview__details div{display:grid;grid-template-columns:64px minmax(0,1fr);gap:8px;align-items:start}.theme-preview__details dt{color:#818995;font-size:10px}.theme-preview__details dd{min-width:0;margin:0;color:#343a43;font-size:11px;line-height:1.5;overflow-wrap:anywhere}

.theme-preview { padding: 16px; border-radius: 14px; }
.theme-preview__head { padding-bottom: 13px; }
.theme-preview__content { padding-top: 14px; }
.poster-card { aspect-ratio: 5 / 6; padding: 12px; border-radius: 11px; }
.poster-card__frame { inset: 7px; border-radius: 7px; }
.poster-card__brand-row { min-height: 24px; gap: 6px; }
.poster-card__brand { max-width: 120px; padding: 4px 7px; font-size: 9px; }
.poster-card__festival { max-width: 76px; padding-top: 4px; font-size: 8px; }
.poster-card__decoration { top: 44px; font-size: 82px; }
.poster-card__copy { padding: 0 3px 9px; }
.poster-card__eyebrow { font-size: 7px; }
.poster-card h4 { margin-top: 8px; font-size: 21px; }
.poster-card p { margin-top: 5px; font-size: 10px; line-height: 1.4; }
.poster-card__cta { min-height: 34px; padding: 8px 9px; font-size: 9px; }
.poster-card__footer { padding-top: 9px; font-size: 7px; }
.theme-preview__tip { margin: 9px 2px 14px; font-size: 10px; line-height: 1.5; }
.theme-preview__details { gap: 6px; margin-bottom: 12px; padding: 10px; }
.theme-preview__details div { grid-template-columns: 56px minmax(0, 1fr); gap: 7px; }
.theme-preview__details dt { font-size: 9px; }
.theme-preview__details dd { font-size: 10px; line-height: 1.4; }
.palette { padding-top: 12px; }
.palette__colors { height: 24px; margin-top: 8px; column-gap: 8px; }
.palette__colors span { height: 24px; border-radius: 6px; }
.palette__labels { margin-top: 5px; font-size: 8px; }
</style>
