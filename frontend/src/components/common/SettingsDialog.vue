<script setup>
import { ref, onMounted, watch, computed, onBeforeUnmount } from 'vue'
import api from '../../api'
import { useToast } from '../../composables/useToast'
import EdDialog from './EdDialog.vue'
import EdButton from './EdButton.vue'
import EdField from './EdField.vue'
import EdIcon from './EdIcon.vue'

const toast = useToast()
const emit = defineEmits(['close'])

// ====== Tab ======
const activeTab = ref('model')

// ====== 模型设置 ======
const loading = ref(true)
const saving = ref(false)
const groups = ref({})
const formData = ref({})
const showPasswords = ref({})
const clearPasswords = ref({})

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
          formData.value[field.key] = ''
          if (field.type === 'password') clearPasswords.value[field.key] = false
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

const handleSave = async () => {
  saving.value = true
  try {
    const updates = {}
    for (const [key, val] of Object.entries(formData.value)) {
      const field = Object.values(groups.value).flat().find(item => item.key === key)
      if (field?.type === 'password') {
        if (val !== '') updates[key] = val
        else if (clearPasswords.value[key]) updates[key] = ''
      } else if (val !== '') {
        updates[key] = val
      }
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

const updatePassword = (key, value) => {
  formData.value[key] = value
  if (value) clearPasswords.value[key] = false
}

// ====== 通用确认弹窗（替代原生 confirm） ======
const confirmState = ref(null)
function requestConfirm(msg, kind = 'danger') {
  return new Promise((resolve) => { confirmState.value = { msg, kind, resolve } })
}
function answerConfirm(ok) {
  confirmState.value?.resolve(ok)
  confirmState.value = null
}

// ====== 自绘下拉 ======
const openMenu = ref('')
function onDocDown(e) {
  if (!e.target.closest('[data-menu]')) openMenu.value = ''
}
onMounted(() => document.addEventListener('mousedown', onDocDown))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocDown))

const cleanupOptions = [
  { v: 0, l: '所有文件' },
  { v: 1, l: '1天前' },
  { v: 3, l: '3天前' },
  { v: 7, l: '7天前' },
  { v: 14, l: '14天前' },
  { v: 30, l: '30天前' },
]
const cleanupLabel = computed(() => cleanupOptions.find(o => o.v === cleanupDays.value)?.l)
const tableLabel = computed(() => tables.find(t => t.key === selectedTable.value)?.label)

const handleCleanup = async () => {
  const days = cleanupDays.value
  const confirmMsg = days === 0
    ? '确定要清理所有上传文件吗？'
    : `确定要清理 ${days} 天前的上传文件吗？`
  if (!await requestConfirm(confirmMsg, 'warning')) return
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
  if (!await requestConfirm(`确定要删除"${row.name}"吗？`)) return
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

const normHex = (v) => (v && !v.startsWith('#') ? '#' + v : v)

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
  if (!await requestConfirm('确定要删除该品牌LOGO吗？')) return
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
  <EdDialog title="设置" :width="900" @close="emit('close')">
    <nav class="tabline sd-tabs">
      <button
        type="button"
        :class="['tabline__item', { 'is-active': activeTab === 'model' }]"
        @click="activeTab = 'model'"
      >模型配置</button>
      <button
        type="button"
        :class="['tabline__item', { 'is-active': activeTab === 'data' }]"
        @click="activeTab = 'data'"
      >数据管理</button>
    </nav>

    <div class="sd-body">
      <!-- ====== 模型配置 ====== -->
      <template v-if="activeTab === 'model'">
        <p v-if="loading" class="ed-meta sd-loading">加载中...</p>

        <template v-else>
          <section v-for="(fields, groupName) in groups" :key="groupName" class="sd-group">
            <h4 class="sd-group__title ed-label">{{ groupName }}</h4>
            <div v-for="field in fields" :key="field.key" class="sd-field">
              <template v-if="field.type === 'password'">
                <div class="pw-field">
                  <EdField
                    :model-value="formData[field.key]"
                    :type="showPasswords[field.key] ? 'text' : 'password'"
                    :label="field.label"
                    :placeholder="field.hasValue ? '已设置，输入新 Key 可替换' : '未设置'"
                    @update:model-value="updatePassword(field.key, $event)"
                  />
                  <button
                    type="button"
                    class="pw-field__eye"
                    :title="showPasswords[field.key] ? '隐藏' : '显示'"
                    @click="togglePassword(field.key)"
                  >
                    <EdIcon v-if="showPasswords[field.key]" name="eye-off" :size="16" />
                    <EdIcon v-else name="eye" :size="16" />
                  </button>
                  <label v-if="field.hasValue" class="pw-field__clear">
                    <input v-model="clearPasswords[field.key]" type="checkbox" />
                    <span>清除已保存的 Key</span>
                  </label>
                </div>
              </template>
              <EdField
                v-else
                v-model="formData[field.key]"
                :label="field.label"
                :placeholder="field.hasValue ? field.value : '未设置'"
              />
            </div>
          </section>

          <section class="sd-group">
            <h4 class="sd-group__title ed-label">存储管理</h4>
            <p class="ed-meta sd-cleanup-stats">
              上传文件：{{ uploadStats.count }} 个，占用 {{ uploadStats.totalSize }}
            </p>
            <p class="ed-meta sd-cleanup-note">新上传的图片已改为 Base64 存储，不再产生文件缓存</p>
            <div class="sd-cleanup-row" data-menu>
              <button type="button" class="menu-btn" @click="openMenu = openMenu === 'cleanup' ? '' : 'cleanup'">
                <span>{{ cleanupLabel }}</span>
                <EdIcon name="chevron-down" :size="14" :class="{ 'is-up': openMenu === 'cleanup' }" />
              </button>
              <div v-if="openMenu === 'cleanup'" class="menu-pop">
                <button
                  v-for="o in cleanupOptions"
                  :key="o.v"
                  type="button"
                  :class="['menu-pop__item', { 'is-selected': o.v === cleanupDays }]"
                  @click="cleanupDays = o.v; openMenu = ''"
                >{{ o.l }}</button>
              </div>
              <EdButton
                variant="solid"
                :loading="cleaning"
                :disabled="uploadStats.count === 0"
                @click="handleCleanup"
              >清理文件</EdButton>
            </div>
          </section>
        </template>
      </template>

      <!-- ====== 数据管理 ====== -->
      <template v-if="activeTab === 'data'">
        <div class="sd-toolbar" data-menu>
          <button type="button" class="menu-btn menu-btn--wide" @click="openMenu = openMenu === 'table' ? '' : 'table'">
            <span>{{ tableLabel }}</span>
            <EdIcon name="chevron-down" :size="14" :class="{ 'is-up': openMenu === 'table' }" />
          </button>
          <div v-if="openMenu === 'table'" class="menu-pop">
            <button
              v-for="t in tables"
              :key="t.key"
              type="button"
              :class="['menu-pop__item', { 'is-selected': t.key === selectedTable }]"
              @click="selectedTable = t.key; openMenu = ''"
            >{{ t.label }}</button>
          </div>
          <EdButton variant="outline" @click="startAdd">新增</EdButton>
        </div>

        <p v-if="dataLoading" class="ed-meta sd-loading">加载中...</p>

        <template v-else>
          <!-- 新增 -->
          <div v-if="adding" class="sd-edit">
            <EdField
              v-for="f in currentTable.fields.filter(f => f.key !== 'id' && !f.type)"
              :key="f.key"
              v-model="addForm[f.key]"
              :label="f.label"
              :placeholder="f.placeholder || ''"
            />
            <div v-for="f in currentTable.fields.filter(f => f.type === 'color')" :key="'c' + f.key" class="color-field">
              <span class="color-field__box" :style="{ background: addForm[f.key] || 'transparent' }"></span>
              <EdField
                :model-value="addForm[f.key]"
                @update:model-value="addForm[f.key] = normHex($event)"
                :label="f.label"
                placeholder="#RRGGBB"
              />
            </div>
            <div class="sd-edit__actions">
              <EdButton variant="text" @click="cancelAdd">取消</EdButton>
              <EdButton variant="solid" @click="saveAdd">保存</EdButton>
            </div>
          </div>

          <!-- 数据行 -->
          <div v-for="row in tableData" :key="row.code || row.id" class="drow">
            <!-- 查看 -->
            <div v-if="editingId !== (row.code || row.id)" class="drow__view">
              <div v-if="selectedTable === 'brands'" class="drow__logo">
                <img
                  :src="`/api/brands/${row.code}/logo`"
                  class="drow__logo-img"
                  @error="$event.target.style.display='none'"
                >
                <label class="drow__logo-up" :title="row.hasLogo ? '更换LOGO' : '上传LOGO'">
                  <input type="file" accept="image/*" @change="handleLogoUpload($event, row.code)" hidden>
                  <EdIcon name="upload" :size="12" />
                </label>
                <button
                  v-if="row.hasLogo"
                  type="button"
                  class="drow__logo-del"
                  title="删除LOGO"
                  @click="handleLogoDelete(row.code)"
                ><EdIcon name="close" :size="11" /></button>
              </div>

              <span class="drow__name">{{ row.name }}</span>
              <span v-for="f in currentTable.fields.filter(f => f.key !== 'name')" :key="f.key" class="drow__cell ed-meta">
                <span v-if="f.type === 'color'" class="color-dot" :style="{ background: row[f.key] }"></span>
                <template v-else>{{ f.label }}：{{ row[f.key] ?? '—' }}</template>
              </span>

              <span class="drow__ops">
                <button type="button" class="icon-btn" title="编辑" @click="startEdit(row)">
                  <EdIcon name="edit" :size="14" />
                </button>
                <button type="button" class="icon-btn icon-btn--danger" title="删除" @click="deleteRow(row)">
                  <EdIcon name="trash" :size="14" />
                </button>
              </span>
            </div>

            <!-- 编辑 -->
            <div v-else class="sd-edit">
              <template v-for="f in currentTable.fields" :key="f.key">
                <div v-if="f.type === 'color'" class="color-field">
                  <span class="color-field__box" :style="{ background: editForm[f.key] || 'transparent' }"></span>
                  <EdField
                    :model-value="editForm[f.key]"
                    @update:model-value="editForm[f.key] = normHex($event)"
                    :label="f.label"
                    placeholder="#RRGGBB"
                  />
                </div>
                <EdField
                  v-else
                  v-model="editForm[f.key]"
                  :label="f.label"
                  :disabled="f.readonly"
                />
              </template>
              <div class="sd-edit__actions">
                <EdButton variant="text" @click="cancelEdit">取消</EdButton>
                <EdButton variant="solid" @click="saveEdit">保存</EdButton>
              </div>
            </div>
          </div>

          <div v-if="!dataLoading && tableData.length === 0 && !adding" class="sd-empty">
            <p class="sd-empty__line">暂无数据</p>
            <hr class="ed-rule">
          </div>
        </template>
      </template>
    </div>

    <template #footer>
      <EdButton variant="text" @click="emit('close')">关闭</EdButton>
      <EdButton
        v-if="activeTab === 'model'"
        variant="solid"
        :loading="saving"
        :disabled="loading"
        @click="handleSave"
      >保存</EdButton>
    </template>
  </EdDialog>

  <!-- 确认弹窗 -->
  <EdDialog
    v-if="confirmState"
    :title="confirmState.kind === 'warning' ? '请确认操作' : '删除确认'"
    :width="420"
    @close="answerConfirm(false)"
  >
    <div :class="['note', { 'note--danger': confirmState.kind !== 'warning' }]">
      <EdIcon
        v-if="confirmState.kind === 'warning'"
        name="warning"
        :size="13"
        class="sd-confirm-icon"
      />
      <EdIcon
        v-else
        name="trash"
        :size="13"
        class="sd-confirm-icon"
      />
      <span>{{ confirmState.msg }}</span>
    </div>
    <template #footer>
      <EdButton variant="text" @click="answerConfirm(false)">取消</EdButton>
      <EdButton variant="solid" @click="answerConfirm(true)">
        {{ confirmState.kind === 'warning' ? '确定清理' : '删除' }}
      </EdButton>
    </template>
  </EdDialog>
</template>

<style scoped>
.sd-tabs { margin-bottom: var(--ed-space-5); }

.sd-body { min-height: 200px; }
.sd-loading { position: relative; display: flex; align-items: center; gap: 10px; text-transform: none; padding: var(--ed-space-6) 0; }
.sd-loading::before { content: ''; width: 14px; height: 14px; flex: 0 0 14px; border: 1.5px solid var(--ed-accent); border-right-color: transparent; border-radius: 50%; animation: sd-loading-spin .85s linear infinite; }
@keyframes sd-loading-spin { to { transform: rotate(360deg); } }

.sd-group { margin-bottom: var(--ed-space-6); }
.sd-group__title {
  padding-bottom: var(--ed-space-2);
  border-bottom: 1px solid var(--ed-rule);
  margin-bottom: var(--ed-space-4);
}
.sd-field { margin-bottom: var(--ed-space-2); }

.pw-field { position: relative; }
.pw-field__eye {
  position: absolute;
  right: 0;
  bottom: var(--ed-space-2);
  display: flex;
  border: 0;
  background: transparent;
  color: var(--ed-ink-faint);
  cursor: pointer;
}
.pw-field__eye:hover { color: var(--ed-ink); }
.pw-field__clear {
  display: flex;
  align-items: center;
  gap: var(--ed-space-2);
  margin-top: var(--ed-space-2);
  color: var(--ed-ink-faint);
  font-size: 12px;
  cursor: pointer;
}
.pw-field__clear input { accent-color: var(--ed-accent); }

.sd-cleanup-stats { text-transform: none; margin-bottom: var(--ed-space-1); }
.sd-cleanup-note { text-transform: none; margin-bottom: var(--ed-space-4); }
.sd-cleanup-row {
  display: flex;
  align-items: center;
  gap: var(--ed-space-4);
  position: relative;
}

.sd-toolbar {
  display: flex;
  align-items: center;
  gap: var(--ed-space-4);
  margin-bottom: var(--ed-space-5);
  position: relative;
}

.menu-btn {
  display: flex;
  align-items: center;
  gap: var(--ed-space-2);
  height: 40px;
  padding: 0;
  border: 0;
  border-bottom: 1px solid var(--ed-rule);
  background: transparent;
  color: var(--ed-ink);
  font-size: 14px;
  cursor: pointer;
}
.menu-btn--wide { min-width: 140px; justify-content: space-between; }
.menu-btn svg { color: var(--ed-ink-faint); transition: transform var(--ed-fast) var(--ed-ease); }
.menu-btn svg.is-up { transform: rotate(180deg); }

.menu-pop {
  position: absolute;
  top: calc(100% + var(--ed-space-2));
  left: 0;
  z-index: 100;
  min-width: 150px;
  background: var(--ed-paper);
  border: 1px solid var(--ed-ink);
}
.menu-pop__item {
  display: block;
  width: 100%;
  text-align: left;
  padding: var(--ed-space-2) var(--ed-space-4);
  border: 0;
  border-left: 2px solid transparent;
  background: transparent;
  color: var(--ed-ink);
  font-size: 14px;
  cursor: pointer;
}
.menu-pop__item:hover { background: var(--ed-paper-deep); }
.menu-pop__item.is-selected { border-left-color: var(--ed-accent); font-weight: 600; }

.sd-edit {
  padding: var(--ed-space-4) 0;
  border-bottom: 1px solid var(--ed-rule-strong);
}
.sd-edit__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--ed-space-2);
  margin-top: var(--ed-space-3);
}

