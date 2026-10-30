<script setup>
const props = defineProps({
  steps: { type: Array, required: true },
  current: { type: Number, required: true },
})
const emit = defineEmits(['step-change'])

const go = (n) => { if (n < props.current) emit('step-change', n) }
</script>

<template>
  <nav class="tabline step-tabs" aria-label="创建步骤">
    <button
      v-for="s in steps"
      :key="s.num"
      type="button"
      :class="['tabline__item', 'step-tab', { 'is-active': s.num === current, 'is-done': s.num < current }]"
      :aria-current="s.num === current ? 'step' : undefined"
      :disabled="s.num > current"
      @click="go(s.num)"
    >
      <span class="step-tab__num ed-num">{{ String(s.num).padStart(2, '0') }}</span>
      <span class="step-tab__label">{{ s.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.step-tab.is-done { cursor: pointer; color: var(--ed-ink-soft); }
.step-tab.is-done:hover { color: var(--ed-ink); }
.step-tab.is-active { cursor: default; }

.step-tab__num { font-size: var(--ed-label); letter-spacing: .04em; }
.step-tab.is-active .step-tab__num { color: var(--ed-accent); }

@media (max-width: 720px) {
  .step-tabs { gap: var(--ed-space-4); overflow-x: auto; }
  .step-tab__label { font-size: 13px; }
}
</style>
