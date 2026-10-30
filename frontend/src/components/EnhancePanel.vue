<script setup>
import { ref, computed } from 'vue'
import { usePosterStore } from '../store/poster'
import EdDialog from './common/EdDialog.vue'
import EdButton from './common/EdButton.vue'
import EdIcon from './common/EdIcon.vue'

const props = defineProps({
  target: { type: String, default: 'back' },
  show: { type: Boolean, default: false },
})
const emit = defineEmits(['update:show', 'enhanced'])

const store = usePosterStore()
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

const handleRegenerate = async () => {
  store.enhanceError = null
  emit('update:show', false)
  await store.generatePosters()
}

const close = () => {
  emit('update:show', false)
}
</script>

<template>
  <EdDialog v-if="show" title="优化海报" :width="520" @close="close">
    <div class="note note--accent">
      <EdIcon name="sparkle" :size="13" class="note__icon" />
      <span v-if="!isBack">正面海报优化后建议检查文字是否正确</span>
      <span v-else>反面海报仅优化背景，文字不受影响</span>
    </div>

    <div class="opt-list">
      <button
        v-for="opt in options"
        :key="opt.key"
        type="button"
        :class="['opt-row', { 'is-selected': selectedType === opt.key }]"
        @click="selectedType = opt.key"
      >
        <span :class="['opt-box', { 'is-checked': selectedType === opt.key }]">
          <EdIcon v-if="selectedType === opt.key" name="check" :size="11" />
        </span>
        <span class="opt-text">
          <span class="opt-title">{{ opt.label }}</span>
          <span class="opt-desc ed-meta">{{ opt.desc }}</span>
        </span>
      </button>
    </div>

    <div v-if="store.enhanceError" class="note note--danger ep__error">
      <EdIcon name="warning" :size="13" class="note__icon" />
      <span>{{ store.enhanceError }}</span>
      <EdButton variant="text" @click="handleRegenerate">重新生成海报</EdButton>
    </div>

    <template #footer>
      <EdButton v-if="hasEnhanced" variant="text" class="ep__revert" @click="handleRevert">撤销优化</EdButton>
      <span class="ep__spacer" />
      <EdButton variant="text" @click="close">取消</EdButton>
      <EdButton variant="solid" :loading="store.enhancing" @click="handleEnhance">应用优化</EdButton>
    </template>
  </EdDialog>
</template>

<style scoped>
.note--accent { border-left-color: var(--ed-accent); background: var(--ed-accent-tint); }
.note--danger { border-left-color: var(--ed-danger); background: var(--ed-danger-tint); }
.note__icon { flex-shrink: 0; margin-top: 2px; }

.opt-list {
  display: flex;
  flex-direction: column;
  margin-top: var(--ed-space-5);
}
.opt-row {
  display: flex;
  align-items: center;
  gap: var(--ed-space-3);
  padding: var(--ed-space-3) 0;
  border: 0;
  border-bottom: 1px solid var(--ed-rule);
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.opt-row:hover { border-bottom-color: var(--ed-ink-faint); }

.opt-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 1px solid var(--ed-ink);
  color: var(--ed-paper);
  flex-shrink: 0;
}
.opt-box.is-checked { background: var(--ed-ink); }

.opt-text { display: flex; flex-direction: column; gap: 2px; }
.opt-title { font-family: var(--ed-serif); font-size: 15px; color: var(--ed-ink); }
.opt-desc { text-transform: none; letter-spacing: .02em; }

.ep__error { margin-top: var(--ed-space-4); }
.ep__revert { color: var(--ed-danger); }
.ep__spacer { flex: 1; }
</style>
