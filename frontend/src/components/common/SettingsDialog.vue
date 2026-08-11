<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import api from '../../api'
import { useToast } from '../../composables/useToast'

const toast = useToast()
const emit = defineEmits(['close'])

// ====== Tab ======
const activeTab = ref('model')

// ====== 模型设置（原有逻辑） ======
const loading = ref(true)
const saving = ref(false)
const groups = ref({})
const formData = ref({})
const showPasswords = ref({})

const uploadStats = ref({ count: 0, totalSize: '0 MB' })
const cleanupDays = ref(7)
const cleaning = ref(false)

onMounted(async () => {
  try {
    const [settingsRes, statsRes] = await Promise.all([
      api.getSettings(),
      api.getUploadStats(),
    ])
    if (settingsRes.data.success) {
      groups.value = settingsRes.data.groups
      for (const fields of Object.values(settingsRes.data.groups)) {
        for (const field of fields) {
          formData.value[field.key] = field.hasValue ? '' : ''
          if (field.type === 'password' && field.hasValue) {
            formData.value[field.key] = ''
          }
        }
      }
    }
    if (statsRes.data.success) {
      uploadStats.value = statsRes.data
    }
  } catch (e) {
    toast.error('加载设置失败：' + e.message)
  } finally {
    loading.value = false
  }
})

const handleCleanup = async () => {
  const days = cleanupDays.value
  const confirmMsg = days === 0
    ? '确定要清理所有上传文件吗？'
    : `确定要清理 ${days} 天前的上传文件吗？`
  if (!confirm(confirmMsg)) return
  cleaning.value = true
  try {
    const res = await api.cleanupUploads(days)
    if (res.data.success) {
      toast.success(res.data.message)
      const statsRes = await api.getUploadStats()
      if (statsRes.data.success) uploadStats.value = statsRes.data
    }
  } catch (e) {
    toast.error('清理失败：' + e.message)
  } finally {
    cleaning.value = false
  }
}

const handleSave = async () => {
  saving.value = true
  try {
    const updates = {}
    for (const [key, val] of Object.entries(formData.value)) {
      if (val !== '') updates[key] = val
    }
    const res = await api.updateSettings(updates)
    if (res.data.success) {
      toast.success('设置已保存')
      emit('close')
    }
  } catch (e) {
    toast.error('保存失败：' + e.message)
  } finally {
    saving.value = false
  }
}

const togglePassword = (key) => {
  showPasswords.value[key] = !showPasswords.value[key]
}

// ====== 数据设置 ======
const dataLoading = ref(false)
const selectedTable = ref('brands')
const tableData = ref([])
const editingId = ref(null)
const editForm = ref({})
const adding = ref(false)
const addForm = ref({})

const tables = [
  { key: 'brands', label: '品牌管理', fields: [
    { key: 'code', label: '编码', readonly: true },
    { key: 'name', label: '名称' },
    { key: 'description', label: '描述' },
  ]},
  { key: 'festivals', label: '节日管理', fields: [
    { key: 'code', label: '编码', readonly: true },
    { key: 'name', label: '名称' },
    { key: 'colorScheme', label: '配色方案' },
    { key: 'primaryColor', label: '主色', type: 'color' },
    { key: 'secondaryColor', label: '辅色', type: 'color' },
    { key: 'bgColor', label: '背景色', type: 'color' },
  ]},
  { key: 'discountTypes', label: '优惠类型', fields: [
    { key: 'code', label: '编码', readonly: true },
    { key: 'name', label: '名称' },
    { key: 'category', label: '分类' },
    { key: 'shortDesc', label: '简述' },
  ]},
  { key: 'merchants', label: '商家管理', fields: [
    { key: 'id', label: 'ID', readonly: true },
    { key: 'name', label: '名称' },
    { key: 'address', label: '地址' },
    { key: 'phone', label: '电话' },
  ]},
]

const currentTable = computed(() => tables.find(t => t.key === selectedTable.value))

