<script setup>
import { computed } from 'vue'

const props = defineProps({
  steps: { type: Array, required: true },
  current: { type: Number, required: true },
})
const emit = defineEmits(['step-change'])

const handleClick = (step) => {
  if (step.num < props.current) emit('step-change', step.num)
}
</script>

<template>
  <nav class="md3-nav-rail">
    <div class="step-nav-header">创建步骤</div>
    <div
      v-for="step in steps"
      :key="step.num"
      :class="[
        'md3-nav-rail__item',
        { 'md3-nav-rail__item--active': step.num === current },
        { 'md3-nav-rail__item--completed': step.num < current },
      ]"
      @click="handleClick(step)"
    >
      <div class="md3-nav-rail__indicator">
        <span v-if="step.num < current" class="step-check">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        </span>
        <span v-else class="step-number">{{ step.num }}</span>
      </div>
      <div class="md3-nav-rail__label">
        <span class="step-label-text">{{ step.label }}</span>
        <span class="step-desc-text">{{ step.desc }}</span>
      </div>
      <span v-if="step.num < current" class="step-arrow">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </span>
    </div>
  </nav>
</template>

<style scoped>
.md3-nav-rail {
  padding: 8px 0;
}

.step-nav-header {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--md-on-surface-variant);
  margin-bottom: 14px;
  padding: 0 4px;
}

.md3-nav-rail__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--md-shape-medium);
  margin-bottom: 4px;
  cursor: default;
  transition: all var(--md-duration-short4) var(--md-easing-standard);
}

.md3-nav-rail__item:last-child {
  margin-bottom: 0;
}

.md3-nav-rail__item--completed {
  cursor: pointer;
}

.md3-nav-rail__item--completed:hover {
  background: var(--md-surface-container-low);
}

.md3-nav-rail__item--active {
  background: var(--md-surface-container-low);
}

.md3-nav-rail__indicator {
  width: 32px;
  height: 32px;
  border-radius: var(--md-shape-small);
  background: var(--md-surface-container);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--md-duration-short4) var(--md-easing-standard);
}

.md3-nav-rail__item--active .md3-nav-rail__indicator {
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
}

.md3-nav-rail__item--completed .md3-nav-rail__indicator {
  background: var(--md-primary);
  color: var(--md-on-primary);
}

.step-number {
  font-size: 14px;
  font-weight: 600;
  color: var(--md-on-surface-variant);
  line-height: 1;
}

.md3-nav-rail__item--active .step-number {
  color: var(--md-on-primary-container);
}

.step-check {
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-arrow {
  flex-shrink: 0;
  color: var(--md-on-surface-variant);
  opacity: 0;
  transition: opacity var(--md-duration-short4) var(--md-easing-standard);
}

.md3-nav-rail__item--completed:hover .step-arrow {
  opacity: 1;
}

.md3-nav-rail__label {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.step-label-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--md-on-surface-variant);
}

.md3-nav-rail__item--active .step-label-text {
  color: var(--md-on-surface);
  font-weight: 600;
}

.step-desc-text {
  font-size: 12px;
  color: var(--md-outline);
}

.md3-nav-rail__item--active .step-desc-text {
  color: var(--md-on-surface-variant);
}
</style>
