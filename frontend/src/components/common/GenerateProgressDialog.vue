<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import EdDialog from './EdDialog.vue'
import EdButton from './EdButton.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
})
const emit = defineEmits(['cancel'])

const EST_TOTAL = 30
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

const progress = computed(() => Math.min(95, Math.round((elapsed.value / EST_TOTAL) * 100)))
</script>

<template>
  <EdDialog
    v-if="show"
    title="正在生成海报"
    :width="400"
    :close-on-overlay="false"
    :hide-close="true"
  >
    <p class="gp__desc">AI 正在为您设计海报，请耐心等待...</p>

    <div class="gp__pct-row">
      <span class="gp__pct ed-num">{{ progress }}%</span>
    </div>
    <div class="gp__track">
      <div class="gp__fill" :style="{ width: progress + '%' }" />
    </div>

    <p class="gp__time ed-num">{{ remainText }}</p>

    <template #footer>
      <EdButton variant="text" @click="emit('cancel')">停止生成</EdButton>
    </template>
  </EdDialog>
</template>

<style scoped>
.gp__desc { font-size: 14px; color: var(--ed-ink-soft); margin-bottom: var(--ed-space-5); }

.gp__pct-row { display: flex; justify-content: flex-end; margin-bottom: var(--ed-space-2); }
.gp__pct { font-size: var(--ed-label); letter-spacing: .04em; }

.gp__track { position: relative; height: 4px; overflow: visible; background: color-mix(in srgb, var(--ed-rule) 82%, var(--ed-accent)); border-radius: 999px; }
.gp__track::after { content: ''; position: absolute; top: 50%; left: 0; width: 34px; height: 10px; border-radius: 999px; background: color-mix(in srgb, var(--ed-accent) 38%, transparent); filter: blur(4px); transform: translate(-50%, -50%); animation: gp-sweep 1.4s ease-in-out infinite; }
.gp__fill { position: relative; z-index: 1; height: 100%; overflow: visible; border-radius: inherit; background: linear-gradient(90deg, var(--ed-accent-deep), var(--ed-accent)); box-shadow: 0 0 10px color-mix(in srgb, var(--ed-accent) 42%, transparent); transition: width 1s linear; }
.gp__fill::after { content: ''; position: absolute; top: 50%; right: 0; width: 8px; height: 8px; border-radius: 50%; background: var(--ed-paper); box-shadow: 0 0 0 2px var(--ed-accent), 0 0 12px color-mix(in srgb, var(--ed-accent) 72%, transparent); transform: translate(50%, -50%); }

.gp__time { margin-top: var(--ed-space-4); font-size: var(--ed-label); letter-spacing: .04em; color: var(--ed-ink-faint); }
@keyframes gp-sweep { 0% { left: 0; opacity: 0; } 18% { opacity: .9; } 82% { opacity: .9; } 100% { left: 100%; opacity: 0; } }
</style>
