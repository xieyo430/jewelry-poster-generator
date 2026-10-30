<script setup>
import { ref, computed, toRef, watch } from 'vue'
import { usePosterStore } from '../../store/poster'
import { useToast } from '../../composables/useToast'
import EdSection from '../common/EdSection.vue'
import EdButton from '../common/EdButton.vue'
import EdField from '../common/EdField.vue'
import EdIcon from '../common/EdIcon.vue'
import EdDialog from '../common/EdDialog.vue'
import ActivityModal from '../common/ActivityModal.vue'
import GenerateProgressDialog from '../common/GenerateProgressDialog.vue'

const toast = useToast()
const store = usePosterStore()
const activities = toRef(store, 'activities')
const merchantInfo = toRef(store, 'merchantInfo')
const discountTypes = toRef(store, 'discountTypes')
const merchantTemplates = toRef(store, 'merchantTemplates')
const brandName = computed(() => store.displayBrandName || '')
const industryTemplate = computed(() => store.industryTemplate)
const compatibleMerchantTemplates = computed(() => {
  if (store.industry !== 'jewelry') return []
  const name = brandName.value.trim()
  if (!name) return []
  return merchantTemplates.value.filter(t => t.name.includes(name))
})
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

const pendingDeleteAct = ref(null)

function askDeleteAct(act) { pendingDeleteAct.value = act.id }

