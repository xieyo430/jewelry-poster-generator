<script setup>
import EdIcon from './EdIcon.vue'
defineProps({
  selected: Boolean,
  disabled: Boolean,
})
</script>

<template>
  <button
    type="button"
    :class="['ed-mark', { 'is-selected': selected }]"
    :disabled="disabled"
    :aria-pressed="selected"
  >
    <EdIcon v-if="selected" name="check" :size="12" class="ed-mark__tick" />
    <slot />
  </button>
</template>

<style scoped>
.ed-mark {
  display: inline-flex;
  align-items: center;
  gap: var(--ed-space-1);
  min-height: 32px;
  padding: var(--ed-space-1) var(--ed-space-3);
  border: 1px solid var(--ed-rule);
  border-radius: var(--ed-radius);
  background: transparent;
  color: var(--ed-ink-soft);
  font-family: var(--ed-sans);
  font-size: var(--ed-body);
  line-height: 1.3;
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--ed-fast) var(--ed-ease),
             border-color var(--ed-fast) var(--ed-ease),
             background var(--ed-fast) var(--ed-ease);
}
.ed-mark:hover:not(:disabled) { color: var(--ed-ink); border-color: var(--ed-ink-faint); }
.ed-mark.is-selected {
  color: var(--ed-accent);
  border-color: var(--ed-accent);
  background: var(--ed-accent-tint);
  font-weight: 600;
}
.ed-mark:disabled { opacity: .35; cursor: not-allowed; }
</style>
