<script setup>
import { ref, computed, watch } from 'vue'
import api from '../../api'
import DiscountTypeSelect from './DiscountTypeSelect.vue'

const props = defineProps({
  discountTypes: { type: Array, default: () => [] },
  visible: Boolean,
  editData: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save'])

// 表单状态
const activityType = ref('text')
const discountTypeId = ref('')
const content = ref('')
const discountDetail = ref('')
const highlight = ref('')
const imageUrls = ref([])
const bgColor = ref('#1e1e3a')
const showCustomBg = ref(false)
const fieldValues = ref({})

// AI 智能填充
const rawDescription = ref('')
const aiLoading = ref(false)
const showAiInput = ref(true)

const currentDiscountType = computed(() => {
  return props.discountTypes.find(d => d.id === discountTypeId.value)
})

watch(activityType, () => {
  imageUrls.value = []
})

watch(discountTypeId, () => {
  fieldValues.value = {}
  discountDetail.value = ''
})

// 编辑模式：预填表单
watch(() => props.editData, (val) => {
  if (val) {
    activityType.value = val.type || 'text'
    discountTypeId.value = val.discountTypeId || ''
    content.value = val.content || ''
    discountDetail.value = val.discountDetail || ''
    highlight.value = val.highlight || ''
    imageUrls.value = [...(val.imageUrls || [])]
    bgColor.value = val.bgColor || '#1e1e3a'
    fieldValues.value = { ...(val.fieldValues || {}) }
    showAiInput.value = false
  }
}, { immediate: true })

watch(fieldValues, (vals) => {
  const dt = currentDiscountType.value
  if (dt && dt.format) {
    let detail = dt.format
    for (const [k, v] of Object.entries(vals)) {
      detail = detail.replace(`{${k}}`, v || '___')
    }
    discountDetail.value = detail
  }
}, { deep: true })

// AI 分析填充
const handleAiAnalyze = async () => {
  if (!rawDescription.value.trim()) return
  aiLoading.value = true
  try {
    const res = await api.post('/ai/analyze-activity', { rawDescription: rawDescription.value })
    const data = res.data
    if (data.success) {
      // 匹配折扣类型
      if (data.suggestedDiscountType && data.suggestedDiscountType !== 'custom') {
        const dt = props.discountTypes.find(d => d.id === data.suggestedDiscountType)
        if (dt) {
          discountTypeId.value = data.suggestedDiscountType
        }
      }
      // 填充字段值
      if (data.fieldValues) {
        fieldValues.value = { ...data.fieldValues }
      }
      // 填充描述
      if (data.discountDetail) {
        discountDetail.value = data.discountDetail
        content.value = data.discountDetail
      } else if (data.activityContent) {
        content.value = data.activityContent
      }
      showAiInput.value = false
    }
  } catch (err) {
    console.error('AI分析失败:', err)
  } finally {
    aiLoading.value = false
  }
}

const resetForm = () => {
  activityType.value = 'text'
  discountTypeId.value = ''
  content.value = ''
  discountDetail.value = ''
  highlight.value = ''
  imageUrls.value = []
  bgColor.value = '#1e1e3a'
  fieldValues.value = {}
  rawDescription.value = ''
  showAiInput.value = true
}

const handleSave = () => {
  if (!discountTypeId.value) return

  const activity = {
    id: props.editData?.id || Date.now(),
    type: activityType.value,
    discountType: props.discountTypes.find(d => d.id === discountTypeId.value)?.name || discountTypeId.value,
    discountTypeId: discountTypeId.value,
    content: content.value.trim() || discountDetail.value,
    discountDetail: discountDetail.value,
    highlight: (highlight.value && discountDetail.value && discountDetail.value.includes(highlight.value)) ? highlight.value : '',
    imageUrls: [...imageUrls.value],
    bgColor: bgColor.value,
    fieldValues: { ...fieldValues.value },
  }

  emit('save', activity)
  resetForm()
}

const handleUpload = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    const res = await api.uploadImage(file)
    if (res.data.success) {
      imageUrls.value.push(res.data.url)
    }
  } catch (err) {
    console.error('上传失败:', err)
  }
  e.target.value = ''
}

const removeImage = (idx) => {
  imageUrls.value.splice(idx, 1)
}

const bgColors = ['#1e1e3a', '#2d1b69', '#1a3a4a', '#3a1a2a', '#1a3a2a', '#3a2a1a', '#2a1a3a', '#1a2a3a']

