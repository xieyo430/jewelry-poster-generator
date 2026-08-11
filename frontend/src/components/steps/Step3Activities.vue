<script setup>
import { ref, computed, toRef } from 'vue'
import { usePosterStore } from '../../store/poster'
import { useToast } from '../../composables/useToast'
import Md3Card from '../common/Md3Card.vue'
import Md3Button from '../common/Md3Button.vue'
import Md3TextField from '../common/Md3TextField.vue'
import ActivityModal from '../common/ActivityModal.vue'
import GenerateProgressDialog from '../common/GenerateProgressDialog.vue'

const toast = useToast()
const store = usePosterStore()
const activities = toRef(store, 'activities')
const merchantInfo = toRef(store, 'merchantInfo')
const discountTypes = toRef(store, 'discountTypes')
const merchantTemplates = toRef(store, 'merchantTemplates')
const canStep3Next = computed(() => store.canStep3Next)
const generating = toRef(store, 'generating')
const generateError = toRef(store, 'generateError')
const selectedMerchantTemplateId = toRef(store, 'selectedMerchantTemplateId')

/* ---------- Activity management ---------- */
const showModal = ref(false)
const editingActivity = ref(null)

function openAddModal() {
  editingActivity.value = null
  showModal.value = true
}

function openEditModal(act) {
  editingActivity.value = { ...act }
  showModal.value = true
}

function handleSaveActivity(activity) {
  if (editingActivity.value) {
    store.updateActivity(activity.id, activity)
  } else {
    store.addActivity(activity)
  }
  showModal.value = false
  editingActivity.value = null
}

function handleCloseModal() {
  showModal.value = false
  editingActivity.value = null
}

function confirmRemoveActivity(act) {
  if (confirm(`确定删除活动"${act.discountType || ''}"吗？`)) {
    store.removeActivity(act.id)
    toast.success('活动已删除')
  }
}

function activityTypeLabel(type) {
  if (type === 'text') return '纯文字'
  if (type === 'single_image') return '单图'
  if (type === 'multi_image') return '多图'
  return type
}

/* ---------- Merchant management ---------- */
const showMerchantForm = ref(false)
const merchantForm = ref({ name: '', address: '', phone: '' })
const merchantSaving = ref(false)

function selectMerchantTemplate(templateId) {
  store.selectedMerchantTemplateId = templateId
  if (templateId === 'custom') {
    store.merchantInfo = { name: '', address: '', phone: '' }
    return
  }
  const tpl = store.merchantTemplates.find(t => t.id === templateId)
  if (tpl) {
    store.merchantInfo = { name: tpl.name, address: tpl.address || '', phone: tpl.phone || '' }
  }
}

const isCustomMerchant = computed(() => {
  const id = store.selectedMerchantTemplateId
  if (!id || id === 'custom') return true
  const tpl = store.merchantTemplates.find(t => t.id === id)
  return tpl && !tpl.isDefault
})

function openMerchantForm() {
  merchantForm.value = { name: '', address: '', phone: '' }
  showMerchantForm.value = true
}

function closeMerchantForm() {
  showMerchantForm.value = false
  merchantForm.value = { name: '', address: '', phone: '' }
}

async function saveMerchant() {
  if (!merchantForm.value.name.trim()) return
  merchantSaving.value = true
  try {
    const newMerchant = await store.addCustomMerchant(merchantForm.value)
    selectMerchantTemplate(newMerchant.id)
    closeMerchantForm()
    toast.success('商家地址已保存')
  } catch (e) {
    toast.error('保存失败：' + (e.message || '网络错误'))
  } finally {
    merchantSaving.value = false
  }
}

function confirmDeleteMerchant(id, e) {
  e.stopPropagation()
  if (confirm('确定删除此商家地址吗？')) {
    doDeleteMerchant(id)
  }
}

