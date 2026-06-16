<script setup>
import { ref, computed } from 'vue'
import { usePosterStore } from '../../store/poster'
import { storeToRefs } from 'pinia'
import api from '../../api'
import DiscountTypeSelect from '../common/DiscountTypeSelect.vue'

const store = usePosterStore()
const { mainPromotion, secondaryPromotion, canStep2Next, discountTypes, mainCached, secCached } = storeToRefs(store)

// 主标题/副标题双向绑定
const mainMainTitle = computed({
  get: () => mainPromotion.value.mainTitle,
  set: v => { mainPromotion.value.mainTitle = v; store.syncMainContent() }
})
const mainSubTitle = computed({
  get: () => mainPromotion.value.subTitle,
  set: v => { mainPromotion.value.subTitle = v; store.syncMainContent() }
})
const secMainTitle = computed({
  get: () => secondaryPromotion.value.mainTitle,
  set: v => { secondaryPromotion.value.mainTitle = v; store.syncSecContent() }
})
const secSubTitle = computed({
  get: () => secondaryPromotion.value.subTitle,
  set: v => { secondaryPromotion.value.subTitle = v; store.syncSecContent() }
})

// AI 智能填充
const mainAiText = ref('')
const mainAiLoading = ref(false)
const secAiText = ref('')
const secAiLoading = ref(false)

// 用 store 缓存字段
const mainType = computed({ get: () => store.mainCached.type, set: v => { store.mainCached.type = v; store.mainPromotion.type = v } })
const mainDiscountTypeId = computed({ get: () => store.mainCached.discountTypeId, set: v => { store.mainCached.discountTypeId = v; updateMainDetail() } })
const mainFieldValues = computed({ get: () => store.mainCached.fieldValues, set: v => { store.mainCached.fieldValues = v } })
const mainImageUrls = computed({ get: () => store.mainCached.imageUrls, set: v => { store.mainCached.imageUrls = v } })

const secType = computed({ get: () => store.secCached.type, set: v => { store.secCached.type = v; store.secondaryPromotion.type = v } })
const secDiscountTypeId = computed({ get: () => store.secCached.discountTypeId, set: v => { store.secCached.discountTypeId = v; updateSecDetail() } })
const secFieldValues = computed({ get: () => store.secCached.fieldValues, set: v => { store.secCached.fieldValues = v } })
const secImageUrls = computed({ get: () => store.secCached.imageUrls, set: v => { store.secCached.imageUrls = v } })
const hasSecondary = computed({ get: () => store.secCached.hasSecondary, set: v => { store.secCached.hasSecondary = v } })

const updateMainDetail = () => {
  const dt = store.discountTypes.find(d => d.id === store.mainCached.discountTypeId)
  if (dt && dt.format) {
    let detail = dt.format
    for (const [k, v] of Object.entries(store.mainCached.fieldValues)) {
      detail = detail.replace(`{${k}}`, v || '___')
    }
    store.updateMainCache({ discountDetail: detail })
  }
}

const updateSecDetail = () => {
  const dt = store.discountTypes.find(d => d.id === store.secCached.discountTypeId)
  if (dt && dt.format) {
    let detail = dt.format
    for (const [k, v] of Object.entries(store.secCached.fieldValues)) {
      detail = detail.replace(`{${k}}`, v || '___')
    }
    store.updateSecCache({ discountDetail: detail })
  }
}

// AI分析（主爆点）
const handleMainAi = async () => {
  if (!mainAiText.value.trim()) return
  mainAiLoading.value = true
  try {
    const res = await api.post('/ai/analyze-activity', { rawDescription: mainAiText.value })
    const data = res.data
    if (data.success) {
      if (data.suggestedDiscountType && data.suggestedDiscountType !== 'custom') {
        store.mainCached.discountTypeId = data.suggestedDiscountType
      }
      if (data.fieldValues) {
        store.mainCached.fieldValues = { ...data.fieldValues }
      }
      if (data.discountDetail) {
        store.updateMainCache({ discountDetail: data.discountDetail })
      }
    }
  } catch (err) {
    console.error('AI分析失败:', err)
  } finally {
    mainAiLoading.value = false
  }
}

