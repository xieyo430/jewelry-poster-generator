<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { presetActivities } from '../../data/presetActivities'
import api from '../../api'
import DiscountTypeSelect from './DiscountTypeSelect.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  activity: { type: Object, default: null },
  discountTypes: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:show', 'save'])

// Form state
const activityType = ref('text')
const discountTypeId = ref('')
const content = ref('')
const discountDetail = ref('')
const highlight = ref('')
const imageUrls = ref([])
const fieldValues = ref({})

// AI state
const rawDescription = ref('')
const aiLoading = ref(false)
const aiError = ref(false)
const showAiInput = ref(true)

// Preset picker state
const showPicker = ref(false)
const activeCategory = ref('')
const searchQuery = ref('')

const currentDiscountType = computed(() => props.discountTypes.find(d => d.id === discountTypeId.value))

// Group presets by discount type
const groupedActivities = computed(() => {
  const groups = {}
  for (const act of presetActivities) {
    const key = act.discountType || '其他'
    if (!groups[key]) groups[key] = []
    groups[key].push(act)
  }
  return groups
})

const categoryList = computed(() => Object.keys(groupedActivities.value))

const filteredActivities = computed(() => {
  const acts = groupedActivities.value[activeCategory.value] || []
  if (!searchQuery.value) return acts
  const q = searchQuery.value.toLowerCase()
  return acts.filter(a => (a.discountDetail || a.content || '').toLowerCase().includes(q))
})

// Auto-fill from edit data
watch(() => props.show, (val) => {
  if (val && props.activity) {
    activityType.value = props.activity.type || 'text'
    discountTypeId.value = props.activity.discountTypeId || ''
    content.value = props.activity.content || ''
    discountDetail.value = props.activity.discountDetail || ''
    highlight.value = props.activity.highlight || ''
    imageUrls.value = [...(props.activity.imageUrls || [])]
    fieldValues.value = { ...(props.activity.fieldValues || {}) }
    showAiInput.value = false
  } else if (val) {
    resetForm()
  }
})

watch(activityType, () => { imageUrls.value = [] })
watch(discountTypeId, () => {
  if (!props.activity) {
    fieldValues.value = {}
    discountDetail.value = ''
  }
})

// Auto-format detail from field values
watch(fieldValues, (vals) => {
  const dt = currentDiscountType.value
  if (dt && dt.format) {
    let detail = dt.format
    for (const [k, v] of Object.entries(vals)) detail = detail.replace(`{${k}}`, v || '___')
    discountDetail.value = detail
  }
}, { deep: true })

const computeHighlight = (fv, detail) => {
  if (!fv) return ''
  if (fv.item) return fv.item
  if (fv.reduce) return '减'
  if (fv.gift) return detail?.includes('赠') ? '赠' : '送'
  if (fv.bonus) return '送'
  if (fv.expand) return '抵'
  if (detail) {
    const numbers = detail.match(/\d+/g)
    if (numbers?.length) return numbers[numbers.length - 1]
  }
  return ''
}

const selectPreset = async (act) => {
  const savedFV = act.fieldValues ? { ...act.fieldValues } : {}
  activityType.value = act.type || 'text'
  discountTypeId.value = act.discountTypeId || ''
  content.value = act.content || ''
  discountDetail.value = act.discountDetail || ''
  imageUrls.value = [...(act.imageUrls || [])]
  await nextTick()
  if (Object.keys(savedFV).length) fieldValues.value = { ...savedFV }
  highlight.value = computeHighlight(savedFV, act.discountDetail)
  showAiInput.value = false
  showPicker.value = false
}

const handleAiAnalyze = async () => {
  if (!rawDescription.value.trim()) return
  aiLoading.value = true
  aiError.value = false
  try {
    const res = await api.post('/ai/analyze-activity', { rawDescription: rawDescription.value })
    const data = res.data
    if (data.success) {
      // 兼容两种返回格式：完整格式和简化格式
      const savedFV = data.fieldValues || {}
      const savedDetail = data.discountDetail || ''

      // 尝试匹配优惠类型
      if (data.suggestedDiscountType && data.suggestedDiscountType !== 'custom' && data.suggestedDiscountType !== '类型ID') {
        const dt = props.discountTypes.find(d => d.id === data.suggestedDiscountType)
        if (dt) discountTypeId.value = data.suggestedDiscountType
      }

      // 如果没有fieldValues但有直接字段，尝试自动匹配
      if (!Object.keys(savedFV).length) {
        // 检查返回数据中是否有已知的字段key
        const knownKeys = ['spend', 'reduce', 'rate', 'item', 'price', 'buyCondition', 'gift', 'oldItem', 'newItem', 'extra', 'benefit', 'condition', 'points', 'recharge', 'bonus', 'time', 'people', 'items', 'amount', 'way', 'prizes', 'deposit', 'expand', 'period', 'tier1', 'tier2', 'tier3', 'customContent']
        for (const key of knownKeys) {
          if (data[key] !== undefined) {
            savedFV[key] = data[key]
          }
        }
        // 如果有rate和item，自动设置为折扣类型
        if (savedFV.rate && savedFV.item && !discountTypeId.value) {
          discountTypeId.value = 'discount-rate'
        }
      }

      await nextTick()
      if (Object.keys(savedFV).length) fieldValues.value = { ...savedFV }
      if (savedDetail) { discountDetail.value = savedDetail; content.value = savedDetail }
      else if (data.activityContent && data.activityContent !== '10-20字摘要') content.value = data.activityContent
      highlight.value = computeHighlight(savedFV, savedDetail)
      showAiInput.value = false
    } else {
      aiError.value = true
    }
  } catch {
    aiError.value = true
  } finally {
    aiLoading.value = false
  }
}

