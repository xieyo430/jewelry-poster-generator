<script setup>
import { onMounted, watch, ref, computed, nextTick } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { usePosterStore } from '../store/poster'
import { deriveThemePalette, applyPalette, resetPalette } from '../utils/color'
import { useToast } from '../composables/useToast'
import api from '../api'
import EdIcon from '../components/common/EdIcon.vue'
import StepTabs from '../components/common/StepTabs.vue'
import MarginNotes from '../components/common/MarginNotes.vue'
import Step1FestivalBrand from '../components/steps/Step1FestivalBrand.vue'
import Step2Promotions from '../components/steps/Step2Promotions.vue'
import Step3Activities from '../components/steps/Step3Activities.vue'
import PosterPreview from '../components/PosterPreview.vue'
import ThemePosterPreview from '../components/ThemePosterPreview.vue'
import SettingsDialog from '../components/common/SettingsDialog.vue'
import WelcomeDialog from '../components/common/WelcomeDialog.vue'
import HelpDrawer from '../components/common/HelpDrawer.vue'
import FoodStudio from '../components/food/FoodStudio.vue'
import ElectronicsStudio from '../components/electronics/ElectronicsStudio.vue'

const showSettings = ref(false)
const showWelcome = ref(false)
const showHelp = ref(false)
const projectListFocus = ref(false)
const route = useRoute()
const router = useRouter()

const store = usePosterStore()
const toast = useToast()
const dataLoading = ref(true)
const projects = ref([])
const projectsLoading = ref(false)
const projectsError = ref('')
const projectIndustry = project => {
  if (project?.industry === 'electronics' || project?.materialType === 'electronics') return 'electronics'
  if (project?.industry === 'food' || project?.materialType === 'food') return 'food'
  const title = String(project?.title || '').toLowerCase()
  if (title.includes('餐饮') || title.includes('火锅') || title.includes('套餐')) return 'food'
  if (title.includes('数码') || title.includes('家电') || title.includes('新品')) return 'electronics'
  return 'jewelry'
}
const formatProjectDate = project => {
  const value = project?.updatedAt || project?.createdAt
  if (!value) return '已保存'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '已保存'
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}
const activeFestival = computed(() => store.festivals.find(f => f.id === store.festival) || null)
const projectTitle = computed(() => store.projectTitle || store.suggestedProjectTitle)
const saveStatus = computed(() => {
  const status = store.projectStatus || (store.projectSaved ? 'saved' : 'draft')
  return ({ draft: '尚未保存', saving: '保存中…', saved: '项目已保存', error: '保存失败' })[status] || '尚未保存'
})

const ELECTRONICS_TEMPLATE_GOAL = {
  'new-arrival': '新品直降',
  'trade-in': '以旧换新',
  'gift-set': '套装赠礼',
}

const applyStartTemplate = (industry, template) => {
  if (!template) return
  if (industry === 'food' && ['signature', 'combo', 'store-event'].includes(template)) {
    store.foodCampaign.mode = template
  } else if (industry === 'electronics' && ELECTRONICS_TEMPLATE_GOAL[template]) {
    store.electronicsCampaign.promotionType = ELECTRONICS_TEMPLATE_GOAL[template]
  }
}

onMounted(async () => {
  const projectId = route.query.projectId || route.query.project
  const requestedIndustry = route.query.industry === 'food'
    ? 'food'
    : route.query.industry === 'electronics'
      ? 'electronics'
      : 'jewelry'
  const restoringDraft = route.query.regenerate === '1'

  if (projectId) store.$reset()
  else if (!restoringDraft) store.resetAll()
  store.generating = false
  store.generateError = null
  if (!projectId && !restoringDraft) {
    store.industry = requestedIndustry
    applyStartTemplate(requestedIndustry, route.query.template)
  }
  resetPalette()
  await store.loadStaticData()
  await loadProjects()
  if (projectId) {
    await loadProject({ id: projectId, title: '' })
  }
  dataLoading.value = false
  // landing-page entry points:
  //  welcome=0 → straight into the editor; guide=1 → open help; focus=projects → highlight recent list
  showWelcome.value = route.query.welcome !== '0' && localStorage.getItem('haibao_welcome_v2_skip') !== '1'
  if (route.query.guide === '1') { showWelcome.value = false; showHelp.value = true }
  if (route.query.focus === 'projects') {
    projectListFocus.value = true
    window.setTimeout(() => { projectListFocus.value = false }, 2200)
  }
})