const close = () => {
  resetForm()
  emit('close', props.editData?.id || null)
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" v-if="visible" @click.self="close">
      <div class="modal-content">
        <div class="modal-header">
          <h2>添加活动</h2>
          <button class="close-btn" @click="close">✕</button>
        </div>

        <div class="modal-body">
          <!-- AI 智能填充 -->
          <div class="field-group" v-if="showAiInput">
            <label>📝 粘贴活动描述，AI 自动填写</label>
            <div class="ai-input-area">
              <textarea
                v-model="rawDescription"
                class="text-input textarea"
                placeholder="复制粘贴活动文案到这里，AI会自动分析并填充以下信息&#10;&#10;例如：活动期间全场珠宝满1000减200，买任意项链送银饰手链一条，会员享双倍积分"
                rows="4"
              ></textarea>
              <button
                class="btn btn-ai"
                @click="handleAiAnalyze"
                :disabled="aiLoading || !rawDescription.trim()"
              >
                <span v-if="aiLoading" class="btn-loading">
                  <span class="spinner-small"></span> AI分析中...
                </span>
                <span v-else>🤖 AI 智能填充</span>
              </button>
            </div>
            <div class="ai-divider">
              <span>或者手动填写</span>
            </div>
          </div>

          <!-- 活动类型 -->
          <div class="field-group">
            <label>活动类型</label>
            <div class="type-selector">
              <button :class="['type-btn', { active: activityType === 'text' }]" @click="activityType = 'text'">纯文字</button>
              <button :class="['type-btn', { active: activityType === 'single_image' }]" @click="activityType = 'single_image'">单图+文字</button>
              <button :class="['type-btn', { active: activityType === 'multi_image' }]" @click="activityType = 'multi_image'">多图+文字</button>
            </div>
          </div>

          <!-- 优惠类型 -->
          <div class="field-group">
            <label>优惠类型 <span class="required">*</span></label>
            <DiscountTypeSelect v-model="discountTypeId" :discount-types="discountTypes" placeholder="请选择优惠类型" />
          </div>

          <!-- 活动内容 -->
          <div class="field-group">
            <label>活动内容</label>
            <textarea
              v-model="content"
              class="text-input textarea"
              placeholder="活动内容（AI填充后会自动填入）"
              rows="2"
            ></textarea>
          </div>

          <!-- 优惠字段 -->
          <div class="field-group" v-if="currentDiscountType">
            <label>{{ currentDiscountType.inputPrompts }}</label>
            <div v-for="field in currentDiscountType.fields" :key="field.key" class="sub-field">
              <span class="sub-label">{{ field.label }}</span>
              <input
                v-model="fieldValues[field.key]"
                :type="field.type"
                :placeholder="field.placeholder"
                class="text-input"
              />
            </div>
          </div>

          <!-- 预览 -->
          <div class="field-group" v-if="discountDetail">
            <label>优惠详情预览</label>
            <div class="detail-preview">{{ discountDetail }}</div>
          </div>

          <!-- 突出信息 -->
          <div class="field-group" v-if="discountDetail">
            <label>突出信息 <span class="optional">（输入要突出的文字，必须是上面优惠详情中的内容）</span></label>
            <input
              v-model="highlight"
              class="text-input"
              :placeholder="'如：' + (discountDetail.slice(0, 6) || '满减')"
            />
          </div>

          <!-- 图片上传 -->
          <div class="field-group" v-if="activityType !== 'text'">
            <label>图片</label>
            <div class="image-list">
              <div v-for="(url, idx) in imageUrls" :key="idx" class="image-item">
                <img :src="url" alt="活动图片" />
                <button class="remove-img" @click="removeImage(idx)">✕</button>
              </div>
            </div>
            <label class="upload-btn" v-if="activityType === 'multi_image' || (activityType === 'single_image' && !imageUrls.length)">
              选择图片
              <input type="file" accept="image/*" @change="handleUpload" hidden />
            </label>
          </div>

          <!-- 背景颜色 -->
          <div class="field-group">
            <label>模块背景色</label>
            <div class="color-picker">
              <button
                v-for="c in bgColors"
                :key="c"
                :class="['color-option', { active: bgColor === c }]"
                :style="{ background: c }"
                @click="bgColor = c"
              ></button>
              <button :class="['color-option', 'custom', { active: showCustomBg }]" @click="showCustomBg = !showCustomBg">🎨</button>
            </div>
            <input v-if="showCustomBg" v-model="bgColor" class="text-input" placeholder="#RRGGBB" style="margin-top:8px" />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="close">取消</button>
          <button class="btn btn-primary" @click="handleSave" :disabled="!discountTypeId">
            保存活动
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: #0d0d1a;
  border: 1px solid #2a2a4a;
  border-radius: 16px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 0;
}

.modal-header h2 { font-size: 18px; color: #FFD700; }

.close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 18px;
  cursor: pointer;
}
.close-btn:hover { color: #fff; }

.modal-body { padding: 20px 24px; }

.field-group { margin-bottom: 18px; }
.field-group label { display: block; font-size: 13px; color: #aaa; margin-bottom: 8px; }
.required { color: #FF6B6B; }
.optional { color: #777; font-weight: normal; font-size: 12px; }

/* AI输入区 */
.ai-input-area {
  background: rgba(255, 215, 0, 0.03);
  border: 1px solid rgba(255, 215, 0, 0.15);
  border-radius: 10px;
  padding: 12px;
}

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

.ai-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0 8px;
  color: #555;
  font-size: 12px;
}

.ai-divider::before,
.ai-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #2a2a4a;
}

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
  color: #f5f5f5;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.select-input:focus, .text-input:focus { border-color: #FFD700; }
.select-input option { background: #0d0d1a; color: #f5f5f5; }
.text-input::placeholder { color: #555; }

.textarea { resize: vertical; min-height: 80px; }

.sub-field { margin-bottom: 10px; }
.sub-field:last-child { margin-bottom: 0; }
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
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #2a2a4a;
}

.image-item img { width: 100%; height: 100%; object-fit: cover; }

.remove-img {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,0.7);
  color: #fff;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-btn {
  display: inline-flex;
  padding: 8px 16px;
  border: 1px dashed #2a2a4a;
  border-radius: 8px;
  color: #aaa;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.upload-btn:hover { border-color: #FFD700; color: #FFD700; }

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.color-option {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.color-option.active { border-color: #FFD700; transform: scale(1.15); }
.color-option.custom { background: #1e1e3a; font-size: 12px; display: flex; align-items: center; justify-content: center; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 20px;
  border-top: 1px solid #2a2a4a;
}

.btn {
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #FFD700, #FF6B35);
  color: #000;
  font-weight: 600;
}
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-secondary {
  background: transparent;
  border: 1px solid #2a2a4a;
  color: #aaa;
}
.btn-secondary:hover { border-color: #888; color: #e0e0e0; }
</style>
