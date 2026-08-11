<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
})
const emit = defineEmits(['cancel'])

const EST_TOTAL = 30 // 预估总秒数
const elapsed = ref(0)
let timer = null

watch(() => props.show, (v) => {
  clearInterval(timer)
  if (v) {
    elapsed.value = 0
    timer = setInterval(() => { elapsed.value++ }, 1000)
  }
})

onBeforeUnmount(() => {
  clearInterval(timer)
})

const remaining = computed(() => Math.max(0, EST_TOTAL - elapsed.value))

const remainText = computed(() => {
  if (remaining.value > 0) return `预计剩余 ${remaining.value} 秒`
  return '即将完成...'
})

// 进度百分比（0~95 封顶，避免到100%卡住）
const progress = computed(() => Math.min(95, Math.round((elapsed.value / EST_TOTAL) * 100)))
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="gp-overlay">
      <div class="gp-dialog">
        <!-- Spinner -->
        <div class="gp-spinner">
          <svg class="gp-ring" width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="var(--md-outline-variant)" stroke-width="4"/>
            <circle cx="28" cy="28" r="24" fill="none" stroke="var(--md-primary)" stroke-width="4"
              stroke-linecap="round" stroke-dasharray="120" stroke-dashoffset="40" class="gp-arc"/>
          </svg>
        </div>

        <!-- Text -->
        <h3 class="gp-title">正在生成海报</h3>
        <p class="gp-desc">AI 正在为您设计海报，请耐心等待...</p>

        <!-- Progress bar -->
        <div class="gp-bar-wrap">
          <div class="gp-bar" :style="{ width: progress + '%' }"></div>
        </div>

        <!-- Remaining time -->
        <p class="gp-time">{{ remainText }}</p>

        <!-- Cancel button -->
        <button class="gp-cancel" @click="emit('cancel')">
          停止生成
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.gp-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  animation: gpFadeIn 0.25s var(--md-easing-emphasized-decel);
}

@keyframes gpFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.gp-dialog {
  background: var(--md-surface-container-low);
  border-radius: var(--md-shape-extra-large);
  padding: 36px 40px 28px;
  width: 320px;
  text-align: center;
  box-shadow: var(--md-elevation-3);
  animation: gpSlideIn 0.3s var(--md-easing-emphasized-decel);
}

@keyframes gpSlideIn {
  from { opacity: 0; transform: scale(0.92) translateY(12px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.gp-spinner {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.gp-ring {
  animation: gpSpin 1.2s linear infinite;
}

.gp-arc {
  animation: gpDash 1.5s ease-in-out infinite;
}

@keyframes gpSpin {
  to { transform: rotate(360deg); }
}

@keyframes gpDash {
  0% { stroke-dashoffset: 120; }
  50% { stroke-dashoffset: 30; }
  100% { stroke-dashoffset: 120; }
}

.gp-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--md-on-surface);
  margin: 0 0 6px;
}

.gp-desc {
  font-size: var(--md-body-small);
  color: var(--md-on-surface-variant);
  margin: 0 0 16px;
}

.gp-bar-wrap {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--md-outline-variant);
  margin-bottom: 12px;
  overflow: hidden;
}

.gp-bar {
  height: 100%;
  border-radius: 3px;
  background: var(--md-primary);
  transition: width 1s linear;
}

.gp-time {
  font-size: var(--md-body-small);
  color: var(--md-on-surface-variant);
  margin: 0 0 20px;
  font-variant-numeric: tabular-nums;
}

.gp-cancel {
  height: 40px;
  padding: 0 24px;
  border-radius: 20px;
  border: 1px solid var(--md-outline);
  background: transparent;
  color: var(--md-error);
  font-size: var(--md-label-large);
  font-weight: 500;
  font-family: var(--md-font-family);
  cursor: pointer;
  transition: all var(--md-duration-short4) var(--md-easing-standard);
}

.gp-cancel:hover {
  background: color-mix(in srgb, var(--md-error) 8%, transparent);
  border-color: var(--md-error);
}
</style>