watch(() => store.projectStatus, (status) => { if (status === 'saved') loadProjects() })

watch(() => [
  store.industry,
  store.customBrandName,
  store.festival,
  store.brand,
  store.startDate,
  store.endDate,
  store.theme,
  store.subtitle,
  store.mainPromotion,
  store.secondaryPromotion,
  store.activities,
  store.merchantInfo,
  store.foodCampaign,
  store.electronicsCampaign,
], () => {
  if (store.projectId && store.projectStatus !== 'saving') {
    store.projectSaved = false
    store.projectStatus = 'draft'
  }
}, { deep: true })

// Dynamic color: when festival changes, update CSS variables
watch(() => store.festival, (id) => {
  if (!id) { resetPalette(); return }
  const f = store.festivals.find(f => f.id === id)
  if (f?.primaryColor) {
    applyPalette(deriveThemePalette(f))
  }
}, { immediate: true })

// Re-apply palette after festivals load (fixes reload issue)
watch(() => store.festivals, () => {
  if (store.festival) {
    const f = store.festivals.find(f => f.id === store.festival)
    if (f?.primaryColor) applyPalette(deriveThemePalette(f))
  }
})

const loadProjects = async () => {
  projectsLoading.value = true
  projectsError.value = ''
  try {
    const res = await api.listProjects()
    projects.value = res.data.projects || []
  } catch (error) {
    projectsError.value = error.message || '项目列表加载失败'
    console.error('加载项目列表失败:', error)
  } finally {
    projectsLoading.value = false
  }
}

const loadProject = async (project) => {
  try {
    const res = await api.loadProject(project.id)
    const data = res.data?.data || {}
    let rawData = {}
    let rawDataBroken = false
    if (typeof data.raw_data === 'string') {
      try { rawData = JSON.parse(data.raw_data || '{}') } catch { rawData = {}; rawDataBroken = true }
    } else if (data.raw_data && typeof data.raw_data === 'object') {
      rawData = data.raw_data
    }
    if (rawDataBroken) toast.error('项目的本地存档已损坏，已恢复服务端保存的内容')
    const foodCampaign = rawData.foodCampaign || {}
    const hasLegacyFoodData = Boolean(
      rawData.customBrandName
      || foodCampaign.dishName
      || foodCampaign.setContents
      || foodCampaign.eventRule
      || foodCampaign.mode === 'combo'
      || foodCampaign.mode === 'store-event'
    )
    const savedIndustry = rawData.industry
      || data.industry
      || (data.material_type === 'food' || hasLegacyFoodData ? 'food' : 'jewelry')
    // 只恢复业务字段：raw_data 是服务端存档，不能整包 $patch 进内部状态
    const RESTORE_KEYS = [
      'materialType', 'carStickerSize', 'carStickerText', 'customBrandName',
      'electronicsCampaign', 'foodCampaign', 'brand', 'startDate', 'endDate',
      'theme', 'subtitle', 'mainPromotion', 'secondaryPromotion',
      'merchantInfo', 'selectedMerchantTemplateId',
    ]
    const picked = Object.fromEntries(RESTORE_KEYS.filter(k => k in rawData).map(k => [k, rawData[k]]))
    store.$patch({
      ...picked,
      industry: savedIndustry,
      festival: ['food', 'electronics'].includes(savedIndustry) ? null : (rawData.festival ?? data.festival_code ?? null),
      projectId: project.id,
      projectTitle: data.title || project.title,
      projectSaved: true,
      projectStatus: 'draft',
      saveError: null,
      frontPosterUrl: data.front_poster_url || null,
      backPosterUrl: data.back_poster_url || null,
      backBgImageUrl: data.back_bg_url || null,
      carStickerUrl: data.car_sticker_url || null,
      activities: data.activities || rawData.activities || [],
      currentStep: 3,
    })
    store.setStep(3)
    await nextTick()
    store.projectStatus = 'saved'
  } catch (error) {
    console.error('项目加载失败:', error)
    toast.error('项目加载失败：' + (error.message || '网络错误'))
  }
}
const isFood = computed(() => store.industry === 'food')
const isElectronics = computed(() => store.industry === 'electronics')
const steps = computed(() => isFood.value ? [
  { num: 1, label: '创作目标', desc: '选择餐饮经营目标' },
  { num: 2, label: '菜品与促销', desc: '填写菜品、套餐和优惠' },
  { num: 3, label: '门店与生成', desc: '补充门店信息并生成' },
] : isElectronics.value ? [
  { num: 1, label: '品牌与目标', desc: '确定数码创作方向' },
  { num: 2, label: '产品与优惠', desc: '填写产品卖点和价格' },
  { num: 3, label: '门店与生成', desc: '补充服务信息并生成' },
] : [
  { num: 1, label: '节日与品牌', desc: '选择主题和品牌' },
  { num: 2, label: '正面推广', desc: '设置爆点活动' },
  { num: 3, label: '反面活动', desc: '添加详细活动' },
])

