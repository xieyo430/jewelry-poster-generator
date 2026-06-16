<script setup>
defineProps({
  steps: Array,
  current: Number,
})
</script>

<template>
  <nav class="step-nav">
    <div
      v-for="step in steps"
      :key="step.num"
      class="step-item"
      :class="{
        active: step.num === current,
        done: step.num < current,
      }"
    >
      <div class="step-dot">
        <span v-if="step.num < current">✓</span>
        <span v-else>{{ step.icon }}</span>
      </div>
      <div class="step-info">
        <span class="step-label">{{ step.label }}</span>
        <span class="step-num">步骤 {{ step.num }}</span>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.step-nav {
  background: #13132b;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #1e1e3a;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 4px;
  transition: all 0.2s;
  cursor: default;
}

.step-item:last-child { margin-bottom: 0; }

.step-item.done { opacity: 0.6; }
.step-item.done .step-dot { background: #2ecc71; }

.step-item.active { background: rgba(255, 215, 0, 0.08); }
.step-item.active .step-dot { background: #FFD700; box-shadow: 0 0 12px rgba(255, 215, 0, 0.3); }

.step-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #1e1e3a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  transition: all 0.3s;
}

.step-info { display: flex; flex-direction: column; }
.step-label { font-size: 14px; font-weight: 600; color: #ccc; }
.step-num { font-size: 11px; color: #666; margin-top: 2px; }

.step-item.active .step-label { color: #FFD700; }
</style>