const fetchTableData = async () => {
  dataLoading.value = true
  editingId.value = null
  adding.value = false
  try {
    let res
    switch (selectedTable.value) {
      case 'brands':
        res = await api.getAllBrands()
        tableData.value = res.data.data || []
        break
      case 'festivals':
        res = await api.getAllFestivals()
        tableData.value = res.data.data || []
        break
      case 'discountTypes':
        res = await api.getAllDiscountTypes()
        tableData.value = res.data.data || []
        break
      case 'merchants':
        res = await api.getMerchantTemplates()
        tableData.value = res.data.merchantTemplates || []
        break
    }
  } catch (e) {
    toast.error('加载数据失败：' + e.message)
  } finally {
    dataLoading.value = false
  }
}

watch(selectedTable, () => fetchTableData())
watch(activeTab, (tab) => { if (tab === 'data') fetchTableData() })

const startEdit = (row) => {
  editingId.value = row.code || row.id
  editForm.value = { ...row }
}

const cancelEdit = () => {
  editingId.value = null
  editForm.value = {}
}

const saveEdit = async () => {
  try {
    const id = editingId.value
    switch (selectedTable.value) {
      case 'brands':
        await api.updateBrand(id, editForm.value)
        break
      case 'festivals':
        await api.updateFestival(id, editForm.value)
        break
      case 'discountTypes':
        await api.updateDiscountType(id, editForm.value)
        break
      case 'merchants':
        await api.updateMerchant(id, editForm.value)
        break
    }
    toast.success('保存成功')
    editingId.value = null
    await fetchTableData()
  } catch (e) {
    toast.error('保存失败：' + e.message)
  }
}

const deleteRow = async (row) => {
  if (!confirm(`确定要删除"${row.name}"吗？`)) return
  try {
    const id = row.code || row.id
    switch (selectedTable.value) {
      case 'brands':
        await api.deleteBrand(id)
        break
      case 'festivals':
        await api.deleteFestival(id)
        break
      case 'discountTypes':
        await api.deleteDiscountType(id)
        break
      case 'merchants':
        await api.deleteCustomMerchant(id)
        break
    }
    toast.success('已删除')
    await fetchTableData()
  } catch (e) {
    toast.error('删除失败：' + e.message)
  }
}

const startAdd = () => {
  adding.value = true
  addForm.value = {}
  for (const f of currentTable.value.fields) {
    addForm.value[f.key] = ''
  }
}

const cancelAdd = () => {
  adding.value = false
  addForm.value = {}
}

// 品牌LOGO上传
const handleLogoUpload = async (e, code) => {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    await api.uploadBrandLogo(code, file)
    toast.success('LOGO已上传')
    await fetchTableData()
  } catch (err) {
    toast.error('上传失败：' + (err.message || '网络错误'))
  }
  e.target.value = ''
}

const handleLogoDelete = async (code) => {
  if (!confirm('确定要删除该品牌LOGO吗？')) return
  try {
    await api.deleteBrandLogo(code)
    toast.success('LOGO已删除')
    await fetchTableData()
  } catch (err) {
    toast.error('删除失败：' + (err.message || '网络错误'))
  }
}

