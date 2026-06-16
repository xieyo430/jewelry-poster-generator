<script setup>
import { usePosterStore } from '../../store/poster'
import { storeToRefs } from 'pinia'
import CalendarRangePicker from '../common/CalendarRangePicker.vue'

const store = usePosterStore()
const { festivals, brands, festival, brand, startDate, endDate, canStep1Next } = storeToRefs(store)
</script>

<template>
  <div class="step-card">
    <h2 class="step-title">选择节日与品牌</h2>
    <p class="step-desc">选择节日主题和珠宝品牌，系统将自动匹配配色方案</p>

    <!-- 节日选择 -->
    <section class="section">
      <h3 class="section-title">选择节日 <span class="required">*</span></h3>
      <div class="festival-grid">
        <button
          v-for="f in festivals"
          :key="f.id"
          :class="['festival-btn', { active: festival === f.id }]"
          :style="festival === f.id ? {
            borderColor: f.primaryColor,
            background: `${f.primaryColor}15`,
          } : {}"
          @click="store.festival = f.id"
        >
          <span class="festival-color" :style="{ background: f.primaryColor }"></span>
          <span>{{ f.name }}</span>
        </button>
      </div>
      <div v-if="festival" class="color-preview">
        <span class="color-label">配色：</span>
        <span
          v-for="(f, i) in festivals.filter(f => f.id === festival)"
          :key="i"
          class="color-swatch-group"
        >
          <span class="color-swatch" :style="{ background: f.primaryColor }"></span>
          <span class="color-swatch" :style="{ background: f.secondaryColor }"></span>
          <span class="color-swatch" :style="{ background: f.bgColor }"></span>
          <span class="color-name">{{ f.colorScheme }}</span>
        </span>
      </div>
    </section>

    <!-- 品牌选择 -->
    <section class="section">
      <h3 class="section-title">选择品牌 <span class="required">*</span></h3>
      <div class="brand-grid">
        <button
          v-for="b in brands"
          :key="b.id"
          :class="['brand-btn', { active: brand === b.id }]"
          @click="store.brand = b.id"
        >
          <div class="brand-icon">{{ b.name.charAt(0) }}</div>
          <div class="brand-info">
            <span class="brand-name">{{ b.name }}</span>
            <span class="brand-desc">{{ b.description }}</span>
          </div>
        </button>
      </div>
    </section>

    <!-- 活动主题 -->
    <section class="section">
      <h3 class="section-title">活动主题 <span class="optional">（选填）</span></h3>
      <div class="field-group">
        <input v-model="store.theme" class="text-input" placeholder="例如：七夕浪漫钜惠" />
        <p class="field-hint">显示在海报正面上方的主标题</p>
      </div>
      <div class="field-group">
        <input v-model="store.subtitle" class="text-input" placeholder="例如：全场珠宝低至5折，满额赠好礼（选填）" />
        <p class="field-hint">显示在主标题下方的副标题</p>
      </div>
    </section>

    <!-- 活动时间 -->
    <section class="section">
      <h3 class="section-title">活动时间 <span class="optional">（选填）</span></h3>
      <CalendarRangePicker
        :start-date="startDate"
        :end-date="endDate"
        @update:start-date="store.startDate = $event"
        @update:end-date="store.endDate = $event"
      />
    </section>

    <!-- 操作按钮 -->
    <div class="step-actions">
      <button
        class="btn btn-primary btn-next"
        :disabled="!canStep1Next"
        @click="store.setStep(2)"
      >
        下一步 →
      </button>
    </div>
  </div>
</template>

<style scoped>
.step-card {
  background: #13132b;
  border: 1px solid #2a2a4a;
  border-radius: 16px;
  padding: 28px;
}

.step-title { font-size: 20px; color: #FFD700; margin-bottom: 4px; }
.step-desc { font-size: 13px; color: #999; margin-bottom: 24px; }

.section { margin-bottom: 28px; }
.section-title { font-size: 14px; font-weight: 600; color: #e0e0e0; margin-bottom: 12px; }
.required { color: #FF6B6B; }
.optional { color: #888; font-weight: 400; font-size: 12px; }

.festival-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.festival-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  background: transparent;
  color: #ccc;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.festival-btn:hover { border-color: #777; color: #fff; }
.festival-btn.active { color: #fff; font-weight: 600; }

.festival-color {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.color-preview { margin-top: 10px; display: flex; align-items: center; gap: 8px; }
.color-label { font-size: 12px; color: #888; }
.color-swatch-group { display: flex; align-items: center; gap: 4px; }
.color-swatch { width: 20px; height: 20px; border-radius: 4px; border: 1px solid #444; }
.color-name { font-size: 12px; color: #bbb; margin-left: 4px; }

.brand-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.brand-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #2a2a4a;
  border-radius: 10px;
  background: transparent;
  color: #ccc;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.brand-btn:hover { border-color: #777; background: rgba(255,255,255,0.03); }
.brand-btn.active { border-color: #FFD700; background: rgba(255, 215, 0, 0.06); }

.brand-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFD700, #FF6B35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}

.brand-info { display: flex; flex-direction: column; }
.brand-name { font-size: 14px; font-weight: 600; }
.brand-desc { font-size: 11px; color: #888; margin-top: 2px; }

.brand-btn.active .brand-name { color: #FFD700; }

.step-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid #2a2a4a;
}

.btn {
  padding: 12px 28px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #FFD700, #FF6B35);
  color: #000;
}
.btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }
.btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(255, 215, 0, 0.25); }

.field-group { margin-bottom: 16px; }
.text-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  background: #0d0d1a;
  color: #f0f0f0;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.text-input:focus { border-color: #FFD700; }
.text-input::placeholder { color: #555; }
.field-hint { font-size: 11px; color: #666; margin-top: 4px; }

@media (max-width: 768px) {
  .step-card { padding: 20px; }
  .brand-grid { grid-template-columns: 1fr 1fr; }
}
</style>