function confirmDeleteAct() {
  if (pendingDeleteAct.value !== null) {
    store.removeActivity(pendingDeleteAct.value)
    toast.success('活动已删除')
  }
  pendingDeleteAct.value = null
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

function syncMerchantWithBrand() {
  const matched = compatibleMerchantTemplates.value[0]
  if (matched) {
    selectMerchantTemplate(matched.id)
    return
  }
  store.selectedMerchantTemplateId = 'custom'
  store.merchantInfo = {
    name: brandName.value ? `${brandName.value}${industryTemplate.value.merchantSuffix}` : '',
    address: '',
    phone: '',
  }
}

// 挂载时（previous === undefined）若已有商户名，说明是恢复项目/草稿，不得覆盖
watch(() => store.displayBrandName, (value, previous) => {
  if (!value || value === previous) return
  if (previous === undefined && store.merchantInfo.name.trim()) return
  syncMerchantWithBrand()
}, { immediate: true })
watch(() => store.industry, (value, previous) => {
  if (previous !== undefined && value === previous) return
  if (previous === undefined && store.merchantInfo.name.trim()) return
  syncMerchantWithBrand()
}, { immediate: true })

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

const pendingDeleteMerchant = ref(null)

function askDeleteMerchant(id) { pendingDeleteMerchant.value = id }

async function confirmDeleteMerchant() {
  const id = pendingDeleteMerchant.value
  pendingDeleteMerchant.value = null
  if (id === null) return
  try {
    await store.deleteCustomMerchant(id)
    toast.success('商家地址已删除')
  } catch (e) {
    toast.error('删除失败：' + (e.message || '网络错误'))
  }
}
</script>

<template>
  <EdSection num="03" title="反面活动" desc="添加详细活动介绍（最多6个）和商家信息">
    <div class="block">
      <div class="block__head">
        <h3 class="block__title ed-label">活动列表</h3>
        <span class="ed-meta">{{ activities.length }} / 6</span>
        <EdButton
          variant="text"
          size="sm"
          :disabled="activities.length >= 6"
          @click="openAddModal"
        >
          <EdIcon name="plus" :size="15" />
          添加活动
        </EdButton>
      </div>

      <div v-if="activities.length === 0" class="empty">
        <p class="empty__line">暂无活动</p>
        <hr class="ed-rule" />
        <p class="empty__hint ed-meta">点击上方按钮添加活动详情</p>
      </div>

      <div v-else>
        <div
          v-for="(act, idx) in activities"
          :key="act.id"
          class="act-row"
        >
          <span class="act-row__index ed-meta">{{ String(idx + 1).padStart(2, '0') }}</span>
          <span class="act-row__name">{{ act.discountType || '未分类' }}</span>
          <span class="spacer" />
          <button type="button" class="icon-btn" title="编辑" @click="openEditModal(act)">
            <EdIcon name="edit" :size="15" />
          </button>
          <button type="button" class="icon-btn icon-btn--danger" title="删除" @click="askDeleteAct(act)">
            <EdIcon name="trash" :size="15" />
          </button>
        </div>
      </div>
    </div>

    <div class="block">
      <div class="block__head">
        <h3 class="block__title ed-label">商家信息</h3>
        <span class="ed-badge ed-badge--req">必选</span>
      </div>

      <div class="brands">
        <button
          v-for="tpl in compatibleMerchantTemplates"
          :key="tpl.id"
          type="button"
          :class="['brand', { 'is-selected': selectedMerchantTemplateId === tpl.id }]"
          @click="selectMerchantTemplate(tpl.id)"
        >
          <span class="brand__name">{{ tpl.name }}</span>
          <span v-if="tpl.address" class="brand__desc ed-meta">
            {{ tpl.address }}<template v-if="tpl.phone"> | {{ tpl.phone }}</template>
          </span>
          <span
            v-if="!tpl.isDefault"
            role="button"
            tabindex="0"
            class="merchant-del"
            title="删除"
            @click.stop="askDeleteMerchant(tpl.id)"
            @keydown.enter.stop.prevent="askDeleteMerchant(tpl.id)"
          >
            <EdIcon name="trash" :size="13" />
          </span>
          <EdIcon v-if="selectedMerchantTemplateId === tpl.id" name="check" :size="14" class="brand__tick" />
        </button>

        <button
          type="button"
          :class="['brand', { 'is-selected': selectedMerchantTemplateId === 'custom' }]"
          @click="selectMerchantTemplate('custom')"
        >
          <span class="brand__name">自定义</span>
          <span class="brand__desc ed-meta">手动填写商家信息</span>
          <EdIcon v-if="selectedMerchantTemplateId === 'custom'" name="check" :size="14" class="brand__tick" />
        </button>
      </div>

      <p v-if="brandName && !compatibleMerchantTemplates.length" class="merchant-hint ed-meta">
        {{ store.industry === 'jewelry' ? '当前品牌暂无预设门店，已切换为同品牌自定义信息。' : `请填写${industryTemplate.name}门店信息。` }}
      </p>

      <EdButton v-if="!showMerchantForm" variant="text" size="sm" @click="openMerchantForm">
        <EdIcon name="plus" :size="15" />
        新增商家地址
      </EdButton>

      <div v-if="showMerchantForm" class="block m-form">
        <div class="block__head">
          <h4 class="block__title ed-label">新增商家地址</h4>
        </div>
        <div class="fields">
          <EdField v-model="merchantForm.name" label="商家名称" :placeholder="`如：${brandName || '品牌'}${industryTemplate.merchantSuffix}`" />
          <EdField v-model="merchantForm.address" label="店铺地址" :placeholder="`如：${brandName || '品牌'}（中心广场店）`" />
          <EdField v-model="merchantForm.phone" label="联系电话" placeholder="输入联系电话" />
        </div>
        <div class="actions">
          <EdButton variant="text" size="sm" @click="closeMerchantForm">取消</EdButton>
          <EdButton
            variant="solid"
            size="sm"
            :disabled="!merchantForm.name.trim()"
            :loading="merchantSaving"
            @click="saveMerchant"
          >保存</EdButton>
        </div>
      </div>

      <div v-if="isCustomMerchant && selectedMerchantTemplateId === 'custom' && !showMerchantForm" class="block m-form">
        <div class="block__head">
          <h4 class="block__title ed-label">自定义商家信息</h4>
        </div>
        <div class="fields">
          <EdField :model-value="merchantInfo.name" label="商家名称" @update:model-value="merchantInfo.name = $event" :placeholder="`如：${brandName || '品牌'}${industryTemplate.merchantSuffix}`" />
          <EdField :model-value="merchantInfo.address" label="店铺地址" @update:model-value="merchantInfo.address = $event" :placeholder="`如：${brandName || '品牌'}（中心广场店）`" />
          <EdField :model-value="merchantInfo.phone" label="联系电话" @update:model-value="merchantInfo.phone = $event" placeholder="输入联系电话" />
        </div>
      </div>
    </div>

    <hr class="ed-rule" />
    <div class="actions">
      <EdButton variant="text" @click="store.setStep(2)">
        <EdIcon name="arrow-left" :size="15" />
        上一步
      </EdButton>
      <span v-if="!canStep3Next" class="actions__hint ed-meta">
        <span v-if="!activities.length && !merchantInfo.name.trim()">请添加活动并填写商家信息</span>
        <span v-else-if="!activities.length">请添加至少一个活动</span>
        <span v-else>请填写商家名称</span>
      </span>
      <EdButton
        variant="solid"
        :disabled="!canStep3Next || generating"
        :loading="generating"
        @click="store.generatePosters()"
      >
        <EdIcon v-if="!generating" name="sparkle" :size="15" />
        <template v-if="!generating">生成海报</template>
        <template v-else>生成中...</template>
      </EdButton>
    </div>

    <div v-if="generateError" class="note">
      <EdIcon name="warning" :size="13" class="note__icon" />
      <span>生成失败：{{ generateError }}</span>
    </div>

    <EdDialog
      v-if="pendingDeleteAct !== null"
      title="删除这个活动？"
      :width="420"
      @close="pendingDeleteAct = null"
    >
      <p class="confirm-text">删除后无法恢复，需要重新填写。</p>
      <template #footer>
        <EdButton variant="text" @click="pendingDeleteAct = null">取消</EdButton>
        <EdButton variant="solid" @click="confirmDeleteAct">删除</EdButton>
      </template>
    </EdDialog>

    <EdDialog
      v-if="pendingDeleteMerchant !== null"
      title="删除这个商家地址？"
      :width="420"
      @close="pendingDeleteMerchant = null"
    >
      <p class="confirm-text">删除后无法恢复。</p>
      <template #footer>
        <EdButton variant="text" @click="pendingDeleteMerchant = null">取消</EdButton>
        <EdButton variant="solid" @click="confirmDeleteMerchant">删除</EdButton>
      </template>
    </EdDialog>
    <ActivityModal
      :show="showModal"
      :discount-types="discountTypes"
      :activity="editingActivity"
      :industry="store.industry"
      @update:show="showModal = $event"
      @save="handleSaveActivity"
    />

    <GenerateProgressDialog
      :show="generating"
      @cancel="store.cancelGenerate()"
    />
  </EdSection>
</template>

<style scoped>
.act-row {
  display: flex;
  align-items: center;
  gap: var(--ed-space-3);
  padding: var(--ed-space-3) 0;
  border-bottom: 1px solid var(--ed-rule);
}
.act-row__index { text-transform: none; letter-spacing: .04em; }
.act-row__name {
  font-family: var(--ed-serif);
  font-size: 16px;
  color: var(--ed-ink);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.spacer { flex: 1; }

.icon-btn {
  display: inline-flex;
  padding: var(--ed-space-1);
  border: 0;
  background: transparent;
  color: var(--ed-ink-faint);
  cursor: pointer;
}
.icon-btn:hover { color: var(--ed-ink); }
.icon-btn--danger:hover { color: var(--ed-danger); }

.empty { padding: var(--ed-space-5) 0; }
.empty__line {
  font-family: var(--ed-serif);
  font-size: var(--ed-subhead);
  color: var(--ed-ink);
  margin-bottom: var(--ed-space-3);
}
.empty__hint { text-transform: none; letter-spacing: .02em; margin-top: var(--ed-space-3); }

.m-form { margin-top: var(--ed-space-5); }

.merchant-del {
  position: absolute;
  top: var(--ed-space-3);
  right: 26px;
  display: inline-flex;
  color: var(--ed-ink-faint);
  cursor: pointer;
}
.merchant-del:hover { color: var(--ed-danger); }
.merchant-hint {
  margin: var(--ed-space-2) 0 var(--ed-space-3);
  text-transform: none;
}

.confirm-text { color: var(--ed-ink-soft); font-size: 14px; }
</style>