const showingResult = computed(() => !!(store.frontPosterUrl || store.carStickerUrl))

const startFromWelcome = () => {
  showWelcome.value = false
  store.setStep(1)
  window.setTimeout(() => document.querySelector('.studio-form input, .studio-form button')?.focus(), 80)
}

const goToHelpStep = (step) => {
  showHelp.value = false
  store.setStep(step)
  window.setTimeout(() => document.querySelector('.studio-form input, .studio-form button')?.focus(), 80)
}

const startNewProject = () => {
  const { industry } = store
  store.resetAll()
  if (route.query.projectId || route.query.project) {
    router.replace({ name: 'studio', query: { industry } })
  }
}
</script>
<template>
  <div class="studio-app">
    <aside class="studio-sidebar">
      <RouterLink to="/" class="studio-brand"><span class="studio-brand__mark">H</span><span>海报工坊</span></RouterLink>
      <div class="studio-sidebar__section"><span class="studio-label">WORKSPACE</span><RouterLink to="/" class="studio-nav is-active"><EdIcon name="sparkle" :size="16" /> 创作工作台</RouterLink><button class="studio-nav" type="button" @click="showWelcome = true"><EdIcon name="help" :size="16" /> 使用指南</button></div>
      <div class="studio-sidebar__section"><span class="studio-label">PROJECT</span><div class="studio-project"><span class="studio-project__dot" /><div><b>{{ projectTitle }}</b><small>{{ saveStatus }}</small></div></div><button class="studio-nav studio-nav--muted" type="button" @click="startNewProject"><EdIcon name="refresh" :size="16" /> 新建项目</button><div :class="['project-list', { 'project-list--focus': projectListFocus }]"><span v-if="projectsLoading" class="project-list__empty">正在加载项目…</span><button v-else-if="projectsError" class="project-list__empty project-list__retry" type="button" @click="loadProjects">加载失败，点击重试</button><span v-else-if="!projects.length" class="project-list__empty">暂无已保存项目</span><template v-else><RouterLink v-for="project in projects.slice(0, 6)" :key="project.id" class="project-list__item" :to="{ name: 'studio', query: { projectId: project.id, industry: projectIndustry(project) } }"><strong>{{ project.title || '未命名项目' }}</strong><small>{{ formatProjectDate(project) }}</small></RouterLink></template></div></div>
      <div class="studio-sidebar__bottom"><button class="studio-nav studio-nav--muted" type="button" @click="showSettings = true"><EdIcon name="gear" :size="16" /> 设置</button><RouterLink to="/" class="studio-back">← 返回首页</RouterLink></div>
    </aside>
    <div class="studio-main">
      <header class="studio-topbar"><div><span class="studio-label">CREATIVE WORKSPACE</span><h1>{{ isFood ? '餐饮海报创作台' : isElectronics ? '数码家电创作台' : '珠宝海报创作台' }}</h1></div><div class="studio-topbar__right"><span v-if="activeFestival" class="theme-status"><i :style="{ background: activeFestival.primaryColor }" /> {{ activeFestival.name }}主题已激活</span><span :class="['save-status', `save-status--${store.projectStatus || (store.projectSaved ? 'saved' : 'draft')}`]"><i /> {{ saveStatus }}</span><button class="icon-action" type="button" title="当前步骤帮助" @click="showHelp = true"><EdIcon name="help" :size="17" /></button><button class="icon-action" type="button" title="设置" @click="showSettings = true"><EdIcon name="gear" :size="17" /></button></div></header>
      <main class="studio-content">
        <div v-if="dataLoading" class="studio-loading"><div class="loading-block loading-block--large" /></div>
        <template v-else>
          <section class="studio-intro"><div><p class="studio-label">{{ isFood ? 'FOOD CREATIVE SYSTEM' : isElectronics ? 'DIGITAL CREATIVE SYSTEM' : 'JEWELRY CREATIVE SYSTEM' }} / {{ String(store.currentStep).padStart(2, '0') }}</p><h2>{{ isFood ? '把一桌好味道，' : isElectronics ? '把产品优势，' : '把你的活动，' }}<br /><em>{{ isFood ? '变成想吃的海报。' : isElectronics ? '变成清晰的购买理由。' : '变成视觉。' }}</em></h2></div><p>{{ isFood ? '从菜品、套餐和门店行动开始，' : isElectronics ? '从产品、参数和优惠机制开始，' : '从节日、品牌和活动信息开始，' }}<br />AI 会协助你完成一张完整海报。</p></section>
          <StepTabs :steps="steps" :current="store.currentStep" @step-change="store.setStep" />
          <Transition name="studio-step" mode="out-in">
            <div v-if="!showingResult" :key="store.industry" class="studio-workgrid"><section class="studio-form"><FoodStudio v-if="isFood" /><ElectronicsStudio v-else-if="isElectronics" /><template v-else><Step1FestivalBrand v-if="store.currentStep === 1" /><Step2Promotions v-else-if="store.currentStep === 2" /><Step3Activities v-else /></template></section><aside class="studio-aside"><ThemePosterPreview /><MarginNotes /></aside></div>
            <PosterPreview v-else key="result" />
          </Transition>
        </template>
      </main>
    </div>
    <SettingsDialog v-if="showSettings" @close="showSettings = false" />
    <WelcomeDialog v-if="showWelcome" @close="showWelcome = false" @start="startFromWelcome" />
    <HelpDrawer v-if="showHelp" :step="store.currentStep" @close="showHelp = false" @go-step="goToHelpStep" />
  </div>
