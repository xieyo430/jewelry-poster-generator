<script setup>
import { ref, computed, toRef } from 'vue'
import { usePosterStore } from '../store/poster'

const props = defineProps({
  target: { type: String, default: 'back' },
  show: { type: Boolean, default: false },
})
const emit = defineEmits(['update:show', 'enhanced'])

const store = usePosterStore()
const enhancing = toRef(store, 'enhancing')
const enhanceError = toRef(store, 'enhanceError')

const selectedType = ref('overall')

const options = [
  { key: 'color', label: '色彩增强', desc: '提升色彩饱和度，让金色更鲜艳' },
  { key: 'clarity', label: '清晰度提升', desc: '锐化细节，让文字更清晰' },
  { key: 'overall', label: '综合优化', desc: '全面提升色彩、对比度和细节' },
]

const isBack = computed(() => props.target === 'back')
const hasEnhanced = computed(() =>
  isBack.value ? !!store.enhancedBackUrl : !!store.enhancedFrontUrl
)

const handleEnhance = async () => {
  await store.enhancePoster({ type: selectedType.value, target: props.target })
  if (!store.enhanceError) {
    emit('enhanced')
    emit('update:show', false)
  }
}

const handleRevert = () => {
  store.revertEnhancement(props.target)
}

const close = () => {
  emit('update:show', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="md3-dialog-overlay" @click.self="close">
        <div class="md3-dialog enhance-dialog">
          <h2 class="md3-dialog__title">AI 智能优化</h2>

          <div class="md3-dialog__content">
            <div :class="['md3-alert', isBack ? 'md3-alert--info' : 'md3-alert--warning']">
              <span v-if="!isBack">正面海报优化后建议检查文字是否正确</span>
              <span v-else>反面海报仅优化背景，文字不受影响</span>
            </div>

            <div class="options-list">
              <label
                v-for="opt in options"
                :key="opt.key"
                :class="['md3-radio', { 'md3-radio--selected': selectedType === opt.key }]"
                @click="selectedType = opt.key"
              >
                <span class="md3-radio__circle">
                  <span v-if="selectedType === opt.key" class="radio-dot"></span>
                </span>
                <span class="md3-radio__label">
                  <span class="radio-title">{{ opt.label }}</span>
                  <span class="radio-desc">{{ opt.desc }}</span>
                </span>
              </label>
            </div>

            <div v-if="enhanceError" class="md3-alert md3-alert--error" style="margin-top: 12px">
              {{ enhanceError }}
            </div>
          </div>

          <div class="md3-dialog__actions">
            <button v-if="hasEnhanced" class="md3-btn md3-btn--text" style="color: var(--md-error)" @click="handleRevert">
              撤销优化
            </button>
            <div style="flex: 1"></div>
            <button class="md3-btn md3-btn--text" @click="close">取消</button>
            <button class="md3-btn md3-btn--filled" :disabled="enhancing" @click="handleEnhance">
              <span v-if="enhancing" class="md3-spinner md3-spinner--small"><span class="md3-spinner__circle"></span></span>
              <span v-else>应用优化</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.enhance-dialog {
  max-width: 480px;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

.radio-title {
  display: block;
  font-size: var(--md-body-medium);
  font-weight: 600;
  color: var(--md-on-surface);
}

.radio-desc {
  display: block;
  font-size: var(--md-body-small);
  color: var(--md-on-surface-variant);
  margin-top: 2px;
}

.radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--md-primary);
  display: block;
}

/* Transition */
.modal-fade-enter-active {
  transition: all var(--md-duration-medium2) var(--md-easing-standard);
}

.modal-fade-leave-active {
  transition: all var(--md-duration-short4) var(--md-easing-standard);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .md3-dialog {
  transform: translateY(16px) scale(0.95);
}
</style>