// AI分析（次爆点）
const handleSecAi = async () => {
  if (!secAiText.value.trim()) return
  secAiLoading.value = true
  try {
    const res = await api.post('/ai/analyze-activity', { rawDescription: secAiText.value })
    const data = res.data
    if (data.success) {
      if (data.suggestedDiscountType && data.suggestedDiscountType !== 'custom') {
        store.secCached.discountTypeId = data.suggestedDiscountType
      }
      if (data.fieldValues) {
        store.secCached.fieldValues = { ...data.fieldValues }
      }
      if (data.discountDetail) {
        store.updateSecCache({ discountDetail: data.discountDetail })
      }
    }
  } catch (err) {
    console.error('AI分析失败:', err)
  } finally {
    secAiLoading.value = false
  }
}

const handleUpload = async (e, target) => {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    const res = await api.uploadImage(file)
    if (res.data.success) {
      const urls = target === 'main' ? store.mainCached.imageUrls : store.secCached.imageUrls
      urls.push(res.data.url)
    }
  } catch (err) {
    console.error('上传失败:', err)
  }
  e.target.value = ''
}

const currentMainFields = computed(() => {
  return store.discountTypes.find(d => d.id === store.mainCached.discountTypeId)?.fields || []
})

const currentSecFields = computed(() => {
  return store.discountTypes.find(d => d.id === store.secCached.discountTypeId)?.fields || []
})

</script>