</template><style scoped>
.studio-app{min-height:100vh;background:#f5f6f8;color:#1c2026}.studio-sidebar{position:fixed;inset:0 auto 0 0;z-index:10;width:238px;padding:28px 18px;display:flex;flex-direction:column;background:#171a1f;color:#fff}.studio-brand{display:flex;align-items:center;gap:10px;padding:0 12px;color:#fff;text-decoration:none;font-size:16px;font-weight:700}.studio-brand__mark{display:grid;place-items:center;width:27px;height:27px;border:1px solid #fff;border-radius:8px;font:bold 13px Arial}.studio-sidebar__section{margin-top:52px}.studio-sidebar__section+.studio-sidebar__section{margin-top:34px}.studio-label{color:#8a929e;font:10px var(--ed-mono);letter-spacing:.13em}.studio-nav{width:100%;margin-top:12px;padding:10px 12px;display:flex;align-items:center;gap:10px;border:0;border-radius:7px;background:transparent;color:#aeb5c0;text-align:left;font-size:13px;cursor:pointer;text-decoration:none}.studio-nav:hover,.studio-nav.is-active{background:#2b3038;color:#fff}.studio-nav--muted{margin-top:8px}.studio-project{display:flex;align-items:center;gap:10px;margin:15px 10px;color:#e9ebef}.studio-project__dot{width:8px;height:8px;border-radius:50%;background:#7184ff}.studio-project b,.studio-project small{display:block}.studio-project b{font-size:13px;font-weight:500}.studio-project small{margin-top:3px;color:#737b87;font-size:10px}.studio-sidebar__bottom{margin-top:auto}.studio-back{display:block;margin:14px 12px;color:#818995;text-decoration:none;font-size:12px}.studio-main{width:calc(100% - 238px);margin-left:238px}.studio-topbar{height:88px;padding:0 52px;display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #e3e6eb}.studio-topbar h1{margin-top:5px;font-size:18px;font-weight:600}.studio-topbar__right{display:flex;align-items:center;gap:16px}.save-status{color:#828a95;font-size:11px}.save-status i{display:inline-block;width:6px;height:6px;margin-right:6px;border-radius:50%;background:#54a77a}.icon-action{display:grid;place-items:center;width:32px;height:32px;border:1px solid #e0e3e8;border-radius:7px;background:#fff;color:#737b86;cursor:pointer}.studio-content{max-width:1240px;margin:auto;padding:45px 52px 80px}.studio-intro{display:flex;align-items:end;justify-content:space-between;margin-bottom:40px}.studio-intro h2{margin-top:15px;font-size:40px;line-height:1.18}.studio-intro h2 em{font-style:normal;color:#5567d9}.studio-intro>p{color:#7c8490;font-size:13px;line-height:1.8;text-align:right}.studio-workgrid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:40px;margin-top:35px}.studio-form{min-width:0}.studio-aside{position:sticky;top:112px;align-self:start;min-width:0}.studio-loading{max-width:700px}.loading-block{height:16px;margin-bottom:18px;background:#e4e7ec;border-radius:4px}.loading-block--large{height:220px}@media(max-width:1000px){.studio-sidebar{width:72px;padding:25px 10px}.studio-brand span:last-child,.studio-sidebar .studio-label,.studio-nav:not(.is-active) span,.studio-nav{font-size:0}.studio-brand{padding:0;justify-content:center}.studio-main{width:calc(100% - 72px);margin-left:72px}.studio-topbar{padding:0 28px}.studio-content{padding:35px 28px}}@media(max-width:720px){.studio-intro{display:block}.studio-intro>p{text-align:left;margin-top:18px}.studio-workgrid{display:block}.studio-aside{display:none}.studio-content{padding:28px 18px}.studio-topbar{height:76px;padding:0 18px}.save-status{display:none}}.studio-app {
  position: relative;
  isolation: isolate;
  background:
    radial-gradient(circle at 88% -8%, var(--theme-glow), transparent 34%),
    radial-gradient(circle at 42% 100%, var(--theme-glow-secondary), transparent 27%),
    var(--theme-wash);
  transition: background 480ms var(--ed-ease), color 240ms var(--ed-ease);
}
.studio-app::before {
  content: '';
  position: fixed;
  inset: 0 0 0 auto;
  z-index: -1;
  width: min(44vw, 620px);
  pointer-events: none;
  background: linear-gradient(145deg, transparent 0 35%, color-mix(in srgb, var(--theme-primary) 3%, transparent));
  transition: background 480ms var(--ed-ease);
}
.studio-sidebar {
  background:
    radial-gradient(circle at 18% 0%, color-mix(in srgb, var(--theme-secondary) 24%, transparent), transparent 32%),
    linear-gradient(180deg, var(--theme-deep) 0%, color-mix(in srgb, var(--theme-deep) 82%, #090D13) 100%);
  border-right: 1px solid color-mix(in srgb, var(--theme-secondary) 22%, transparent);
  transition: background 480ms var(--ed-ease), border-color 240ms var(--ed-ease);
}
.studio-brand__mark {
  border-color: var(--theme-secondary);
  color: var(--theme-secondary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--theme-secondary) 9%, transparent);
  transition: color 240ms var(--ed-ease), border-color 240ms var(--ed-ease), box-shadow 240ms var(--ed-ease);
}
.studio-nav:hover {
  background: color-mix(in srgb, var(--theme-primary) 18%, transparent);
  color: #fff;
}
.studio-nav.is-active {
  background: var(--theme-primary);
  color: var(--theme-on-primary);
  box-shadow: 0 10px 24px color-mix(in srgb, var(--theme-primary) 26%, transparent);
}
.studio-project__dot { background: var(--theme-secondary); box-shadow: 0 0 0 4px color-mix(in srgb, var(--theme-secondary) 15%, transparent); }
.studio-topbar {
  background: color-mix(in srgb, var(--theme-surface) 91%, transparent);
  border-bottom-color: color-mix(in srgb, var(--theme-primary) 16%, #e3e6eb);
  backdrop-filter: blur(18px);
  transition: background 480ms var(--ed-ease), border-color 240ms var(--ed-ease);
}
.studio-aside {
  max-height: none;
  overflow: visible;
  scrollbar-width: none;
}
.studio-aside::-webkit-scrollbar { display: none; }
.studio-step-enter-active,
.studio-step-leave-active { transition: opacity 180ms ease, transform 180ms ease; }
.studio-step-enter-from { opacity: 0; transform: translateY(8px); }
.studio-step-leave-to { opacity: 0; transform: translateY(-5px); }
.project-list__retry { width: 100%; border: 0; background: transparent; color: #c5cbd4; text-align: left; cursor: pointer; }
.project-list__retry:hover { color: #fff; }
.studio-workgrid { grid-template-columns: minmax(0, 1fr) 300px; gap: 28px; }
.studio-aside { max-height: calc(100vh - 132px); overflow-y: auto; padding-right: 4px; }
.studio-intro h2 em { color: var(--theme-primary); transition: color 240ms var(--ed-ease); }
.studio-progress { border-bottom-color: var(--theme-border); }
.form-context b { color: var(--theme-primary); }
.aside-card,
.theme-preview,
.notes {
  background: color-mix(in srgb, var(--theme-surface) 94%, transparent);
  border-color: color-mix(in srgb, var(--theme-primary) 15%, #e2e5e9);
  box-shadow: 0 18px 52px color-mix(in srgb, var(--theme-primary) 9%, transparent);
}
.icon-action {
  border-color: color-mix(in srgb, var(--theme-primary) 18%, #e0e3e8);
  background: color-mix(in srgb, var(--theme-surface) 94%, transparent);
}
.icon-action:hover { color: var(--theme-primary); border-color: var(--theme-border); background: var(--theme-soft); }
.loading-block { position: relative; overflow: hidden; background: color-mix(in srgb, var(--theme-soft) 76%, #fff); border: 1px solid color-mix(in srgb, var(--theme-primary) 14%, #e4e7ec); }
.loading-block::after { content: ''; position: absolute; inset: 0 auto 0 -28%; width: 28%; background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--theme-primary) 30%, #fff), transparent); animation: studio-loading-sweep 1.35s ease-in-out infinite; }
.loading-block--large::before { content: ''; position: absolute; top: 50%; left: 50%; width: 28px; height: 28px; border: 2px solid color-mix(in srgb, var(--theme-primary) 25%, transparent); border-right-color: var(--theme-primary); border-radius: 50%; transform: translate(-50%, -50%); animation: studio-loading-spin .9s linear infinite; }
@keyframes studio-loading-sweep { to { left: 100%; } }
@keyframes studio-loading-spin { to { transform: translate(-50%, -50%) rotate(360deg); } }
.theme-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--theme-primary);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.theme-status i { width: 7px; height: 7px; border-radius: 50%; box-shadow: 0 0 0 4px color-mix(in srgb, var(--theme-primary) 14%, transparent); }

.project-list { display: grid; gap: 5px; margin: 14px 0 0 10px; max-height: 180px; overflow: auto; }
.project-list__item { display: grid; gap: 3px; padding: 8px 9px; border-radius: 6px; color: #aeb5c0; text-decoration: none; }
.project-list__item:hover, .project-list__item.router-link-active { background: #242930; color: #fff; }
.project-list__item strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; font-weight: 500; }
.project-list__item small, .project-list__empty { color: #737b87; font-size: 10px; }
.project-list__empty { padding: 7px 9px; }
.project-list--focus { border-radius: 8px; animation: project-list-focus 2.2s ease-out 1; }
@keyframes project-list-focus {
  0%, 60% { box-shadow: 0 0 0 2px var(--theme-primary), 0 0 0 7px color-mix(in srgb, var(--theme-primary) 18%, transparent); }
  100% { box-shadow: 0 0 0 0 transparent; }
}

@media (max-width: 720px) {
  .theme-status { display: none; }
}
</style>
