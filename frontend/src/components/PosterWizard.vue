<script setup>
import { computed } from 'vue'
import { usePosterStore } from '../store/poster'
import { storeToRefs } from 'pinia'
import Step1FestivalBrand from './steps/Step1FestivalBrand.vue'
import Step2Promotions from './steps/Step2Promotions.vue'
import Step3Activities from './steps/Step3Activities.vue'
import StepNav from './common/StepNav.vue'
import InfoPanel from './common/InfoPanel.vue'

const store = usePosterStore()

const steps = computed(() => [
  { num: 1, label: '节日与品牌', desc: '选择主题和品牌' },
  { num: 2, label: '正面推广', desc: '设置爆点活动' },
  { num: 3, label: '反面活动', desc: '添加详细活动' },
])

const handleStepChange = (num) => {
  store.currentStep = num
}
</script>

<template>
  <div class="wizard-root">
    <!-- Hero card -->
    <div class="md3-card md3-card--filled hero-card">
      <div class="hero-content">
        <h1 class="hero-title">创建你的<span class="hero-accent">珠宝海报</span></h1>
        <p class="hero-sub">AI 将为你生成精美的节日营销海报</p>
      </div>
    </div>

    <!-- Poster wizard -->
    <div class="wizard-layout">
      <aside class="wizard-side">
        <div class="side-sticky">
          <div class="md3-card md3-card--filled side-card">
            <StepNav :steps="steps" :current="store.currentStep" @step-change="handleStepChange" />
          </div>
          <InfoPanel />
        </div>
      </aside>
      <section class="wizard-main">
        <Transition name="step" mode="out-in">
          <Step1FestivalBrand v-if="store.currentStep === 1" key="step1" />
          <Step2Promotions v-else-if="store.currentStep === 2" key="step2" />
          <Step3Activities v-else-if="store.currentStep === 3" key="step3" />
        </Transition>
      </section>
    </div>
  </div>
</template>

<style scoped>
.wizard-root {
  animation: fadeUp 0.4s ease;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.hero-card {
  margin-bottom: 24px;
  border-radius: var(--md-shape-extra-large);
  padding: 28px 32px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--md-primary) 8%, var(--md-surface)) 0%, var(--md-surface) 100%);
}

.hero-content {
  padding: 0;
}

.hero-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--md-on-surface);
  letter-spacing: -0.5px;
  margin: 0 0 6px;
}

.hero-accent {
  color: var(--md-primary);
}

.hero-sub {
  font-size: var(--md-body-medium);
  color: var(--md-on-surface-variant);
  margin: 0;
}

.wizard-layout {
  display: flex;
  gap: 28px;
  min-height: calc(100vh - 320px);
}

.wizard-side {
  width: 260px;
  flex-shrink: 0;
}

.side-sticky {
  position: sticky;
  top: 80px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.side-card {
  padding: 16px;
}

.wizard-main {
  flex: 1;
  min-width: 0;
}

/* Step transitions */
.step-enter-active {
  transition: all var(--md-duration-medium2) var(--md-easing-standard);
}

.step-leave-active {
  transition: all var(--md-duration-short4) var(--md-easing-standard);
}

.step-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.step-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 1024px) {
  .wizard-layout {
    flex-direction: column;
  }

  .wizard-side {
    width: 100%;
  }

  .side-sticky {
    position: static;
    flex-direction: row;
    gap: 12px;
  }

  .side-sticky > * {
    flex: 1;
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 22px;
  }

  .side-sticky {
    flex-direction: column;
  }
}
</style>
