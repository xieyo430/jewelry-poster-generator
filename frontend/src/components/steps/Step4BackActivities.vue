<script setup>
import { ref } from 'vue'
import { usePosterStore } from '../../store/poster'
import { storeToRefs } from 'pinia'
import ActivityModal from '../common/ActivityModal.vue'

const store = usePosterStore()
const { activities, merchantInfo, discountTypes, merchantTemplates, canStep3Next, generating, generateError, selectedMerchantTemplateId } = storeToRefs(store)

const showModal = ref(false)
const editingActivity = ref(null)

const handleSaveActivity = (activity) => {
  if (editingActivity.value) {
    // 编辑模式：更新已有活动
    store.updateActivity(activity.id, activity)
  } else {
    // 新增模式
    store.addActivity(activity)
  }
  showModal.value = false
  editingActivity.value = null
}

const editActivity = (act) => {
  editingActivity.value = { ...act }
  showModal.value = true
}

const removeActivity = (id) => {
  store.removeActivity(id)
}

const handleCloseModal = () => {
  showModal.value = false
  editingActivity.value = null
}

// 商家模板填充（缓存选择状态）
const selectMerchantTemplate = (templateId) => {
  store.selectedMerchantTemplateId = templateId
  const tpl = store.merchantTemplates.find(t => t.id === templateId)
  if (tpl && templateId !== 'custom') {
    store.merchantInfo = {
      name: tpl.name,
      address: tpl.address || '',
      phone: tpl.phone || '',
      wechat: tpl.wechat || '',
    }
  } else if (templateId === 'custom') {
    store.merchantInfo = { name: '', address: '', phone: '', wechat: '' }
  }
}

const activityTypeIcon = (type) => {
  if (type === 'text') return '📝'
  if (type === 'single_image') return '🖼️'
  if (type === 'multi_image') return '📸'
  return '📋'
}

const activityTypeName = (type) => {
  if (type === 'text') return '纯文字'
  if (type === 'single_image') return '单图+文字'
  if (type === 'multi_image') return '多图+文字'
  return type
}
</script>

<template>
  <div class="step-card">
    <h2 class="step-title">反面活动设置</h2>
    <p class="step-desc">添加详细活动介绍（最多6个）和商家信息</p>

    <!-- 活动列表 -->
    <section class="section">
      <div class="section-header">
        <h3 class="section-title">活动列表 <span class="required">*</span></h3>
        <button
          class="btn btn-primary btn-sm"
          :disabled="activities.length >= 6"
          @click="showModal = true"
        >
          + 添加活动
        </button>
      </div>

      <!-- 活动列表 -->
      <div v-if="activities.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <p>暂无活动，点击上方按钮添加</p>
        <p class="empty-hint">最多可添加6个活动</p>
      </div>

      <div v-else class="activity-list">
        <div
          v-for="(act, idx) in activities"
          :key="act.id"
          class="activity-card"
          :style="{ borderLeftColor: act.bgColor || '#2a2a4a' }"
        >
          <div class="activity-header">
            <span class="activity-index">活动 {{ idx + 1 }}</span>
            <span class="activity-type-badge">{{ activityTypeIcon(act.type) }} {{ activityTypeName(act.type) }}</span>
            <button class="edit-btn" @click="editActivity(act)">✎</button>
            <button class="remove-btn" @click="removeActivity(act.id)">✕</button>
          </div>
          <div class="activity-body">
            <div class="activity-field">
              <span class="field-label">优惠类型</span>
              <span class="field-value">{{ act.discountType }}</span>
            </div>
            <div class="activity-field">
              <span class="field-label">内容</span>
              <span class="field-value">{{ act.content }}</span>
            </div>
            <div class="activity-field" v-if="act.discountDetail">
              <span class="field-label">优惠详情</span>
              <span class="field-value highlight">{{ act.discountDetail }}</span>
            </div>
            <div class="activity-field" v-if="act.highlight">
              <span class="field-label">突出信息</span>
              <span class="field-value highlight-text">{{ act.highlight }}</span>
            </div>
            <div class="activity-images" v-if="act.imageUrls?.length">
              <img v-for="(url, i) in act.imageUrls" :key="i" :src="url" alt="" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 商家信息 -->
    <section class="section">
      <h3 class="section-title">商家信息 <span class="required">*</span></h3>

      <div class="field-group">
        <label>选择商家模板</label>
        <select class="select-input" :value="selectedMerchantTemplateId" @change="e => selectMerchantTemplate(e.target.value)">
          <option value="" disabled>选择模板或自定义</option>
          <option v-for="tpl in merchantTemplates" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
        </select>
      </div>

      <div class="merchant-form">
        <div class="field-group">
          <label>商家名称</label>
          <input v-model="store.merchantInfo.name" class="text-input" placeholder="如：周大福珠宝旗舰店" />
        </div>
        <div class="field-group">
          <label>地址</label>
          <input v-model="store.merchantInfo.address" class="text-input" placeholder="门店地址（选填）" />
        </div>
        <div class="form-row">
          <div class="field-group">
            <label>电话</label>
            <input v-model="store.merchantInfo.phone" class="text-input" placeholder="联系电话（选填）" />
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
      <button class="btn btn-secondary" @click="store.setStep(2)">← 上一步</button>
      <button
        class="btn btn-generate"
        :disabled="!canStep3Next || generating"
        @click="store.generatePosters()"
      >
        <span v-if="generating" class="btn-loading">
          <span class="spinner-small"></span>
          生成中...
        </span>
        <span v-else>✨ 生成海报</span>
      </button>
    </div>

    <!-- 错误提示 -->
    <div v-if="generateError" class="error-msg">
      生成失败：{{ generateError }}
    </div>

    <!-- 活动添加/编辑弹窗 -->
    <ActivityModal
      :visible="showModal"
      :discount-types="discountTypes"
      :edit-data="editingActivity"
      @close="handleCloseModal"
      @save="handleSaveActivity"
    />
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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.section-header .section-title { margin-bottom: 0; }

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  border: 1px dashed #2a2a4a;
  border-radius: 12px;
  color: #888;
}