<template>
  <div class="step-card">
    <h2 class="step-title">正面爆点活动</h2>
    <p class="step-desc">设置主爆点活动（必填）和次爆点活动（选填），将显示在海报正面下方</p>

    <!-- ===== 主爆点 ===== -->
    <section class="section highlight-section">
      <h3 class="section-title">
        <span class="highlight-badge">主爆点</span>
        主爆点活动 <span class="required">*</span>
      </h3>

      <!-- AI 智能填充 -->
      <div class="field-group">
        <label>📝 AI 智能填充（粘贴活动文案）</label>
        <div class="ai-input-area">
          <textarea
            v-model="mainAiText"
            class="text-input ai-textarea"
            placeholder="粘贴活动文案，AI自动分析并填充&#10;例如：黄金928元/克，满10克享受一克"
            rows="3"
          ></textarea>
          <button class="btn-ai" @click="handleMainAi" :disabled="mainAiLoading || !mainAiText.trim()">
            <span v-if="mainAiLoading" class="btn-loading">
              <span class="spinner-small"></span> AI分析中...
            </span>
            <span v-else>🤖 AI 智能填充</span>
          </button>
        </div>
      </div>

      <div class="field-group">
        <label>活动类型</label>
        <div class="type-selector">
          <button :class="['type-btn', { active: mainType === 'text' }]" @click="mainType = 'text'">纯文字</button>
          <button :class="['type-btn', { active: mainType === 'single_image' }]" @click="mainType = 'single_image'">单图+文字</button>
          <button :class="['type-btn', { active: mainType === 'multi_image' }]" @click="mainType = 'multi_image'">多图+文字</button>
        </div>
      </div>

      <div class="field-group">
        <label>优惠类型</label>
        <DiscountTypeSelect v-model="mainDiscountTypeId" :discount-types="discountTypes" placeholder="请选择优惠类型" />
      </div>

      <div class="field-group" v-if="mainDiscountTypeId">
        <div v-for="field in currentMainFields" :key="field.key" class="sub-field">
          <span class="sub-label">{{ field.label }}</span>
          <input v-model="mainFieldValues[field.key]" :type="field.type" :placeholder="field.placeholder" class="text-input" @input="updateMainDetail" />
        </div>
      </div>

      <div class="field-group">
        <label>主标题 <span class="required">*</span></label>
        <input v-model="mainMainTitle" type="text" class="text-input" placeholder="输入主标题，如：全场黄金8.5折" />
      </div>

      <div class="field-group">
        <label>副标题 <span class="optional">（选填）</span></label>
        <input v-model="mainSubTitle" type="text" class="text-input" placeholder="输入副标题，如：满10克享1克" />
      </div>

      <div class="field-group" v-if="mainPromotion.discountDetail">
        <label>内容预览</label>
        <div class="detail-preview">{{ mainPromotion.discountDetail }}</div>
      </div>

      <div class="field-group" v-if="mainType !== 'text'">
        <label>图片</label>
        <div class="image-list">
          <div v-for="(url, idx) in mainImageUrls" :key="idx" class="image-item">
            <img :src="url" alt="" />
            <button class="remove-img" @click="mainImageUrls.splice(idx, 1)">✕</button>
          </div>
        </div>
        <label class="upload-btn" v-if="mainType === 'multi_image' || (mainType === 'single_image' && !mainImageUrls.length)">
          选择图片 <input type="file" accept="image/*" @change="e => handleUpload(e, 'main')" hidden />
        </label>
      </div>
    </section>

    <!-- ===== 次爆点 ===== -->
    <section class="section">
      <div class="section-header">
        <h3 class="section-title">次爆点活动 <span class="optional">（选填）</span></h3>
        <button v-if="!hasSecondary" class="btn btn-sm btn-secondary" @click="hasSecondary = true">+ 添加</button>
        <button v-else class="btn btn-sm btn-secondary" @click="hasSecondary = false; store.secCached.fieldValues = {}; store.secondaryPromotion.content = ''; store.secondaryPromotion.discountDetail = ''; store.secondaryPromotion.mainTitle = ''; store.secondaryPromotion.subTitle = ''">移除</button>
      </div>

      <template v-if="hasSecondary">
        <!-- AI 智能填充 -->
        <div class="field-group">
          <label>📝 AI 智能填充（粘贴活动文案）</label>
          <div class="ai-input-area">
            <textarea
              v-model="secAiText"
              class="text-input ai-textarea"
              placeholder="粘贴活动文案，AI自动分析并填充"
              rows="3"
            ></textarea>
            <button class="btn-ai" @click="handleSecAi" :disabled="secAiLoading || !secAiText.trim()">
              <span v-if="secAiLoading" class="btn-loading">
                <span class="spinner-small"></span> AI分析中...
              </span>
              <span v-else>🤖 AI 智能填充</span>
            </button>
          </div>
        </div>

        <div class="field-group">
          <label>活动类型</label>
          <div class="type-selector">
            <button :class="['type-btn', { active: secType === 'text' }]" @click="secType = 'text'">纯文字</button>
            <button :class="['type-btn', { active: secType === 'single_image' }]" @click="secType = 'single_image'">单图+文字</button>
            <button :class="['type-btn', { active: secType === 'multi_image' }]" @click="secType = 'multi_image'">多图+文字</button>
          </div>
        </div>

        <div class="field-group">
          <label>优惠类型</label>
          <DiscountTypeSelect v-model="secDiscountTypeId" :discount-types="discountTypes" placeholder="请选择优惠类型" />
        </div>

        <div v-if="secDiscountTypeId" class="field-group">
          <div v-for="field in currentSecFields" :key="field.key" class="sub-field">
            <span class="sub-label">{{ field.label }}</span>
            <input v-model="secFieldValues[field.key]" :type="field.type" :placeholder="field.placeholder" class="text-input" @input="updateSecDetail" />
          </div>
        </div>

        <div class="field-group" v-if="secondaryPromotion.discountDetail">
          <label>内容预览</label>
          <div class="detail-preview">{{ secondaryPromotion.discountDetail }}</div>
        </div>

        <div class="field-group">
          <label>主标题 <span class="required">*</span></label>
          <input v-model="secMainTitle" type="text" class="text-input" placeholder="输入主标题" />
        </div>

        <div class="field-group">
          <label>副标题 <span class="optional">（选填）</span></label>
          <input v-model="secSubTitle" type="text" class="text-input" placeholder="输入副标题" />
        </div>

        <div class="field-group" v-if="secType !== 'text'">
          <label>图片</label>
          <div class="image-list">
            <div v-for="(url, idx) in secImageUrls" :key="idx" class="image-item">
              <img :src="url" alt="" />
              <button class="remove-img" @click="secImageUrls.splice(idx, 1)">✕</button>
            </div>
          </div>
          <label class="upload-btn" v-if="secType === 'multi_image' || (secType === 'single_image' && !secImageUrls.length)">
            选择图片 <input type="file" accept="image/*" @change="e => handleUpload(e, 'sec')" hidden />
          </label>
        </div>
      </template>
    </section>

    <!-- 操作按钮 -->
    <div class="step-actions">
      <button class="btn btn-secondary" @click="store.setStep(1)">← 上一步</button>
      <button class="btn btn-primary btn-next" :disabled="!canStep2Next" @click="store.setStep(3)">
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
.section-title { font-size: 14px; font-weight: 600; color: #e0e0e0; margin-bottom: 10px; }
.required { color: #FF6B6B; }
.optional { color: #888; font-weight: 400; font-size: 12px; }

.highlight-section {
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 12px;
  padding: 20px;
  background: rgba(255, 215, 0, 0.02);
}

.highlight-badge {
  display: inline-block;
  padding: 2px 8px;
  background: linear-gradient(135deg, #FFD700, #FF6B35);
  color: #000;
  font-size: 10px;
  font-weight: 700;
  border-radius: 4px;
  margin-right: 6px;
  vertical-align: middle;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.section-header .section-title { margin-bottom: 0; }

.field-group { margin-bottom: 16px; }
.field-group label { display: block; font-size: 13px; color: #aaa; margin-bottom: 6px; }

/* AI输入 */
.ai-input-area {
  background: rgba(255, 215, 0, 0.03);
  border: 1px solid rgba(255, 215, 0, 0.15);
  border-radius: 10px;
  padding: 12px;
}

.ai-textarea { resize: vertical; min-height: 80px; }

.btn-ai {
  width: 100%;
  margin-top: 8px;
  padding: 10px;
  border: 1px solid #FFD700;
  border-radius: 8px;
  background: rgba(255, 215, 0, 0.08);
  color: #FFD700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-ai:hover { background: rgba(255, 215, 0, 0.15); }
.btn-ai:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-loading { display: flex; align-items: center; justify-content: center; gap: 8px; }

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-top-color: #FFD700;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.type-selector { display: flex; gap: 8px; }

.type-btn {
  flex: 1;
  padding: 10px;
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  background: transparent;
  color: #aaa;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.type-btn.active { border-color: #FFD700; color: #FFD700; background: rgba(255, 215, 0, 0.08); }

.select-input, .text-input {
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

.select-input:focus, .text-input:focus { border-color: #FFD700; }
.select-input option { background: #0d0d1a; color: #f0f0f0; }
.text-input::placeholder { color: #555; }

.sub-field { margin-bottom: 10px; }
.sub-label { display: block; font-size: 12px; color: #999; margin-bottom: 4px; }

.detail-preview {
  padding: 10px 14px;
  background: #0a0a15;
  border: 1px dashed #2a2a4a;
  border-radius: 8px;
  color: #FFD700;
  font-size: 14px;
}

.image-list { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.image-item {
  position: relative;
  width: 60px; height: 60px;
  border-radius: 6px; overflow: hidden;
  border: 1px solid #2a2a4a;
}
.image-item img { width: 100%; height: 100%; object-fit: cover; }
.remove-img {
  position: absolute; top: 2px; right: 2px;
  width: 18px; height: 18px;
  border-radius: 50%; border: none;
  background: rgba(0,0,0,0.7); color: #fff;
  font-size: 9px; cursor: pointer;
}
.upload-btn {
  display: inline-flex; padding: 8px 16px;
  border: 1px dashed #2a2a4a; border-radius: 8px;
  color: #aaa; cursor: pointer; font-size: 13px;
}
.upload-btn:hover { border-color: #FFD700; color: #FFD700; }

.step-actions {
  display: flex;
  justify-content: space-between;
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

.btn-sm { padding: 6px 14px; font-size: 12px; }

.btn-primary {
  background: linear-gradient(135deg, #FFD700, #FF6B35);
  color: #000;
}
.btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }
.btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(255, 215, 0, 0.25); }

.btn-secondary {
  background: transparent;
  border: 1px solid #2a2a4a;
  color: #aaa;
}
.btn-secondary:hover { border-color: #888; color: #e0e0e0; }
</style>
