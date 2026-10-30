<script setup>
import { computed } from 'vue'
import { usePosterStore } from '../../store/poster'

const store = usePosterStore()

const festivalName = computed(() => store.festivals.find(f => f.id === store.festival)?.name)
const brandName = computed(() => store.displayBrandName)
const isFood = computed(() => store.industry === 'food')
const isElectronics = computed(() => store.industry === 'electronics')

const items = computed(() => {
  const out = []
  if (festivalName.value) out.push({ label: '节日', value: festivalName.value })
  if (brandName.value) out.push({ label: '品牌', value: brandName.value })
  if (store.startDate) out.push({ label: '时间', value: store.startDate + (store.endDate ? ' – ' + store.endDate : '') })
  if (store.theme) out.push({ label: '主题', value: store.theme })
  if (isFood.value) {
    const food = store.foodCampaign
    if (food.dishName) out.push({ label: food.mode === 'store-event' ? '活动' : '菜品', value: food.dishName })
    if (food.promoPrice) out.push({ label: '活动价', value: `${food.promoPrice} 元` })
    if (food.sellingPoints) out.push({ label: '卖点', value: food.sellingPoints })
  }
  if (isElectronics.value) {
    const product = store.electronicsCampaign
    if (product.productName) out.push({ label: '产品', value: product.productName })
    if (product.promotionValue) out.push({ label: '优惠', value: product.promotionValue })
    if (product.features) out.push({ label: '参数', value: product.features })
  }
  if (store.mainPromotion.content) {
    const t = store.mainPromotion.content
    out.push({ label: '主爆点', value: t.length > 18 ? t.slice(0, 18) + '…' : t })
  }
  if (store.activities.length) out.push({ label: '活动', value: `${store.activities.length} 个` })
  if (store.merchantInfo.name) out.push({ label: '商家', value: store.merchantInfo.name })
  return out
})
</script>

<template>
  <aside v-if="items.length" class="notes" aria-label="已填信息">
    <p class="notes__title ed-meta">已填信息</p>
    <dl class="notes__list">
      <div v-for="it in items" :key="it.label" class="notes__row">
        <dt class="notes__label ed-meta">{{ it.label }}</dt>
        <dd class="notes__value">{{ it.value }}</dd>
      </div>
    </dl>
  </aside>
</template>

<style scoped>
.notes {
  position: static;
  padding: 14px;
  border: 1px solid color-mix(in srgb, var(--theme-primary) 15%, #e2e5e9);
  border-radius: 14px;
  background: color-mix(in srgb, var(--theme-surface) 94%, transparent);
  box-shadow: 0 18px 52px color-mix(in srgb, var(--theme-primary) 9%, transparent);
}

.notes__title { margin-bottom: 10px; }

.notes__list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 12px; }

.notes__row { display: flex; min-width: 0; flex-direction: column; gap: 2px; }

.notes__label { text-transform: none; letter-spacing: .04em; }

.notes__value {
  font-family: var(--ed-serif);
  font-size: 12px;
  line-height: 1.4;
  color: var(--ed-ink);
  word-break: break-word;
}

@media (max-width: 1180px) {
  .notes { padding: 13px; }
  .notes__list { grid-template-columns: 1fr; gap: 9px; }
}
</style>