const handleUpload = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    const res = await api.uploadImage(file)
    if (res.data.success) imageUrls.value.push(res.data.url)
  } catch { /* ignore */ }
  e.target.value = ''
}

const removeImage = (idx) => imageUrls.value.splice(idx, 1)

const resetForm = () => {
  activityType.value = 'text'
  discountTypeId.value = ''
  content.value = ''
  discountDetail.value = ''
  highlight.value = ''
  imageUrls.value = []
  fieldValues.value = {}
  rawDescription.value = ''
  showAiInput.value = true
  showPicker.value = false
  searchQuery.value = ''
  activeCategory.value = ''
}

const handleSave = () => {
  if (!discountTypeId.value) return
  const activity = {
    id: props.activity?.id || Date.now(),
    type: activityType.value,
    discountType: props.discountTypes.find(d => d.id === discountTypeId.value)?.name || discountTypeId.value,
    discountTypeId: discountTypeId.value,
    content: content.value.trim() || discountDetail.value,
    discountDetail: discountDetail.value,
    highlight: (highlight.value && discountDetail.value && discountDetail.value.includes(highlight.value)) ? highlight.value : '',
    imageUrls: [...imageUrls.value],
    fieldValues: { ...fieldValues.value },
  }
  emit('save', activity)
  close()
}