async function doDeleteMerchant(id) {
  try {
    await store.deleteCustomMerchant(id)
    toast.success('商家地址已删除')
  } catch (e) {
    toast.error('删除失败：' + (e.message || '网络错误'))
  }
}
</script>

<template>
  <div>
  <Md3Card variant="elevated" class="step-card">
    <!-- Header -->
    <div class="step-header">
      <h2 class="step-title">反面活动配置</h2>
      <p class="step-subtitle">添加详细活动介绍（最多6个）和商家信息</p>
    </div>

    <!-- ====== Activity List ====== -->
    <section class="section">
      <div class="section-head">
        <h3 class="section-label">活动列表 <span class="required-dot">*</span></h3>
        <div style="flex: 1"></div>
        <span class="md3-badge md3-badge--tonal">{{ activities.length }} / 6</span>
        <Md3Button
          variant="tonal"
          size="small"
          :disabled="activities.length >= 6"
          @click="openAddModal"
        >
          &#43; 添加活动
        </Md3Button>
      </div>

      <!-- Empty state -->
      <div v-if="activities.length === 0" class="md3-empty">
        <span class="md3-empty__icon">&#128196;</span>
        <span class="md3-empty__title">暂无活动</span>
        <span class="md3-empty__desc">点击上方按钮添加活动详情</span>
      </div>

      <!-- Activity cards -->
      <div v-else class="activity-list">
        <div
          v-for="(act, idx) in activities"
          :key="act.id"
          class="activity-card"
        >
          <div class="activity-header">
            <span class="md3-badge md3-badge--filled">{{ act.discountType || '未分类' }}</span>
            <span class="activity-index">活动 {{ idx + 1 }}</span>
            <div style="flex: 1"></div>
            <Md3Button variant="text" size="small" @click="openEditModal(act)">
              &#9998; 编辑
            </Md3Button>
            <Md3Button variant="text" size="small" @click="confirmRemoveActivity(act)">
              &#128465; 删除
            </Md3Button>
          </div>
          <div class="activity-body">
            <div class="activity-row">
              <span class="activity-label">类型</span>
              <span class="activity-value">{{ activityTypeLabel(act.type) }}</span>
            </div>
            <div class="activity-row">
              <span class="activity-label">内容</span>
              <span class="activity-value">{{ act.content }}</span>
            </div>
            <div v-if="act.discountDetail" class="activity-row">
              <span class="activity-label">优惠详情</span>
              <span class="activity-value activity-highlight">{{ act.discountDetail }}</span>
            </div>
            <div v-if="act.imageUrls?.length" class="activity-images">
              <img v-for="(url, i) in act.imageUrls" :key="i" :src="url" class="activity-img" alt="" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ====== Merchant Info ====== -->
    <section class="section">
      <div class="section-head">
        <h3 class="section-label">商家信息 <span class="required-dot">*</span></h3>
      </div>

      <div class="merchant-grid">
        <!-- Template cards -->
        <div
          v-for="tpl in merchantTemplates"
          :key="tpl.id"
          :class="['merchant-card', { 'merchant-card--selected': selectedMerchantTemplateId === tpl.id }]"
          @click="selectMerchantTemplate(tpl.id)"
        >
          <div class="merchant-card-body">
            <div class="merchant-card-info">
              <span class="merchant-name">{{ tpl.name }}</span>
              <span v-if="tpl.address" class="merchant-detail">{{ tpl.address }}<template v-if="tpl.phone"> | {{ tpl.phone }}</template></span>
            </div>
            <button
              v-if="!tpl.isDefault"
              class="merchant-delete-btn"
              @click="confirmDeleteMerchant(tpl.id, $event)"
              title="删除"
            >
              &#128465;
            </button>
          </div>
        </div>

        <!-- Custom option -->
        <div
          :class="['merchant-card', { 'merchant-card--selected': selectedMerchantTemplateId === 'custom' }]"
          @click="selectMerchantTemplate('custom')"
        >
          <div class="merchant-card-body">
            <div class="merchant-card-info">
              <span class="merchant-name">自定义</span>
              <span class="merchant-detail">手动填写商家信息</span>
            </div>
          </div>
        </div>

        <!-- Add new button -->
        <div
          v-if="!showMerchantForm"
          class="merchant-card merchant-card--add"
          @click="openMerchantForm"
        >
          <span class="merchant-add-icon">&#43;</span>
          <span class="merchant-add-text">新增商家地址</span>
        </div>
      </div>

      <!-- Inline merchant form -->
      <div v-if="showMerchantForm" class="merchant-form-card">
        <h4 class="merchant-form-title">新增商家地址</h4>
        <div class="merchant-form-fields">
          <Md3TextField
            v-model="merchantForm.name"
            placeholder="商家名称，如：周大福珠宝旗舰店"
            variant="outlined"
          />
          <Md3TextField
            v-model="merchantForm.address"
            placeholder="店铺地址，如：周大福(五一广场店)"
            variant="outlined"
          />
          <Md3TextField
            v-model="merchantForm.phone"
            placeholder="联系电话"
            variant="outlined"
          />
        </div>
        <div class="merchant-form-actions">
          <Md3Button variant="outlined" size="small" @click="closeMerchantForm">
            取消
          </Md3Button>
          <Md3Button
            variant="filled"
            size="small"
            :disabled="!merchantForm.name.trim()"
            :loading="merchantSaving"
            @click="saveMerchant"
          >
            保存
          </Md3Button>
        </div>
      </div>

      <!-- Custom merchant edit (when "custom" selected) -->
      <div v-if="isCustomMerchant && selectedMerchantTemplateId === 'custom' && !showMerchantForm" class="merchant-form-card">
        <h4 class="merchant-form-title">自定义商家信息</h4>
        <div class="merchant-form-fields">
          <Md3TextField
            :model-value="merchantInfo.name"
            @update:model-value="merchantInfo.name = $event"
            placeholder="商家名称，如：周大福珠宝旗舰店"
            variant="outlined"
          />
          <Md3TextField
            :model-value="merchantInfo.address"
            @update:model-value="merchantInfo.address = $event"
            placeholder="店铺地址，如：周大福(五一广场店)"
            variant="outlined"
          />
          <Md3TextField
            :model-value="merchantInfo.phone"
            @update:model-value="merchantInfo.phone = $event"
            placeholder="联系电话"
            variant="outlined"
          />
        </div>
      </div>
    </section>

    <!-- Action bar -->
    <div class="md3-card__divider"></div>
    <div class="action-bar">
      <Md3Button variant="outlined" @click="store.setStep(2)">
        &#8592; 上一步
      </Md3Button>
      <div class="action-right">
        <span v-if="!canStep3Next" class="validation-hint">
          <span class="hint-icon">!</span>
          <span v-if="!activities.length && !merchantInfo.name.trim()">请添加活动并填写商家信息</span>
          <span v-else-if="!activities.length">请添加至少一个活动</span>
          <span v-else>请填写商家名称</span>
        </span>
        <Md3Button
          variant="filled"
          :disabled="!canStep3Next || generating"
          :loading="generating"
          @click="store.generatePosters()"
        >
          <template v-if="!generating">&#10024; 生成海报</template>
          <template v-else>生成中...</template>
        </Md3Button>
      </div>
    </div>

    <!-- Error alert -->
    <div v-if="generateError" class="md3-alert md3-alert--error" style="margin-top: 16px">
      <span class="md3-alert__icon">&#9888;</span>
      <span class="md3-alert__body">生成失败：{{ generateError }}</span>
    </div>
  </Md3Card>

  <!-- Activity Modal -->
  <ActivityModal
    :show="showModal"
    :discount-types="discountTypes"
    :activity="editingActivity"
    @update:show="showModal = $event"
    @save="handleSaveActivity"
  />

  <!-- Generate Progress Dialog -->
  <GenerateProgressDialog
    :show="generating"
    @cancel="store.cancelGenerate()"
  />
  </div>
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
  margin-bottom: 16px;
}