const saveAdd = async () => {
  try {
    if (!addForm.value.code?.trim() && selectedTable.value !== 'merchants') {
      toast.error('编码不能为空')
      return
    }
    if (!addForm.value.name?.trim()) {
      toast.error('名称不能为空')
      return
    }
    switch (selectedTable.value) {
      case 'brands':
        await api.createBrand(addForm.value)
        break
      case 'festivals':
        await api.createFestival(addForm.value)
        break
      case 'discountTypes':
        await api.createDiscountType(addForm.value)
        break
      case 'merchants':
        await api.addCustomMerchant(addForm.value)
        break
    }
    toast.success('添加成功')
    adding.value = false
    addForm.value = {}
    await fetchTableData()
  } catch (e) {
    toast.error('添加失败：' + e.message)
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="settings-overlay" @click.self="emit('close')">
      <div class="settings-dialog">
        <!-- Header -->
        <div class="settings-header">
          <h2 class="settings-title">设置</h2>
          <button class="settings-close" @click="emit('close')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Tabs -->
        <div class="settings-tabs">
          <button :class="['tab-btn', { active: activeTab === 'model' }]" @click="activeTab = 'model'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            模型设置
          </button>
          <button :class="['tab-btn', { active: activeTab === 'data' }]" @click="activeTab = 'data'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
            数据设置
          </button>
        </div>

        <!-- Body -->
        <div class="settings-body">

          <!-- ====== 模型设置 Tab ====== -->
          <template v-if="activeTab === 'model'">
            <div v-if="loading" class="settings-loading">
              <div class="md3-spinner"><span class="md3-spinner__circle"></span></div>
              <span>加载中...</span>
            </div>

            <template v-else>
              <div v-for="(fields, groupName) in groups" :key="groupName" class="settings-group">
                <div class="settings-group-title">{{ groupName }}</div>
                <div v-for="field in fields" :key="field.key" class="settings-field">
                  <label class="settings-label">{{ field.label }}</label>
                  <div class="settings-input-wrap">
                    <input
                      v-if="field.type === 'password'"
                      :type="showPasswords[field.key] ? 'text' : 'password'"
                      v-model="formData[field.key]"
                      :placeholder="field.hasValue ? '已设置（留空保持不变）' : '未设置'"
                      class="settings-input"
                    />
                    <input
                      v-else
                      type="text"
                      v-model="formData[field.key]"
                      :placeholder="field.hasValue ? field.value : '未设置'"
                      class="settings-input"
                    />
                    <button
                      v-if="field.type === 'password'"
                      class="settings-eye"
                      @click="togglePassword(field.key)"
                      :title="showPasswords[field.key] ? '隐藏' : '显示'"
                    >
                      <svg v-if="showPasswords[field.key]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                  </div>
                  <span v-if="field.hasValue && field.type === 'password' && !formData[field.key]" class="settings-hint">
                    当前: {{ field.value }}
                  </span>
                </div>
              </div>

              <!-- 存储管理 -->
              <div class="settings-group">
                <div class="settings-group-title">存储管理</div>
                <div class="cleanup-section">
                  <div class="cleanup-info">
                    <span class="cleanup-stats">
                      上传文件：<strong>{{ uploadStats.count }}</strong> 个，
                      占用 <strong>{{ uploadStats.totalSize }}</strong>
                    </span>
                    <span class="cleanup-note">新上传的图片已改为 Base64 存储，不再产生文件缓存</span>
                  </div>
                  <div class="cleanup-actions">
                    <select v-model="cleanupDays" class="cleanup-select">
                      <option :value="0">所有文件</option>
                      <option :value="1">1天前</option>
                      <option :value="3">3天前</option>
                      <option :value="7">7天前</option>
                      <option :value="14">14天前</option>
                      <option :value="30">30天前</option>
                    </select>
                    <button
                      class="md3-btn md3-btn--outlined md3-btn--danger"
                      :disabled="cleaning || uploadStats.count === 0"
                      @click="handleCleanup"
                    >
                      <span v-if="cleaning" class="md3-spinner md3-spinner--small"><span class="md3-spinner__circle"></span></span>
                      <span v-else>清理文件</span>
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </template>

          <!-- ====== 数据设置 Tab ====== -->
          <template v-if="activeTab === 'data'">
            <!-- 表选择器 -->
            <div class="data-toolbar">
              <select v-model="selectedTable" class="data-select">
                <option v-for="t in tables" :key="t.key" :value="t.key">{{ t.label }}</option>
              </select>
              <button class="md3-btn md3-btn--filled md3-btn--small" @click="startAdd">
                + 新增
              </button>
            </div>

            <div v-if="dataLoading" class="settings-loading">
              <div class="md3-spinner"><span class="md3-spinner__circle"></span></div>
              <span>加载中...</span>
            </div>

            <div v-else class="data-table-wrap">
              <!-- 新增行 -->
              <div v-if="adding" class="data-edit-row">
                <div class="data-edit-fields">
                  <div v-for="f in currentTable.fields" :key="f.key" class="data-edit-field" v-show="f.key !== 'id'">
                    <label class="data-field-label">{{ f.label }}<span v-if="f.key === 'code'" class="data-required">*</span></label>
                    <div class="data-color-wrap" v-if="f.type === 'color'">
                      <input type="color" v-model="addForm[f.key]" class="data-color-input" />
                      <input type="text" v-model="addForm[f.key]" class="settings-input settings-input--small" />
                    </div>
                    <input v-else type="text" v-model="addForm[f.key]" class="settings-input settings-input--small" />
                  </div>
                </div>
                <div class="data-edit-actions">
                  <button class="md3-btn md3-btn--text md3-btn--small" @click="cancelAdd">取消</button>
                  <button class="md3-btn md3-btn--filled md3-btn--small" @click="saveAdd">保存</button>
                </div>
              </div>

              <!-- 数据行 -->
              <div v-for="row in tableData" :key="row.code || row.id" class="data-row">
                <!-- 查看模式 -->
                <div v-if="editingId !== (row.code || row.id)" class="data-row-view">
                  <!-- 品牌LOGO列 -->
                  <div v-if="selectedTable === 'brands'" class="data-logo-cell">
                    <img
                      :src="`/api/brands/${row.code}/logo`"
                      class="data-logo-thumb"
                      @error="$event.target.style.display='none'"
                    />
                    <label class="data-logo-upload" :title="row.hasLogo ? '更换LOGO' : '上传LOGO'">
                      <input type="file" accept="image/*" @change="handleLogoUpload($event, row.code)" hidden />
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    </label>
                  </div>
                  <div class="data-row-info">
                    <span v-for="f in currentTable.fields" :key="f.key" class="data-cell">
                      <span class="data-cell-label">{{ f.label }}:</span>
                      <span v-if="f.type === 'color'" class="data-color-dot" :style="{ background: row[f.key] }"></span>
                      <span>{{ row[f.key] ?? '-' }}</span>
                    </span>
                  </div>
                  <div class="data-row-actions">
                    <button class="data-action-btn" @click="startEdit(row)" title="编辑">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="data-action-btn data-action-btn--danger" @click="deleteRow(row)" title="删除">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                  </div>
                </div>

                <!-- 编辑模式 -->
                <div v-else class="data-edit-row">
                  <div class="data-edit-fields">
                    <div v-for="f in currentTable.fields" :key="f.key" class="data-edit-field">
                      <label class="data-field-label">{{ f.label }}</label>
                      <div class="data-color-wrap" v-if="f.type === 'color'">
                        <input type="color" v-model="editForm[f.key]" class="data-color-input" />
                        <input type="text" v-model="editForm[f.key]" class="settings-input settings-input--small" :readonly="f.readonly" />
                      </div>
                      <input v-else type="text" v-model="editForm[f.key]" class="settings-input settings-input--small" :readonly="f.readonly" />
                    </div>
                  </div>
                  <div class="data-edit-actions">
                    <button class="md3-btn md3-btn--text md3-btn--small" @click="cancelEdit">取消</button>
                    <button class="md3-btn md3-btn--filled md3-btn--small" @click="saveEdit">保存</button>
                  </div>
                </div>
              </div>

              <div v-if="!dataLoading && tableData.length === 0" class="data-empty">暂无数据</div>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="settings-footer">
          <button class="md3-btn md3-btn--text" @click="emit('close')">关闭</button>
          <button v-if="activeTab === 'model'" class="md3-btn md3-btn--filled" :disabled="saving || loading" @click="handleSave">
            <span v-if="saving" class="md3-spinner md3-spinner--small"><span class="md3-spinner__circle"></span></span>
            <span v-else>保存</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 24px;
}

.settings-dialog {
  background: var(--md-surface-container-low);
  border-radius: var(--md-shape-extra-large);
  width: 620px;
  max-width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--md-elevation-3);
  animation: dialogIn 0.25s var(--md-easing-emphasized-decel);
  overflow: hidden;
}