const close = () => {
  resetForm()
  emit('update:show', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="md3-dialog-overlay" @click.self="close">
        <div class="md3-dialog activity-dialog">
          <h2 class="md3-dialog__title">
            {{ activity ? '编辑活动' : '添加活动' }}
          </h2>

          <div class="md3-dialog__content">
            <!-- AI Smart Fill -->
            <div v-if="showAiInput" class="ai-section">
              <label class="field-label">粘贴活动描述，AI 自动填写</label>
              <div class="ai-box">
                <textarea
                  v-model="rawDescription"
                  class="md3-field__textarea"
                  placeholder="复制粘贴活动文案到这里，AI 会自动分析并填充"
                  rows="3"
                ></textarea>
                <div v-if="aiError" class="md3-alert md3-alert--error" style="margin-top: 8px">
                  AI 分析失败，请检查文案后重试
                </div>
                <button
                  class="md3-btn md3-btn--outlined"
                  style="width: 100%; margin-top: 8px"
                  :disabled="!rawDescription.trim() || aiLoading"
                  @click="handleAiAnalyze"
                >
                  <span v-if="aiLoading" class="md3-spinner md3-spinner--small"><span class="md3-spinner__circle"></span></span>
                  <span v-else>AI 智能填充</span>
                </button>
              </div>
              <div class="md3-divider" style="margin: 16px 0">
                <span class="divider-text">或者手动填写</span>
              </div>
            </div>

            <!-- Preset picker button -->
            <div class="preset-section">
              <button class="md3-btn md3-btn--tonal" style="width: 100%" @click="showPicker = true">
                从预设活动中选择
              </button>
            </div>

            <!-- Activity type -->
            <div class="field-group">
              <label class="field-label">活动类型</label>
              <div class="md3-segmented-group">
                <button
                  :class="['md3-segmented-btn', { 'md3-segmented-btn--selected': activityType === 'text' }]"
                  @click="activityType = 'text'"
                >纯文字</button>
                <button
                  :class="['md3-segmented-btn', { 'md3-segmented-btn--selected': activityType === 'single_image' }]"
                  @click="activityType = 'single_image'"
                >单图+文字</button>
                <button
                  :class="['md3-segmented-btn', { 'md3-segmented-btn--selected': activityType === 'multi_image' }]"
                  @click="activityType = 'multi_image'"
                >多图+文字</button>
              </div>
            </div>

            <!-- Discount type -->
            <div class="field-group">
              <label class="field-label">优惠类型 <span class="req-star">*</span></label>
              <DiscountTypeSelect
                :model-value="discountTypeId"
                :discount-types="discountTypes"
                placeholder="请选择优惠类型"
                @update:model-value="discountTypeId = $event"
              />
            </div>

            <!-- Dynamic fields -->
            <div v-if="currentDiscountType?.fields?.length" class="field-group">
              <label class="field-label">{{ currentDiscountType.inputPrompts }}</label>
              <div v-for="field in currentDiscountType.fields" :key="field.key" class="sub-field">
                <span class="sub-label">{{ field.label }}</span>
                <input
                  class="md3-field__input md3-field--outlined"
                  :value="fieldValues[field.key] || ''"
                  @input="fieldValues[field.key] = $event.target.value"
                  :placeholder="field.placeholder"
                />
              </div>
            </div>

            <!-- Content -->
            <div class="field-group">
              <label class="field-label">活动内容</label>
              <textarea
                v-model="content"
                class="md3-field__textarea"
                placeholder="活动内容描述"
                rows="2"
              ></textarea>
            </div>

            <!-- Detail preview -->
            <div v-if="discountDetail" class="field-group">
              <label class="field-label">优惠详情预览</label>
              <div class="preview-box">{{ discountDetail }}</div>
            </div>

            <!-- Highlight -->
            <div v-if="discountDetail" class="field-group">
              <label class="field-label">突出信息 <span class="opt-tag">必须是优惠详情中的内容</span></label>
              <input
                v-model="highlight"
                class="md3-field__input md3-field--outlined"
                :placeholder="'如：' + (discountDetail.slice(0, 6) || '满减')"
              />
            </div>

            <!-- Image upload -->
            <div v-if="activityType !== 'text'" class="field-group">
              <label class="field-label">图片</label>
              <div class="img-list">
                <div v-for="(url, idx) in imageUrls" :key="idx" class="img-thumb">
                  <img :src="url" alt="" />
                  <button class="img-remove" @click="removeImage(idx)">&#10005;</button>
                </div>
              </div>
              <label
                v-if="activityType === 'multi_image' || (activityType === 'single_image' && !imageUrls.length)"
                class="upload-area"
              >
                + 选择图片
                <input type="file" accept="image/*" @change="handleUpload" hidden />
              </label>
            </div>
          </div>

          <div class="md3-dialog__actions">
            <button class="md3-btn md3-btn--text" @click="close">取消</button>
            <button class="md3-btn md3-btn--filled" :disabled="!discountTypeId" @click="handleSave">
              {{ activity ? '保存修改' : '保存活动' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Preset picker sub-dialog -->
    <Transition name="modal-fade">
      <div v-if="showPicker" class="md3-dialog-overlay" @click.self="showPicker = false">
        <div class="md3-dialog picker-dialog">
          <h2 class="md3-dialog__title">选择预设活动</h2>
          <div class="md3-dialog__content picker-content">
            <div class="picker-sidebar">
              <div class="picker-search">
                <input v-model="searchQuery" class="picker-search-input" placeholder="搜索..." />
              </div>
              <div
                v-for="cat in categoryList"
                :key="cat"
                :class="['picker-nav', { 'picker-nav--active': activeCategory === cat }]"
                @click="activeCategory = cat; searchQuery = ''"
              >
                {{ cat }}
                <span class="picker-nav-count">{{ (groupedActivities[cat] || []).length }}</span>
              </div>
            </div>
            <div class="picker-body">
              <div v-if="!activeCategory" class="picker-placeholder">请从左侧选择分类</div>
              <button
                v-for="(act, idx) in filteredActivities"
                :key="idx"
                class="picker-card"
                @click="selectPreset(act)"
              >
                <span class="picker-card-text">{{ act.discountDetail || act.content }}</span>
              </button>
              <div v-if="activeCategory && !filteredActivities.length" class="picker-placeholder">
                未找到匹配的活动
              </div>
            </div>
          </div>
          <div class="md3-dialog__actions">
            <button class="md3-btn md3-btn--text" @click="showPicker = false">关闭</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.activity-dialog {
  max-width: 560px;
  width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.activity-dialog :deep(.md3-dialog__content) {
  flex: 1;
  overflow-y: auto;
}

.picker-dialog {
  max-width: 560px;
  width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.field-group {
  margin-bottom: 16px;
}

.field-label {
  display: block;
  font-size: var(--md-label-large);
  font-weight: 500;
  color: var(--md-on-surface);
  margin-bottom: 6px;
}

.req-star {
  color: var(--md-error);
}

.opt-tag {
  font-size: 11px;
  color: var(--md-on-surface-variant);
  font-weight: 400;
}

.ai-section {
  margin-bottom: 8px;
}

.ai-box {
  padding: 12px;
  background: var(--md-surface-container-low);
  border-radius: var(--md-shape-small);
}

.ai-box .md3-field__textarea {
  width: 100%;
  box-sizing: border-box;
}

.preset-section {
  margin-bottom: 16px;
}

.sub-field {
  margin-bottom: 10px;
}

.sub-label {
  display: block;
  font-size: var(--md-label-small);
  color: var(--md-on-surface-variant);
  margin-bottom: 4px;
  font-weight: 500;
}

.sub-field .md3-field__input {
  width: 100%;
  box-sizing: border-box;
}

.preview-box {
  padding: 10px 12px;
  background: var(--md-surface-container-low);
  border-radius: var(--md-shape-small);
  color: var(--md-on-surface);
  font-size: var(--md-body-medium);
  font-weight: 500;
}

textarea {
  font-family: var(--md-font-family);
}

textarea.md3-field__textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-small);
  background: var(--md-surface);
  color: var(--md-on-surface);
  font-size: var(--md-body-medium);
  resize: vertical;
  outline: none;
}

textarea.md3-field__textarea:focus {
  border-color: var(--md-primary);
}

.img-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.img-thumb {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: var(--md-shape-small);
  overflow: hidden;
  border: 1px solid var(--md-outline-variant);
}

.img-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px dashed var(--md-outline-variant);
  border-radius: var(--md-shape-small);
  color: var(--md-on-surface-variant);
  cursor: pointer;
  font-size: var(--md-label-large);
  font-weight: 500;
  transition: all var(--md-duration-short4) var(--md-easing-standard);
}

.upload-area:hover {
  border-color: var(--md-primary);
  color: var(--md-primary);
}

.md3-divider {
  position: relative;
  border: none;
  height: 1px;
  background: var(--md-outline-variant);
  margin: 16px 0;
}

.divider-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--md-surface);
  padding: 0 12px;
  font-size: var(--md-label-small);
  color: var(--md-on-surface-variant);
  white-space: nowrap;
}

/* Picker sub-dialog */
.picker-content {
  display: flex;
  min-height: 0;
  padding: 0;
  overflow: visible;
  flex: 1;
}

.picker-sidebar {
  width: 160px;
  flex-shrink: 0;
  border-right: 1px solid var(--md-outline-variant);
  overflow: visible;
  padding: 8px 0;
}

.picker-search {
  padding: 0 8px 8px;
}

.picker-search-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-extra-small);
  background: var(--md-surface);
  color: var(--md-on-surface);
  font-size: var(--md-body-small);
  font-family: var(--md-font-family);
  outline: none;
  box-sizing: border-box;
}

