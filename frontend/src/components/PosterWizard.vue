<script setup>
import { computed } from 'vue'
import { usePosterStore } from '../store/poster'
import { storeToRefs } from 'pinia'
import Step1FestivalBrand from './steps/Step1FestivalBrand.vue'
import Step3Promotions from './steps/Step3Promotions.vue'
import Step4BackActivities from './steps/Step4BackActivities.vue'
import StepCarSticker from './steps/StepCarSticker.vue'
import StepNav from './common/StepNav.vue'
import InfoPanel from './common/InfoPanel.vue'

const store = usePosterStore()
const { materialType } = storeToRefs(store)

const steps = computed(() => [
  { num: 1, label: '节日与品牌', icon: '🏷️' },
  { num: 2, label: '正面推广', icon: '⭐' },
  { num: 3, label: '反面活动', icon: '📋' },
])
</script>

<template>
  <!-- 物料类型选择 -->
  <div class="material-selector">
    <button
      :class="['material-btn', { active: materialType === 'poster' }]"
      @click="store.materialType = 'poster'; store.carStickerUrl = null"
    >
      <span class="material-icon">🖼️</span>
      <span>海报页</span>
    </button>
    <button
      :class="['material-btn', { active: materialType === 'car-sticker' }]"
      @click="store.materialType = 'car-sticker'; store.frontPosterUrl = store.backPosterUrl = null"
    >
      <span class="material-icon">🚗</span>
      <span>车贴</span>
    </button>
  </div>

  <div v-if="materialType === 'poster'" class="wizard-layout">
    <aside class="wizard-sidebar">
      <StepNav :steps="steps" :current="store.currentStep" />
      <InfoPanel />
    </aside>

    <section class="wizard-content">
      <Step1FestivalBrand v-if="store.currentStep === 1" />
      <Step3Promotions v-else-if="store.currentStep === 2" />
      <Step4BackActivities v-else-if="store.currentStep === 3" />
    </section>
  </div>

  <div v-else-if="materialType === 'car-sticker'">
    <StepCarSticker />
  </div>
</template>

<style scoped>
.wizard-layout {
  display: flex;
  gap: 24px;
  min-height: calc(100vh - 120px);
}

.wizard-sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.wizard-content {
  flex: 1;
  min-width: 0;
}

/* 物料类型选择器 */
.material-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.material-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border: 2px solid #2a2a4a;
  border-radius: 12px;
  background: transparent;
  color: #999;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.material-btn:hover { border-color: #777; color: #ddd; }
.material-btn.active { border-color: #FFD700; color: #FFD700; background: rgba(255,215,0,0.08); }

.material-icon { font-size: 22px; }

@media (max-width: 900px) {
  .wizard-layout {
    flex-direction: column;
  }
  .wizard-sidebar {
    width: 100%;
  }
}
</style>