.drow { border-bottom: 1px solid var(--ed-rule); }
.drow__view {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--ed-space-4);
  padding: var(--ed-space-3) 0;
}
.drow__name {
  font-family: var(--ed-serif);
  font-size: 15px;
  color: var(--ed-ink);
}
.drow__cell { text-transform: none; }
.drow__ops { display: flex; gap: var(--ed-space-1); margin-left: auto; }

.icon-btn {
  display: flex;
  border: 0;
  background: transparent;
  color: var(--ed-ink-faint);
  cursor: pointer;
  padding: var(--ed-space-1);
}
.icon-btn:hover { color: var(--ed-ink); }
.icon-btn--danger:hover { color: var(--ed-danger); }

.drow__logo { display: flex; align-items: center; gap: var(--ed-space-2); }
.drow__logo-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  border: 1px solid var(--ed-rule);
}
.drow__logo-up {
  display: flex;
  color: var(--ed-ink-faint);
  cursor: pointer;
}
.drow__logo-up:hover { color: var(--ed-ink); }
.drow__logo-del {
  display: flex;
  border: 0;
  background: transparent;
  color: var(--ed-ink-faint);
  cursor: pointer;
  padding: 0;
}
.drow__logo-del:hover { color: var(--ed-danger); }

.color-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 1px solid var(--ed-rule-strong);
  margin-right: var(--ed-space-1);
  vertical-align: -1px;
}

.color-field {
  display: flex;
  align-items: flex-end;
  gap: var(--ed-space-3);
}
.color-field__box {
  width: 40px;
  height: 40px;
  border: 1px solid var(--ed-ink);
  flex-shrink: 0;
}

.sd-empty { padding: var(--ed-space-6) 0; }
.sd-empty__line {
  font-family: var(--ed-serif);
  text-align: center;
  margin-bottom: var(--ed-space-3);
}

.sd-confirm-icon { flex-shrink: 0; margin-top: 2px; }
</style>