.picker-search-input:focus {
  border-color: var(--md-primary);
}

.picker-nav {
  padding: 8px 14px;
  font-size: 13px;
  color: var(--md-on-surface-variant);
  cursor: pointer;
  transition: all var(--md-duration-short4) var(--md-easing-standard);
  border-left: 2px solid transparent;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.picker-nav:hover {
  color: var(--md-on-surface);
  background: var(--md-surface-container-low);
}

.picker-nav--active {
  color: var(--md-on-surface);
  font-weight: 600;
  background: var(--md-surface-container-low);
  border-left-color: var(--md-primary);
}

.picker-nav-count {
  font-size: 11px;
  color: var(--md-outline);
  background: var(--md-surface-container);
  padding: 1px 6px;
  border-radius: 10px;
}

.picker-body {
  flex: 1;
  padding: 12px;
  overflow: visible;
  columns: 2;
  column-gap: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  align-content: start;
}

.picker-card {
  display: block;
  text-align: left;
  padding: 10px 12px;
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-small);
  background: var(--md-surface);
  cursor: pointer;
  transition: all var(--md-duration-short4) var(--md-easing-standard);
  font-family: var(--md-font-family);
}

.picker-card:hover {
  background: var(--md-surface-container-low);
  border-color: var(--md-primary);
}

.picker-card-text {
  font-size: var(--md-body-small);
  color: var(--md-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.picker-placeholder {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px 16px;
  font-size: var(--md-body-small);
  color: var(--md-on-surface-variant);
}

/* Transitions */
.modal-fade-enter-active {
  transition: all var(--md-duration-medium2) var(--md-easing-standard);
}
.modal-fade-leave-active {
  transition: all var(--md-duration-short4) var(--md-easing-standard);
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .md3-dialog {
  transform: translateY(16px) scale(0.95);
}
</style>
