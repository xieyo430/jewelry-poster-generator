<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { presetActivities } from '../../data/presetActivities'
import { getIndustryActivityPresets } from '../../data/industryTemplates'
import api from '../../api'
import EdDialog from './EdDialog.vue'
import EdButton from './EdButton.vue'
import EdField from './EdField.vue'
import EdIcon from './EdIcon.vue'
import DiscountTypeSelect from './DiscountTypeSelect.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  activity: { type: Object, default: null },
  discountTypes: { type: Array, default: () => [] },
  industry: { type: String, default: 'jewelry' },
})
const emit = defineEmits(['update:show', 'save'])

const activityType = ref('text')
const discountTypeId = ref('')
const content = ref('')
const discountDetail = ref('')
const highlight = ref('')
const imageUrls = ref([])
const fieldValues = ref({})

const rawDescription = ref('')
const aiLoading = ref(false)
const aiError = ref(false)
const showAiInput = ref(true)

const showPicker = ref(false)
const activeCategory = ref('')
const searchQuery = ref('')

const currentDiscountType = computed(() => props.discountTypes.find(d => d.id === discountTypeId.value))
const industryPresets = computed(() => props.industry === 'jewelry'
  ? presetActivities
  : getIndustryActivityPresets(props.industry))

const groupedActivities = computed(() => {
  const groups = {}
  for (const act of industryPresets.value) {
    const key = props.discountTypes.find(type => type.id === act.discountTypeId)?.name || act.discountType || '其他'
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
    const res = await api.post('/ai/analyze-activity', {
      rawDescription: rawDescription.value,
      industry: props.industry,
    })
    const data = res.data
    if (data.success) {
      const savedFV = data.fieldValues || {}
      const savedDetail = data.discountDetail || ''

      if (data.suggestedDiscountType && data.suggestedDiscountType !== 'custom' && data.suggestedDiscountType !== '类型ID') {
        const dt = props.discountTypes.find(d => d.id === data.suggestedDiscountType)
        if (dt) discountTypeId.value = data.suggestedDiscountType
      }

      if (!Object.keys(savedFV).length) {
        const knownKeys = ['spend', 'reduce', 'rate', 'item', 'price', 'buyCondition', 'gift', 'oldItem', 'newItem', 'extra', 'benefit', 'condition', 'points', 'recharge', 'bonus', 'time', 'people', 'items', 'amount', 'way', 'prizes', 'deposit', 'expand', 'period', 'tier1', 'tier2', 'tier3', 'customContent']
        for (const key of knownKeys) {
          if (data[key] !== undefined) {
            savedFV[key] = data[key]
          }
        }
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
  <EdDialog
    v-if="show"
    :title="activity ? '编辑活动' : '添加活动'"
    :width="680"
    @close="close"
  >
    <div class="fields">
      <template v-if="showAiInput">
        <EdField
          v-model="rawDescription"
          type="textarea"
          :rows="3"
          :placeholder="props.industry === 'food' ? '粘贴套餐、折扣或到店赠礼文案，AI 会自动分析并填充' : props.industry === 'electronics' ? '粘贴产品直降、赠品或以旧换新文案，AI 会自动分析并填充' : '复制粘贴活动文案到这里，AI 会自动分析并填充'"
        />
        <div v-if="aiError" class="note">
          <EdIcon name="warning" :size="13" class="note__icon" />
          <span>AI 分析失败，请检查文案后重试</span>
        </div>
        <EdButton variant="solid" block :loading="aiLoading" :disabled="!rawDescription.trim()" @click="handleAiAnalyze">
          <EdIcon name="sparkle" :size="15" />
          AI 智能填充
        </EdButton>
        <div class="or-rule">
          <hr class="ed-rule" />
          <span class="or-rule__text ed-meta">或者手动填写</span>
        </div>
      </template>

      <EdButton variant="outline" block @click="showPicker = true">
        选择{{ props.industry === 'food' ? '餐饮' : props.industry === 'electronics' ? '数码家电' : '行业' }}预设活动
      </EdButton>

      <div>
        <h4 class="fld-label ed-label">活动类型</h4>
        <nav class="tabline">
          <button
            v-for="t in [{v:'text',l:'纯文字'},{v:'single_image',l:'单图+文字'},{v:'multi_image',l:'多图+文字'}]"
            :key="t.v"
            type="button"
            :class="['tabline__item', { 'is-active': activityType === t.v }]"
            @click="activityType = t.v"
          >{{ t.l }}</button>
        </nav>
      </div>

      <div>
        <h4 class="fld-label ed-label">优惠类型 <span class="req">*</span></h4>
        <DiscountTypeSelect
          :model-value="discountTypeId"
          :discount-types="discountTypes"
          placeholder="请选择优惠类型"
          @update:model-value="discountTypeId = $event"
        />
      </div>

      <div v-if="currentDiscountType?.fields?.length">
        <h4 class="fld-label ed-label">{{ currentDiscountType.inputPrompts }}</h4>
        <div class="fields">
          <EdField
            v-for="field in currentDiscountType.fields"
            :key="field.key"
            :model-value="fieldValues[field.key] || ''"
            @update:model-value="fieldValues[field.key] = $event"
            :placeholder="field.placeholder"
          />
        </div>
      </div>

      <div>
        <h4 class="fld-label ed-label">活动内容</h4>
        <EdField v-model="content" type="textarea" :rows="2" placeholder="活动内容描述" />
      </div>

      <div v-if="discountDetail">
        <h4 class="fld-label ed-label">优惠详情预览</h4>
        <div class="preview-box">{{ discountDetail }}</div>
      </div>

      <div v-if="discountDetail">
        <h4 class="fld-label ed-label">突出信息 <span class="opt ed-meta">必须是优惠详情中的内容</span></h4>
        <EdField v-model="highlight" :placeholder="'如：' + (discountDetail.slice(0, 6) || '满减')" />
      </div>

      <div v-if="activityType !== 'text'">
        <h4 class="fld-label ed-label">图片</h4>
        <div class="thumbs">
          <div v-for="(url, idx) in imageUrls" :key="idx" class="thumb">
            <img :src="url" alt="" />
            <button type="button" class="thumb__remove" @click="removeImage(idx)">
              <EdIcon name="close" :size="11" />
            </button>
          </div>
        </div>
        <label
          v-if="activityType === 'multi_image' || (activityType === 'single_image' && !imageUrls.length)"
          class="upload-lab"
        >
          <EdIcon name="upload" :size="14" />
          选择图片
          <input type="file" accept="image/*" @change="handleUpload" hidden />
        </label>
      </div>
    </div>

    <template #footer>
      <EdButton variant="text" @click="close">取消</EdButton>
      <EdButton variant="solid" :disabled="!discountTypeId" @click="handleSave">
        {{ activity ? '保存修改' : '保存活动' }}
      </EdButton>
    </template>
  </EdDialog>

  <EdDialog v-if="showPicker" title="选择预设活动" :width="760" @close="showPicker = false">
    <div class="picker">
      <div class="picker__side">
        <EdField v-model="searchQuery" placeholder="搜索..." />
        <button
          v-for="cat in categoryList"
          :key="cat"
          type="button"
          :class="['picker__cat', { 'is-active': activeCategory === cat }]"
          @click="activeCategory = cat; searchQuery = ''"
        >
          <span>{{ cat }}</span>
          <span class="picker__count ed-meta">{{ (groupedActivities[cat] || []).length }}</span>
        </button>
      </div>
      <div class="picker__main">
        <p v-if="!activeCategory" class="picker__hint ed-meta">请从左侧选择分类</p>
        <div v-else-if="!filteredActivities.length" class="picker__hint ed-meta">未找到匹配的活动</div>
        <button
          v-for="(act, idx) in filteredActivities"
          :key="idx"
          type="button"
          class="preset-row"
          @click="selectPreset(act)"
        >
          {{ act.discountDetail || act.content }}
        </button>
      </div>
    </div>
  </EdDialog>
</template>

<style scoped>
.fld-label { margin-bottom: var(--ed-space-2); }
.req { color: var(--ed-danger); }
.opt { text-transform: none; letter-spacing: .02em; }

.or-rule { position: relative; margin: var(--ed-space-2) 0; }
.or-rule__text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--ed-paper);
  padding: 0 var(--ed-space-3);
  text-transform: none;
}

.preview-box {
  padding: var(--ed-space-3) var(--ed-space-4);
  background: var(--ed-paper-deep);
  color: var(--ed-ink);
  font-size: 14px;
}

.thumbs { display: flex; flex-wrap: wrap; gap: var(--ed-space-2); margin-bottom: var(--ed-space-3); }
.thumb {
  position: relative;
  width: 56px;
  height: 56px;
  border: 1px solid var(--ed-rule);
}
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.thumb__remove {
  position: absolute;
  top: 2px;
  right: 2px;
  display: flex;
  border: 0;
  padding: 1px;
  background: rgba(22, 21, 15, .55);
  color: var(--ed-paper);
  cursor: pointer;
}

.upload-lab {
  display: inline-flex;
  align-items: center;
  gap: var(--ed-space-2);
  padding: var(--ed-space-2) var(--ed-space-4);
  border: 1px solid var(--ed-rule);
  color: var(--ed-ink-soft);
  font-size: 13px;
  cursor: pointer;
}
.upload-lab:hover { border-color: var(--ed-ink); color: var(--ed-ink); }

.picker {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: var(--ed-space-5);
  min-height: 360px;
}
.picker__side {
  display: flex;
  flex-direction: column;
  gap: var(--ed-space-1);
  border-right: 1px solid var(--ed-rule);
  padding-right: var(--ed-space-4);
}
.picker__cat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--ed-space-2);
  padding: var(--ed-space-2) var(--ed-space-3);
  border: 0;
  border-left: 2px solid transparent;
  background: transparent;
  color: var(--ed-ink-faint);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
}
.picker__cat:hover { color: var(--ed-ink); }
.picker__cat.is-active { color: var(--ed-ink); border-left-color: var(--ed-accent); }
.picker__count { text-transform: none; }

.picker__main {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 var(--ed-space-5);
  align-content: start;
}
.preset-row {
  padding: var(--ed-space-3) 0;
  border: 0;
  border-bottom: 1px solid var(--ed-rule);
  background: transparent;
  color: var(--ed-ink);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.preset-row:hover { border-bottom-color: var(--ed-ink); }
.picker__hint {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--ed-space-6) 0;
  text-transform: none;
}
</style>
