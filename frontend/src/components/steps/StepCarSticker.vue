<script setup>
import { usePosterStore } from '../../store/poster'
import { storeToRefs } from 'pinia'
import CalendarRangePicker from '../common/CalendarRangePicker.vue'

import { computed } from 'vue'

const store = usePosterStore()
const { festivals, brands, festival, brand, startDate, endDate, carStickerSize, carStickerText, merchantInfo, generating, generateError } = storeToRefs(store)

const minPixels = 3686400
const totalPixels = computed(() => (carStickerSize.value.width || 0) * (carStickerSize.value.height || 0))
const sizeValid = computed(() => totalPixels.value >= minPixels)
</script>

<template>
  <div class="step-card">
    <h2 class="step-title">🚗 车贴设计</h2>
    <p class="step-desc">填写车贴信息，AI将生成车身贴纸效果</p>

    <!-- 自定义尺寸 -->
    <section class="section">
      <h3 class="section-title">车贴尺寸 <span class="required">*</span></h3>
      <div class="size-row">
        <div class="field-group">
          <label>宽度 (px)</label>
          <input v-model.number="carStickerSize.width" type="number" class="text-input" min="400" max="4096" />
        </div>
        <span class="size-x">×</span>
        <div class="field-group">
          <label>高度 (px)</label>
          <input v-model.number="carStickerSize.height" type="number" class="text-input" min="400" max="4096" />
        </div>
      </div>
      <p class="field-hint" :class="{ 'text-danger': !sizeValid }">
        总像素: {{ totalPixels.toLocaleString() }} px²
        <span v-if="!sizeValid">（需要至少 {{ minPixels.toLocaleString() }} px²，当前 {{ totalPixels.toLocaleString() }}）</span>
        <span v-else>✅</span>
      </p>
    </section>

    <!-- 节日选择（配色方案） -->
    <section class="section">
      <h3 class="section-title">配色方案 <span class="required">*</span></h3>
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
      <h3 class="section-title">品牌 <span class="required">*</span></h3>
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

    <!-- 车贴文案 -->
    <section class="section">
      <h3 class="section-title">车贴文案</h3>
      <div class="field-group">
        <input v-model="carStickerText" class="text-input" placeholder="如：年中大促 全场5折起" />
        <p class="field-hint">车贴上的主宣传语</p>
      </div>
    </section>

    <!-- 商家信息 -->
    <section class="section">
      <h3 class="section-title">商家信息 <span class="required">*</span></h3>
      <div class="merchant-form">
        <div class="field-group">
          <label>商家名称</label>
          <input v-model="store.merchantInfo.name" class="text-input" placeholder="如：周大福珠宝旗舰店" />
        </div>
        <div class="form-row">
          <div class="field-group">
            <label>电话</label>
            <input v-model="store.merchantInfo.phone" class="text-input" placeholder="联系电话" />
          </div>
          <div class="field-group">
            <label>微信</label>
            <input v-model="store.merchantInfo.wechat" class="text-input" placeholder="微信号（选填）" />
          </div>
        </div>
      </div>
    </section>

    <!-- 生成按钮 -->
    <div class="step-actions">
      <button
        class="btn btn-generate"
        :disabled="!brand || !sizeValid || generating"
        @click="store.generateCarSticker()"
      >
        <span v-if="generating" class="btn-loading">
          <span class="spinner-small"></span>
          生成中...
        </span>
        <span v-else>🚗 生成车贴</span>
      </button>
    </div>

    <!-- 错误提示 -->
    <div v-if="generateError" class="error-msg">
      生成失败：{{ generateError }}
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

/* 尺寸 */
.size-row { display: flex; align-items: flex-end; gap: 8px; }
.size-row .field-group { flex: 1; }
.size-x { font-size: 20px; color: #888; padding-bottom: 10px; }

/* 节日 */
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
.festival-color { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.color-preview { margin-top: 10px; display: flex; align-items: center; gap: 8px; }
.color-label { font-size: 12px; color: #888; }
.color-swatch-group { display: flex; align-items: center; gap: 4px; }
.color-swatch { width: 20px; height: 20px; border-radius: 4px; border: 1px solid #444; }
.color-name { font-size: 12px; color: #bbb; margin-left: 4px; }

/* 品牌 */
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
.brand-btn.active .brand-name { color: #FFD700; }
.brand-icon {
  width: 40px; height: 40px; border-radius: 50%;
  background: linear-gradient(135deg, #FFD700, #FF6B35);
  display: flex; align-items: center; justify-content: center;
  color: #000; font-weight: 700; font-size: 16px; flex-shrink: 0;
}
.brand-info { display: flex; flex-direction: column; }
.brand-name { font-size: 14px; font-weight: 600; }
.brand-desc { font-size: 11px; color: #888; margin-top: 2px; }

/* 字段 */
.field-group { margin-bottom: 16px; }
.field-group label { display: block; font-size: 13px; color: #aaa; margin-bottom: 6px; }
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
.text-danger { color: #FF6B6B; }
input[type="number"] { -moz-appearance: textfield; }
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

/* 商家表单 */
.form-row { display: flex; gap: 12px; }
.form-row .field-group { flex: 1; }
.merchant-form {
  background: #0d0d1a;
  border: 1px solid #1e1e3a;
  border-radius: 10px;
  padding: 16px;
}

/* 按钮 */
.step-actions {
  display: flex;
  justify-content: center;
  padding-top: 20px;
  border-top: 1px solid #2a2a4a;
}

.btn {
  padding: 14px 36px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-generate {
  background: linear-gradient(135deg, #FFD700, #FF6B35, #FF1493);
  color: #000;
}
.btn-generate:disabled { opacity: 0.35; cursor: not-allowed; }
.btn-generate:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(255, 215, 0, 0.3); }

.btn-loading { display: flex; align-items: center; gap: 8px; }

.spinner-small {
  width: 14px; height: 14px;
  border: 2px solid rgba(0,0,0,0.2);
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.error-msg {
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 8px;
  color: #FF6B6B;
  font-size: 13px;
}
</style>
