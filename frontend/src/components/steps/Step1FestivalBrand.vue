<script setup>
import { computed, toRef } from 'vue'
import { usePosterStore } from '../../store/poster'
import Md3Card from '../common/Md3Card.vue'
import Md3Chip from '../common/Md3Chip.vue'
import Md3Button from '../common/Md3Button.vue'
import Md3TextField from '../common/Md3TextField.vue'
import CalendarRangePicker from '../common/CalendarRangePicker.vue'

const store = usePosterStore()
const festivals = toRef(store, 'festivals')
const brands = toRef(store, 'brands')
const festival = toRef(store, 'festival')
const brand = toRef(store, 'brand')
const startDate = toRef(store, 'startDate')
const endDate = toRef(store, 'endDate')
const canStep1Next = computed(() => store.canStep1Next)

const selectedFestival = (id) => { store.festival = id }
const selectedBrand = (id) => { store.brand = id }
</script>

<template>
  <Md3Card variant="elevated" class="step-card">
    <!-- Header -->
    <div class="step-header">
      <h2 class="step-title">选择节日与品牌</h2>
      <p class="step-subtitle">选择节日主题和珠宝品牌，系统将自动匹配配色方案</p>
    </div>

    <!-- 节日主题 (required) -->
    <section class="section">
      <div class="section-head">
        <h3 class="section-label">节日主题</h3>
        <span class="md3-badge md3-badge--error">必选</span>
      </div>
      <div class="chip-scroll">
        <Md3Chip
          v-for="f in festivals"
          :key="f.id"
          :selected="festival === f.id"
          :dot-color="f.primaryColor"
          @click="selectedFestival(f.id)"
        >
          {{ f.name }}
        </Md3Chip>
      </div>
      <div v-if="festival" class="color-swatch-bar">
        <template v-for="f in festivals.filter(x => x.id === festival)" :key="f.id">
          <span class="swatch" :style="{ background: f.primaryColor }" title="主色"></span>
          <span class="swatch" :style="{ background: f.secondaryColor }" title="辅色"></span>
          <span class="swatch" :style="{ background: f.bgColor }" title="背景色"></span>
          <span class="color-scheme-name">{{ f.colorScheme }}</span>
        </template>
      </div>
    </section>

    <!-- 珠宝品牌 (required) -->
    <section class="section">
      <div class="section-head">
        <h3 class="section-label">珠宝品牌</h3>
        <span class="md3-badge md3-badge--error">必选</span>
      </div>
      <div class="brand-grid">
        <div
          v-for="b in brands"
          :key="b.id"
          :class="['brand-card', { 'brand-card--selected': brand === b.id }]"
          @click="selectedBrand(b.id)"
        >
          <div class="brand-avatar">{{ b.name.charAt(0) }}</div>
          <div class="brand-info">
            <span class="brand-name">{{ b.name }}</span>
            <span class="brand-desc">{{ b.description }}</span>
          </div>
          <span v-if="brand === b.id" class="brand-check">&#10003;</span>
        </div>
      </div>
    </section>

    <!-- 活动主题 (optional) -->
    <section class="section">
      <div class="section-head">
        <h3 class="section-label">活动主题</h3>
        <span class="md3-badge md3-badge--tonal">选填</span>
      </div>
      <div class="field-stack">
        <Md3TextField
          :model-value="store.theme"
          @update:model-value="store.theme = $event"
          placeholder="例如：七夕浪漫钜惠"
          variant="outlined"
        />
        <Md3TextField
          :model-value="store.subtitle"
          @update:model-value="store.subtitle = $event"
          placeholder="例如：全场珠宝低至5折"
          variant="outlined"
        />
      </div>
    </section>

    <!-- 活动时间 (optional) -->
    <section class="section">
      <div class="section-head">
        <h3 class="section-label">活动时间</h3>
        <span class="md3-badge md3-badge--tonal">选填</span>
      </div>
      <CalendarRangePicker
        :start-date="startDate"
        :end-date="endDate"
        @update:start-date="store.startDate = $event"
        @update:end-date="store.endDate = $event"
      />
    </section>

    <!-- Action bar -->
    <div class="md3-card__divider"></div>
    <div class="action-bar">
      <span v-if="!canStep1Next" class="validation-hint">
        <span class="hint-icon">!</span>
        请先选择<span v-if="!festival">节日</span><span v-if="!festival && !brand">和</span><span v-if="!brand">品牌</span>
      </span>
      <Md3Button
        variant="filled"
        :disabled="!canStep1Next"
        @click="store.setStep(2)"
      >
        下一步 &#8594;
      </Md3Button>
    </div>
  </Md3Card>
</template>

<style scoped>
.step-card {
  animation: md3-slide-up var(--md-duration-medium2) var(--md-easing-emphasized-decel);
}

.step-header {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--md-outline-variant);
}

.step-title {
  font-size: var(--md-headline-small);
  font-weight: 500;
  color: var(--md-on-surface);
  letter-spacing: 0;
  margin-bottom: 6px;
}

.step-subtitle {
  font-size: var(--md-body-medium);
  color: var(--md-on-surface-variant);
  line-height: 1.5;
}

/* Section layout */
.section {
  margin-bottom: 32px;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.section-label {
  font-size: var(--md-title-small);
  font-weight: 600;
  color: var(--md-on-surface);
  margin: 0;
}

/* Chip wrap grid */
.chip-scroll {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Color swatch bar */
.color-swatch-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 12px 16px;
  background: var(--md-surface-container);
  border-radius: var(--md-shape-small);
  animation: md3-fade-in var(--md-duration-short4) var(--md-easing-standard);
}

.swatch {
  width: 28px;
  height: 28px;
  border-radius: var(--md-shape-extra-small);
  border: 1px solid var(--md-outline-variant);
  transition: transform var(--md-duration-short4) var(--md-easing-standard);
}

.swatch:hover {
  transform: scale(1.15);
}

.color-scheme-name {
  font-size: var(--md-label-medium);
  color: var(--md-on-surface-variant);
  margin-left: 4px;
}

/* Brand grid */
.brand-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 900px) {
  .brand-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 560px) {
  .brand-grid {
    grid-template-columns: 1fr;
  }
}

.brand-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-medium);
  cursor: pointer;
  transition: all var(--md-duration-short4) var(--md-easing-standard);
  background: var(--md-surface);
}

.brand-card:hover {
  box-shadow: var(--md-elevation-1);
  border-color: var(--md-outline);
}

.brand-card--selected {
  border-color: var(--md-primary);
  border-width: 2px;
  padding: 15px;
  background: color-mix(in srgb, var(--md-primary-container) 25%, var(--md-surface));
}

.brand-avatar {
  width: 44px;
  height: 44px;
  border-radius: var(--md-shape-full);
  background: linear-gradient(135deg, var(--md-primary-container), var(--md-secondary-container));
  color: var(--md-on-primary-container);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--md-title-medium);
  font-weight: 700;
  flex-shrink: 0;
}

.brand-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.brand-name {
  font-size: var(--md-body-large);
  font-weight: 600;
  color: var(--md-on-surface);
}

.brand-desc {
  font-size: var(--md-body-small);
  color: var(--md-on-surface-variant);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brand-check {
  flex-shrink: 0;
  font-size: 20px;
  color: var(--md-primary);
  font-weight: 700;
}

/* Field stack */
.field-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Action bar */
.action-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
}

.validation-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--md-body-medium);
  color: var(--md-on-surface-variant);
}

.hint-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--md-shape-full);
  background: var(--md-error-container);
  color: var(--md-on-error-container);
  font-size: var(--md-label-small);
  font-weight: 700;
}
</style>