.empty-icon { font-size: 36px; margin-bottom: 8px; }
.empty-state p { font-size: 14px; color: #999; }
.empty-hint { font-size: 12px; color: #777; margin-top: 4px; }

/* 活动卡片列表 */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.activity-card {
  background: #0d0d1a;
  border: 1px solid #1e1e3a;
  border-left: 4px solid;
  border-radius: 10px;
  overflow: hidden;
}

.activity-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid #1e1e3a;
}

.activity-index { font-size: 13px; font-weight: 600; color: #FFD700; }
.activity-type-badge { font-size: 11px; color: #888; }
.edit-btn, .remove-btn {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  padding: 0 4px;
}
.edit-btn { color: #555; margin-left: auto; }
.edit-btn:hover { color: #FFD700; }
.remove-btn { color: #555; }
.remove-btn:hover { color: #FF6B6B; }

.activity-body { padding: 12px 16px; }

.activity-field {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 13px;
}

.field-label { color: #777; flex-shrink: 0; min-width: 70px; }
.field-value { color: #ccc; }
.field-value.highlight { color: #FFD700; }
.field-value.highlight-text { color: #FF4500; font-weight: 700; }

.activity-images {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}
.activity-images img {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #2a2a4a;
}

/* 商家表单 */
.field-group { margin-bottom: 14px; }
.field-group label { display: block; font-size: 13px; color: #aaa; margin-bottom: 6px; }

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

.form-row {
  display: flex;
  gap: 12px;
}

.form-row .field-group { flex: 1; }

.merchant-form {
  background: #0d0d1a;
  border: 1px solid #1e1e3a;
  border-radius: 10px;
  padding: 16px;
}

/* 生成按钮 */
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

.btn-sm { padding: 8px 16px; font-size: 12px; }

.btn-primary {
  background: linear-gradient(135deg, #FFD700, #FF6B35);
  color: #000;
}
.btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }

.btn-generate {
  background: linear-gradient(135deg, #FFD700, #FF6B35, #FF1493);
  color: #000;
  font-size: 16px;
  padding: 14px 36px;
}
.btn-generate:disabled { opacity: 0.35; cursor: not-allowed; }
.btn-generate:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(255, 215, 0, 0.3); }

.btn-secondary {
  background: transparent;
  border: 1px solid #2a2a4a;
  color: #aaa;
}
.btn-secondary:hover { border-color: #888; color: #e0e0e0; }

.btn-loading { display: flex; align-items: center; gap: 8px; }

.spinner-small {
  width: 14px;
  height: 14px;
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

@media (max-width: 768px) {
  .step-card { padding: 20px; }
  .form-row { flex-direction: column; gap: 0; }
  .btn-generate { width: 100%; }
}
</style>