@keyframes dialogIn {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px 0;
}

.settings-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--md-on-surface);
  margin: 0;
}

.settings-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--md-on-surface-variant);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--md-duration-short4) var(--md-easing-standard);
}
.settings-close:hover {
  background: var(--md-surface-container-highest);
}

/* Tabs */
.settings-tabs {
  display: flex;
  gap: 4px;
  padding: 16px 28px 0;
  border-bottom: 1px solid var(--md-outline-variant);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border: none;
  background: transparent;
  color: var(--md-on-surface-variant);
  font-size: var(--md-label-large);
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all var(--md-duration-short4) var(--md-easing-standard);
}

.tab-btn:hover {
  color: var(--md-on-surface);
  background: var(--md-surface-container);
}

.tab-btn.active {
  color: var(--md-primary);
  border-bottom-color: var(--md-primary);
}

.settings-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 28px;
}

.settings-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 0;
  color: var(--md-on-surface-variant);
}

.settings-group {
  margin-bottom: 20px;
}

.settings-group-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--md-primary);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--md-outline-variant);
}

.settings-field {
  margin-bottom: 14px;
}

.settings-label {
  display: block;
  font-size: var(--md-body-small);
  font-weight: 500;
  color: var(--md-on-surface);
  margin-bottom: 6px;
}