.section-label {
  font-size: var(--md-title-small);
  font-weight: 600;
  color: var(--md-on-surface);
  margin: 0;
}

.required-dot {
  color: var(--md-error);
}

/* Activity list */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.activity-card {
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-medium);
  padding: 16px;
  background: var(--md-surface);
  transition: box-shadow var(--md-duration-short4) var(--md-easing-standard);
}

.activity-card:hover {
  box-shadow: var(--md-elevation-1);
}

.activity-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.activity-index {
  font-size: var(--md-label-large);
  font-weight: 600;
  color: var(--md-on-surface);
}

.activity-body {
  font-size: var(--md-body-medium);
}

.activity-row {
  display: flex;
  gap: 10px;
  margin-bottom: 6px;
  line-height: 1.5;
}

.activity-label {
  color: var(--md-on-surface-variant);
  flex-shrink: 0;
  min-width: 70px;
  font-size: var(--md-body-small);
}

.activity-value {
  color: var(--md-on-surface);
}

.activity-highlight {
  color: var(--md-primary);
  font-weight: 600;
}

.activity-images {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}

.activity-img {
  width: 52px;
  height: 52px;
  border-radius: var(--md-shape-small);
  object-fit: cover;
  border: 1px solid var(--md-outline-variant);
}

/* Merchant grid */
.merchant-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.merchant-card {
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-medium);
  padding: 16px;
  background: var(--md-surface);
  cursor: pointer;
  transition: all var(--md-duration-short4) var(--md-easing-standard);
}

