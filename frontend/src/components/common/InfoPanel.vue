<script setup>
import { computed } from 'vue'
import { usePosterStore } from '../../store/poster'

const store = usePosterStore()

const festivalName = computed(() => store.festivals.find(f => f.id === store.festival)?.name)
const brandName = computed(() => store.brands.find(b => b.id === store.brand)?.name)

const infoItems = computed(() => {
  const items = []
  if (festivalName.value) items.push({ label: '节日', value: festivalName.value })
  if (brandName.value) items.push({ label: '品牌', value: brandName.value })
  if (store.startDate) items.push({ label: '时间', value: store.startDate + (store.endDate ? ' ~ ' + store.endDate : '') })
  if (store.theme) items.push({ label: '主题', value: store.theme })
  if (store.mainPromotion.content) {
    const text = store.mainPromotion.content
    items.push({ label: '主爆点', value: text.length > 18 ? text.slice(0, 18) + '...' : text })
  }
  if (store.activities.length) items.push({ label: '活动', value: `${store.activities.length} 个` })
  if (store.merchantInfo.name) items.push({ label: '商家', value: store.merchantInfo.name })
  return items
})
</script>

<template>
  <div v-if="infoItems.length" class="md3-card md3-card--filled info-panel">
    <div class="info-header">已填信息</div>
    <div class="info-list">
      <div v-for="item in infoItems" :key="item.label" class="info-row">
        <span class="info-label">{{ item.label }}</span>
        <span class="info-value">{{ item.value }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.info-panel {
  padding: 16px;
}

.info-header {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--md-on-surface-variant);
  margin-bottom: 14px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.info-label {
  font-size: var(--md-label-medium);
  font-weight: 500;
  color: var(--md-on-surface-variant);
  flex-shrink: 0;
  min-width: 48px;
}

.info-value {
  font-size: var(--md-body-small);
  color: var(--md-on-surface);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