.settings-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.settings-input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1px solid var(--md-outline);
  border-radius: var(--md-shape-small);
  background: var(--md-surface);
  color: var(--md-on-surface);
  font-size: var(--md-body-medium);
  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  transition: border-color var(--md-duration-short4) var(--md-easing-standard);
  outline: none;
}
.settings-input:focus {
  border-color: var(--md-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--md-primary) 20%, transparent);
}
.settings-input::placeholder {
  color: var(--md-on-surface-variant);
  opacity: 0.6;
  font-family: inherit;
}

.settings-input--small {
  height: 36px;
  font-size: var(--md-body-small);
}

.settings-eye {
  position: absolute;
  right: 10px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--md-on-surface-variant);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--md-duration-short4) var(--md-easing-standard);
}
.settings-eye:hover {
  background: var(--md-surface-container-highest);
}

.settings-hint {
  display: block;
  font-size: 12px;
  color: var(--md-on-surface-variant);
  margin-top: 4px;
  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  opacity: 0.7;
}

.settings-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 28px 20px;
  border-top: 1px solid var(--md-outline-variant);
}

/* MD3 buttons */
.md3-btn {
  height: 40px;
  padding: 0 24px;
  border-radius: 20px;
  border: none;
  font-size: var(--md-label-large);
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all var(--md-duration-short4) var(--md-easing-standard);
}
.md3-btn--filled {
  background: var(--md-primary);
  color: var(--md-on-primary);
}
.md3-btn--filled:hover { box-shadow: var(--md-elevation-1); }
.md3-btn--filled:disabled { opacity: 0.38; cursor: not-allowed; }
.md3-btn--text {
  background: transparent;
  color: var(--md-primary);
}
.md3-btn--text:hover {
  background: color-mix(in srgb, var(--md-primary) 8%, transparent);
}
.md3-btn--outlined {
  background: transparent;
  color: var(--md-primary);
  border: 1px solid var(--md-outline);
}
.md3-btn--outlined:hover {
  background: color-mix(in srgb, var(--md-primary) 8%, transparent);
}
.md3-btn--small {
  height: 32px;
  padding: 0 16px;
  font-size: var(--md-body-small);
  border-radius: 16px;
}
.md3-btn--danger {
  color: var(--md-error);
  border-color: var(--md-error);
}
.md3-btn--danger:hover {
  background: color-mix(in srgb, var(--md-error) 8%, transparent);
}
.md3-btn--danger:disabled { opacity: 0.38; cursor: not-allowed; }

