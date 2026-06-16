<script setup>
import { computed } from 'vue'
import { usePosterStore } from '../../store/poster'

const store = usePosterStore()

const festivalName = computed(() => {
  if (!store.festival) return null
  const f = store.festivals.find(f => f.id === store.festival)
  return f?.name
})

const brandName = computed(() => {
  if (!store.brand) return null
  const b = store.brands.find(b => b.id === store.brand)
  return b?.name
})

const infoItems = computed(() => {
  const items = []
  if (festivalName.value) items.push({ label: '节日', value: festivalName.value })
  if (brandName.value) items.push({ label: '品牌', value: brandName.value })
  if (store.startDate) items.push({ label: '开始', value: store.startDate })
  if (store.endDate) items.push({ label: '结束', value: store.endDate })
  if (store.theme) items.push({ label: '主题', value: store.theme })
  if (store.subtitle) items.push({ label: '副标题', value: store.subtitle })
  if (store.mainPromotion.content) items.push({ label: '主爆点', value: store.mainPromotion.content.slice(0, 20) + (store.mainPromotion.content.length > 20 ? '...' : '') })
  if (store.secondaryPromotion.content) items.push({ label: '次爆点', value: store.secondaryPromotion.content.slice(0, 20) + (store.secondaryPromotion.content.length > 20 ? '...' : '') })
  if (store.activities.length) items.push({ label: '反面活动', value: `${store.activities.length} 个` })
  if (store.merchantInfo.name) items.push({ label: '商家', value: store.merchantInfo.name })
  return items
})
</script>

<template>
  <div class="info-panel" v-if="infoItems.length">
    <h3>已填写信息</h3>
    <div class="info-list">
      <div v-for="item in infoItems" :key="item.label" class="info-item">
        <span class="info-label">{{ item.label }}</span>
        <span class="info-value" :class="item.type || ''">{{ item.value }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.info-panel {
  background: #13132b;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #1e1e3a;
}

.info-panel h3 {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: #666;
  letter-spacing: 1px;
  margin-bottom: 12px;
}

.info-list { display: flex; flex-direction: column; gap: 8px; }

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.info-label { color: #888; }
.info-value { color: #ccc; max-width: 150px; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.info-value.success { color: #2ecc71; }
</style>