.merchant-card:hover {
  box-shadow: var(--md-elevation-1);
  border-color: var(--md-outline);
}

.merchant-card--selected {
  border-color: var(--md-primary);
  border-width: 2px;
  padding: 15px;
  background: color-mix(in srgb, var(--md-primary-container) 25%, var(--md-surface));
}

.merchant-card-body {
  display: flex;
  align-items: center;
  gap: 12px;
}

.merchant-card-info {
  flex: 1;
  min-width: 0;
}

.merchant-name {
  display: block;
  font-size: var(--md-body-large);
  font-weight: 600;
  color: var(--md-on-surface);
}

.merchant-detail {
  display: block;
  font-size: var(--md-body-small);
  color: var(--md-on-surface-variant);
  margin-top: 2px;
}

.merchant-delete-btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: var(--md-shape-full);
  border: none;
  background: transparent;
  color: var(--md-on-surface-variant);
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--md-duration-short4) var(--md-easing-standard);
}

.merchant-delete-btn:hover {
  background: color-mix(in srgb, var(--md-error) 10%, transparent);
  color: var(--md-error);
}

/* Add merchant card */
.merchant-card--add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  border-style: dashed;
  border-color: var(--md-outline);
  color: var(--md-on-surface-variant);
}

.merchant-card--add:hover {
  border-color: var(--md-primary);
  color: var(--md-primary);
  background: color-mix(in srgb, var(--md-primary) 5%, transparent);
}

.merchant-add-icon {
  font-size: 20px;
  font-weight: 500;
}

.merchant-add-text {
  font-size: var(--md-label-large);
  font-weight: 500;
}

/* Merchant form */
.merchant-form-card {
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-medium);
  padding: 20px;
  background: var(--md-surface-container-low);
  margin-top: 12px;
  animation: md3-slide-up var(--md-duration-short4) var(--md-easing-standard);
}

.merchant-form-title {
  font-size: var(--md-title-small);
  font-weight: 600;
  color: var(--md-on-surface);
  margin: 0 0 16px 0;
}

.merchant-form-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.merchant-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

/* Action bar */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-right {
  display: flex;
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