.md3-spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.md3-spinner__circle {
  width: 20px;
  height: 20px;
  border: 2px solid var(--md-outline);
  border-top-color: var(--md-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.md3-spinner--small .md3-spinner__circle {
  width: 16px;
  height: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Cleanup */
.cleanup-section {
  background: var(--md-surface-container);
  border-radius: var(--md-shape-small);
  padding: 16px;
}
.cleanup-info { margin-bottom: 12px; }
.cleanup-stats {
  font-size: var(--md-body-medium);
  color: var(--md-on-surface);
}
.cleanup-stats strong { color: var(--md-primary); font-weight: 600; }
.cleanup-note {
  display: block;
  font-size: var(--md-body-small);
  color: var(--md-on-surface-variant);
  margin-top: 4px;
  font-style: italic;
}
.cleanup-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.cleanup-select {
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--md-outline);
  border-radius: var(--md-shape-small);
  background: var(--md-surface);
  color: var(--md-on-surface);
  font-size: var(--md-body-medium);
  cursor: pointer;
  outline: none;
}
.cleanup-select:focus { border-color: var(--md-primary); }

/* ====== 数据设置 ====== */
.data-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.data-select {
  height: 40px;
  padding: 0 14px;
  border: 1px solid var(--md-outline);
  border-radius: var(--md-shape-small);
  background: var(--md-surface);
  color: var(--md-on-surface);
  font-size: var(--md-body-medium);
  cursor: pointer;
  outline: none;
  min-width: 160px;
}
.data-select:focus { border-color: var(--md-primary); }

.data-table-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.data-row {
  background: var(--md-surface);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-small);
  overflow: hidden;
}

.data-row-view {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  gap: 12px;
}

.data-row-info {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  min-width: 0;
}

.data-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--md-body-small);
  color: var(--md-on-surface);
}

.data-cell-label {
  color: var(--md-on-surface-variant);
  font-size: 12px;
  flex-shrink: 0;
}

/* 品牌LOGO */
.data-logo-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.data-logo-thumb {
  width: 36px;
  height: 36px;
  border-radius: var(--md-shape-small);
  object-fit: contain;
  border: 1px solid var(--md-outline-variant);
  background: var(--md-surface-container);
}

.data-logo-upload {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px dashed var(--md-outline);
  background: transparent;
  color: var(--md-on-surface-variant);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--md-duration-short4) var(--md-easing-standard);
}

.data-logo-upload:hover {
  border-color: var(--md-primary);
  color: var(--md-primary);
  background: color-mix(in srgb, var(--md-primary) 8%, transparent);
}

.data-color-dot {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid var(--md-outline-variant);
  flex-shrink: 0;
}

.data-row-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.data-action-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--md-on-surface-variant);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--md-duration-short4) var(--md-easing-standard);
}
.data-action-btn:hover {
  background: var(--md-surface-container-highest);
}
.data-action-btn--danger:hover {
  background: color-mix(in srgb, var(--md-error) 12%, transparent);
  color: var(--md-error);
}

/* 编辑行 */
.data-edit-row {
  padding: 14px;
  background: var(--md-surface);
  border: 1px solid var(--md-primary);
  border-radius: var(--md-shape-small);
}

.data-edit-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.data-edit-field {
  flex: 1;
  min-width: 120px;
}

.data-field-label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: var(--md-on-surface-variant);
  margin-bottom: 4px;
}

.data-required {
  color: var(--md-error);
  margin-left: 2px;
}

.data-color-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.data-color-input {
  width: 36px;
  height: 36px;
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-small);
  cursor: pointer;
  padding: 2px;
  background: var(--md-surface);
}

.data-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.data-empty {
  text-align: center;
  padding: 32px;
  color: var(--md-on-surface-variant);
  font-size: var(--md-body-medium);
}

/* Responsive */
@media (max-width: 600px) {
  .settings-dialog { width: 100%; max-height: 95vh; }
  .data-row-info { flex-direction: column; gap: 4px; }
  .data-edit-fields { flex-direction: column; }
}
</style>
