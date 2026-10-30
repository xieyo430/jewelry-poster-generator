<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import api from '../api'
import EdDialog from '../components/common/EdDialog.vue'
import EdIcon from '../components/common/EdIcon.vue'

const router = useRouter()
const activeFilter = ref('全部')
const searchQuery = ref('')
const searchOpen = ref(false)
const searchInput = ref(null)
const industriesExpanded = ref(false)
const projects = ref([])
const projectsLoading = ref(false)
const projectsError = ref('')
const selectedProject = ref(null)

const categories = [
  { key: 'jewelry', name: '珠宝首饰', group: '零售', description: '节日促销、品牌活动与活动礼遇', workflow: '节日主题 → 品牌 → 活动礼遇', live: true, tone: 'jewelry', icon: 'M12 3l7 6-7 12L5 9l7-6zM5 9h14M12 3l-2.5 6L12 21M12 3l2.5 6L12 21' },
  { key: 'food', name: '餐饮美食', group: '生活', description: '招牌菜、套餐促销与门店活动', workflow: '经营目标 → 菜品/套餐 → 到店行动', live: true, tone: 'food', icon: 'M7 3v7M7 10v11M5 3v4a2 2 0 0 0 4 0V3M16 3c1.5 1.5 2 4 2 7h-2v11' },
  { key: 'digital', name: '数码家电', group: '科技', description: '新品上市、焕新换购与导购内容', workflow: '创作目标 → 产品优惠 → 服务信息', live: true, tone: 'digital', icon: 'M4 5h16v11H4zM9 20h6M12 16v4' },
  { key: 'fashion', name: '服装服饰', group: '零售', description: '新品发布、换季和会员活动', live: false, tone: 'fashion', icon: 'M12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 6l-8 14h16L12 6z' },
  { key: 'beauty', name: '美妆护肤', group: '生活', description: '礼盒推广、种草和限时活动', live: false, tone: 'beauty', icon: 'M9 3h6v5l2 13H7l2-13V3zM9 8h6' },
  { key: 'education', name: '教育培训', group: '服务', description: '课程招生、公开课和活动通知', live: false, tone: 'education', icon: 'M12 4L2 9l10 5 10-5-10-5zM6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5' },
  { key: 'travel', name: '旅行出游', group: '生活', description: '路线推荐、酒店和节日营销', live: false, tone: 'travel', icon: 'M12 3a5 5 0 0 0-5 5c0 3 2 4 2 7h6c0-3-2-4-2-7a5 5 0 0 0-5-5zM10 19h4M10.5 16h3' },
  { key: 'estate', name: '房产家居', group: '服务', description: '开盘信息、家装和空间灵感', live: false, tone: 'estate', icon: 'M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6' },
]

const templates = {
  jewelry: [{ id: 'festival', label: '节日促销', detail: '节日主题与品牌活动礼遇' }, { id: 'brand-event', label: '品牌活动', detail: '新品、会员与门店活动' }, { id: 'gift', label: '活动礼遇', detail: '满赠、折扣与到店礼遇' }],
  food: [{ id: 'signature', label: '招牌菜推广', detail: '突出菜品卖点与到店尝鲜' }, { id: 'combo', label: '套餐促销', detail: '展示组合内容与活动价格' }, { id: 'store-event', label: '门店活动', detail: '满减、赠饮与消费规则' }],
  digital: [{ id: 'new-arrival', label: '新品上市', detail: '产品首发、参数与价格优势' }, { id: 'trade-in', label: '焕新换购', detail: '补贴、旧机换新与服务权益' }, { id: 'gift-set', label: '套装赠礼', detail: '组合产品、赠品与延保服务' }],
}
const filters = ['全部', '零售', '生活', '科技', '服务']
const filteredCategories = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  return categories.filter(item => {
    const matchesFilter = activeFilter.value === '全部' || item.group === activeFilter.value
    const matchesSearch = !query || [item.name, item.group, item.description, item.workflow].some(value => value.toLocaleLowerCase().includes(query))
    return matchesFilter && matchesSearch
  })
})
const visibleCategories = computed(() => industriesExpanded.value || searchQuery.value.trim() ? filteredCategories.value : filteredCategories.value.slice(0, 4))
const liveCategories = computed(() => categories.filter(item => item.live))
const industryPath = key => key === 'digital' ? 'electronics' : key
const projectIndustry = project => {
  if (project?.industry === 'electronics' || project?.materialType === 'electronics') return 'electronics'
  if (project?.industry === 'food' || project?.materialType === 'food') return 'food'
  return 'jewelry'
}
const openStudio = (category, template) => {
  if (!category.live) return
  router.push({ name: 'studio', query: { industry: industryPath(category.key), ...(template ? { template: template.id } : {}) } })
}
const findCategory = project => {
  const industry = projectIndustry(project)
  if (industry === 'food') return categories.find(item => item.key === 'food')
  if (industry === 'electronics') return categories.find(item => item.key === 'digital')
  const title = String(project?.title || '').toLowerCase()
  if (title.includes('餐饮') || title.includes('火锅') || title.includes('套餐')) return categories.find(item => item.key === 'food')
  if (title.includes('数码') || title.includes('家电') || title.includes('新品')) return categories.find(item => item.key === 'digital')
  return categories.find(item => item.key === 'jewelry')
}
const formatProjectDate = project => {
  const value = project?.updatedAt || project?.createdAt
  if (!value) return '已保存'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '已保存'
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}
const formatProjectRange = project => {
  const start = project?.startDate || ''
  const end = project?.endDate || ''
  if (start && end) return `${start} 至 ${end}`
  return start || end || '未填写日期'
}
const projectDisplayName = project => project?.brandName || project?.merchantName || '未填写'
const projectFocus = project => project?.focus || project?.theme || '未填写'
const openProjectDetails = project => { selectedProject.value = project }
const closeProjectDetails = () => { selectedProject.value = null }
const handleProjectKeydown = (event, project) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    openProjectDetails(project)
  }
}

const searchIndex = computed(() => {
  const categoryEntries = liveCategories.value.map(category => ({ id: `industry-${category.key}`, label: category.name, detail: `${category.group} · ${category.description}`, action: () => openStudio(category), terms: [category.name, category.group, category.description, category.workflow] }))
  const templateEntries = Object.entries(templates).flatMap(([key, items]) => {
    const category = categories.find(item => item.key === key)
    return items.map(template => ({ id: `template-${key}-${template.id}`, label: template.label, detail: `${category.name} · ${template.detail}`, action: () => openStudio(category, template), terms: [template.label, template.detail, category.name] }))
  })
  const projectEntries = projects.value.map(project => ({ id: `project-${project.id}`, label: project.title || project.brandName || '未命名项目', detail: [project.brandName, project.merchantName, project.focus, project.theme].filter(Boolean).join(' · ') || '已保存项目', action: () => openProjectDetails(project), terms: [project.title, project.brandName, project.merchantName, project.focus, project.theme, ...(project.keyValues || []).flat()] }))
  return [...categoryEntries, ...templateEntries, ...projectEntries]
})
const searchResults = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  if (!query) return searchIndex.value.slice(0, 8)
  return searchIndex.value.filter(item => item.terms.some(value => String(value || '').toLocaleLowerCase().includes(query))).slice(0, 10)
})
const openSearch = async () => { searchOpen.value = true; await nextTick(); searchInput.value?.focus() }
const closeSearch = () => { searchOpen.value = false }
const runSearch = () => { const result = searchResults.value[0]; if (!result) return; closeSearch(); result.action() }
const handleGlobalKeydown = event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearch() }
  else if (event.key === 'Escape' && searchOpen.value) closeSearch()
}
const clearIndustryFilters = () => { searchQuery.value = ''; activeFilter.value = '全部'; industriesExpanded.value = false }
const toggleIndustryList = () => { industriesExpanded.value = !industriesExpanded.value }

const loadProjects = async () => {
  projectsLoading.value = true
  projectsError.value = ''
  try { projects.value = (await api.listProjects()).data.projects || [] } catch (error) { projectsError.value = error.message || '最近项目加载失败'; console.error('加载最近项目失败:', error) } finally { projectsLoading.value = false }
}

onMounted(() => { loadProjects(); window.addEventListener('keydown', handleGlobalKeydown) })
onBeforeUnmount(() => window.removeEventListener('keydown', handleGlobalKeydown))
</script>

<template>
  <div class="home">
    <header class="home-header">
      <RouterLink to="/" class="home-logo"><span class="home-logo__mark">H</span><span>海报工坊</span></RouterLink>
      <div class="home-header__meta"><span class="home-label">CREATIVE WORKSPACE</span><button type="button" class="home-search-trigger" @click="openSearch"><EdIcon name="search" :size="15" /> 搜索 <kbd>⌘ K</kbd></button><RouterLink to="/studio" class="home-header__link">新建项目 <span>↗</span></RouterLink></div>
    </header>
    <main class="home-main">
      <section class="home-intro"><div><p class="home-kicker"><span /> POSTER DESIGN SYSTEM / 2026</p><h1>选择一个创作台，<br /><em>开始制作海报。</em></h1><p class="home-intro__desc">不同生意，使用不同的创作逻辑。先选择行业，再从适合的设计台开始。</p></div><div class="home-intro__aside"><strong>03</strong><span>已开放行业创作台</span><small>餐饮、数码与珠宝拥有独立流程</small></div></section>
      <section class="workspace-section" aria-labelledby="workspace-title"><div class="section-head"><div><p class="home-label">OPEN WORKSPACES</p><h2 id="workspace-title">行业创作台</h2></div><p>每个行业都从真实的经营信息开始，<br />直接进入对应的海报流程。</p></div><div class="workspace-grid"><article v-for="category in liveCategories" :key="category.key" :class="['workspace-card', `workspace-card--${category.tone}`]"><button type="button" class="workspace-card__main" @click="openStudio(category)"><span class="workspace-card__top"><span class="workspace-card__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path :d="category.icon" /></svg></span><span class="workspace-card__status">已开放 <b>↗</b></span></span><span class="workspace-card__body"><span class="workspace-card__group">{{ category.group }}</span><strong>{{ category.name }}</strong><span>{{ category.description }}</span></span><span class="workspace-card__flow">{{ category.workflow }}</span></button><div class="workspace-card__templates"><span class="workspace-card__templates-label">选择设计台</span><button v-for="template in templates[category.key]" :key="template.id" type="button" @click="openStudio(category, template)"><strong>{{ template.label }}</strong><small>{{ template.detail }}</small><b>→</b></button></div></article></div></section>
      <section class="recent-section" aria-labelledby="recent-title"><div class="section-head"><div><p class="home-label">RECENT PROJECTS</p><h2 id="recent-title">最近项目</h2></div><span class="section-head__count">{{ projects.length }} 个已保存项目</span></div><div v-if="projectsLoading" class="recent-empty">正在加载项目...</div><div v-else-if="projectsError" class="recent-empty"><strong>最近项目暂时不可用</strong><span>{{ projectsError }}</span><button type="button" class="recent-empty__retry" @click="loadProjects">重新加载</button></div><div v-else-if="!projects.length" class="recent-empty"><strong>还没有保存的项目</strong><span>从上面的行业创作台开始，完成后项目会出现在这里。</span></div><div v-else class="recent-table"><div class="recent-table__head"><span>项目</span><span>行业</span><span>品牌 / 商家</span><span>主题 / 产品</span><span>日期</span><span>已填写信息</span><span>详情</span></div><TransitionGroup name="recent-list" tag="div" class="recent-table__body"><button v-for="project in projects.slice(0, 6)" :key="project.id" class="recent-table__row" type="button" @click="openProjectDetails(project)" @keydown="handleProjectKeydown($event, project)"><span class="recent-table__project"><i class="recent-item__mark" :class="`recent-item__mark--${findCategory(project)?.tone || 'jewelry'}`" /><span><strong>{{ project.title || '未命名项目' }}</strong><small>{{ formatProjectDate(project) }}</small></span></span><span class="recent-table__industry"><i class="recent-table__industry-dot" :class="`recent-item__mark--${findCategory(project)?.tone || 'jewelry'}`" />{{ findCategory(project)?.name || '海报项目' }}</span><span>{{ projectDisplayName(project) }}</span><span>{{ projectFocus(project) }}</span><span>{{ formatProjectRange(project) }}</span><span class="recent-table__details"><b v-for="item in (project.keyValues || []).slice(0, 3)" :key="item[0]">{{ item[0] }}：{{ item[1] }}</b><b v-if="project.activityCount">活动：{{ project.activityCount }} 个</b><em v-if="!(project.keyValues || []).length && !project.activityCount">暂无补充信息</em></span><span class="recent-table__action" aria-label="查看项目详情" title="查看项目详情"><EdIcon name="chevron-right" :size="16" /></span></button></TransitionGroup></div></section>
      <section class="all-section" aria-labelledby="all-title"><div class="section-head"><div><p class="home-label">ALL INDUSTRIES</p><h2 id="all-title">全部行业</h2></div><p>已开放的创作台可以直接进入，<br />其他行业会持续补充。</p></div><div class="filter-line"><button v-for="filter in filters" :key="filter" type="button" :class="{ active: activeFilter === filter }" @click="activeFilter = filter">{{ filter }}</button></div><div v-if="visibleCategories.length" class="industry-grid"><component :is="category.live ? 'button' : 'div'" v-for="category in visibleCategories" :key="category.key" :class="['industry-item', { 'is-live': category.live }]" :type="category.live ? 'button' : undefined" @click="category.live && openStudio(category)"><span class="industry-item__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path :d="category.icon" /></svg></span><span><strong>{{ category.name }}</strong><small>{{ category.description }}</small></span><b>{{ category.live ? '进入创作' : '即将上线' }}</b></component></div><div v-else class="industry-no-results"><span>没有找到匹配的行业</span><button type="button" @click="clearIndustryFilters">清除筛选</button></div><button v-if="filteredCategories.length > 4 && !searchQuery.trim()" class="industry-toggle" type="button" @click="toggleIndustryList">{{ industriesExpanded ? '收起行业' : `查看全部行业（${filteredCategories.length}）` }}<EdIcon name="chevron-down" :size="15" /></button></section>
    </main>
    <div v-if="searchOpen" class="search-overlay" @click.self="closeSearch"><section class="search-dialog" role="dialog" aria-modal="true" aria-label="全局搜索"><div class="search-dialog__input"><EdIcon name="search" :size="18" /><input ref="searchInput" v-model="searchQuery" type="search" placeholder="搜索行业、设计台或项目..." @keydown.enter.prevent="runSearch" /><kbd>ESC</kbd></div><div class="search-dialog__results"><button v-for="result in searchResults" :key="result.id" type="button" class="search-result" @click="closeSearch(); result.action()"><span><strong>{{ result.label }}</strong><small>{{ result.detail }}</small></span><EdIcon name="chevron-right" :size="15" /></button><p v-if="!searchResults.length" class="search-dialog__empty">没有匹配结果</p></div><footer><span>输入关键词实时搜索</span><span>Enter 打开首个结果</span></footer></section></div>
    <footer class="home-footer"><span class="home-logo home-logo--footer"><span class="home-logo__mark">H</span><span>海报工坊</span></span><span>为每一种生意，建立合适的视觉入口。</span><span>2026</span><a class="home-footer__icp" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">桂ICP备2026023211号-1</a></footer>
    <EdDialog v-if="selectedProject" :title="selectedProject.title || '未命名项目'" :width="860" @close="closeProjectDetails">
      <div class="project-detail__meta"><span>{{ findCategory(selectedProject)?.name || '海报项目' }}</span><span>最近更新：{{ formatProjectDate(selectedProject) }}</span></div>
      <div class="project-detail__table"><div v-for="item in (selectedProject.details || [])" :key="item[0]" class="project-detail__row"><dt>{{ item[0] }}</dt><dd>{{ item[1] }}</dd></div><div v-if="!(selectedProject.details || []).length" class="project-detail__empty">这个项目没有可展示的详细资料。</div></div>
      <template #footer><button type="button" class="project-detail__close" @click="closeProjectDetails">关闭</button></template>
    </EdDialog>
  </div>
</template>

<style scoped>
.home { min-height: 100vh; background: var(--ed-canvas, #f7f8fa); color: var(--ed-ink, #17191c); }.home-header { height: 72px; padding: 0 48px; display: flex; align-items: center; justify-content: space-between; background: var(--ed-studio-dark, #171a1f); color: #fff; }.home-logo { display: inline-flex; align-items: center; gap: 10px; color: inherit; text-decoration: none; font-size: 16px; font-weight: 700; }.home-logo__mark { display: grid; place-items: center; width: 27px; height: 27px; border: 1px solid currentColor; border-radius: 7px; font: 700 13px Arial, sans-serif; }.home-header__meta { display: flex; align-items: center; gap: 30px; }.home-label, .home-kicker { color: var(--ed-ink-subtle, #8a919b); font: 10px var(--ed-mono); letter-spacing: .13em; }.home-header .home-label { color: #79818c; }.home-header__link { color: #fff; font-size: 12px; text-decoration: none; }.home-header__link span { margin-left: 7px; color: #9ca4af; }.home-main { max-width: 1280px; margin: 0 auto; padding: 72px 48px 100px; }.home-intro { display: flex; align-items: flex-end; justify-content: space-between; gap: 50px; padding-bottom: 68px; border-bottom: 1px solid var(--ed-hairline, #e1e5ea); }.home-kicker { display: flex; align-items: center; gap: 9px; }.home-kicker span { width: 22px; height: 1px; background: var(--ed-accent, #5567d9); }.home-intro h1 { margin-top: 20px; font: 700 clamp(38px, 5vw, 64px)/1.12 var(--ed-serif); }.home-intro h1 em { color: var(--ed-accent, #5567d9); font-style: normal; }.home-intro__desc { max-width: 440px; margin-top: 24px; color: var(--ed-ink-muted, #747c87); font-size: 14px; line-height: 1.8; }.home-intro__aside { min-width: 190px; padding-left: 24px; border-left: 1px solid var(--ed-hairline, #e1e5ea); }.home-intro__aside strong { display: block; font: 500 48px/1 var(--ed-mono); color: var(--ed-accent, #5567d9); }.home-intro__aside span, .home-intro__aside small { display: block; }.home-intro__aside span { margin-top: 12px; font-size: 13px; }.home-intro__aside small { margin-top: 5px; color: var(--ed-ink-muted, #747c87); font-size: 11px; line-height: 1.6; }.workspace-section, .recent-section, .all-section { padding-top: 64px; }.section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 30px; }.section-head h2 { margin-top: 10px; font-size: 26px; font-weight: 600; }.section-head > p, .section-head__count { color: var(--ed-ink-muted, #747c87); font-size: 12px; line-height: 1.7; text-align: right; }.section-head__count { font-family: var(--ed-mono); }.workspace-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 26px; }.workspace-card { overflow: hidden; border: 1px solid rgba(35,37,42,.12); border-radius: 14px; background: #fff; transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }.workspace-card:hover { transform: translateY(-4px); border-color: rgba(85,103,217,.35); box-shadow: 0 18px 44px rgba(31,39,58,.12); }.workspace-card__main { width: 100%; min-height: 255px; padding: 24px; display: flex; flex-direction: column; border: 0; color: #20242a; text-align: left; cursor: pointer; }.workspace-card--jewelry .workspace-card__main { background: #ece4d8; }.workspace-card--food .workspace-card__main { background: #f2d8cd; }.workspace-card--digital .workspace-card__main { background: #dce9f5; }.workspace-card__top, .workspace-card__status { display: flex; align-items: center; justify-content: space-between; }.workspace-card__icon { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 10px; background: rgba(255,255,255,.52); }.workspace-card__icon svg { width: 22px; height: 22px; }.workspace-card__status { gap: 10px; color: #58616c; font: 10px var(--ed-mono); letter-spacing: .08em; }.workspace-card__status b { color: var(--ed-accent, #5567d9); font: 19px Arial,sans-serif; }.workspace-card__body { display: flex; flex-direction: column; margin-top: auto; }.workspace-card__group { color: #747c87; font: 10px var(--ed-mono); letter-spacing: .1em; }.workspace-card__body strong { margin-top: 7px; font-size: 26px; }.workspace-card__body > span:last-child { margin-top: 7px; color: #5f6873; font-size: 12px; }.workspace-card__flow { display: block; margin-top: 24px; padding-top: 14px; border-top: 1px solid rgba(32,36,42,.14); color: #66707b; font: 10px var(--ed-mono); }.workspace-card__templates { padding: 17px 18px 18px; background: #fff; }.workspace-card__templates-label { display: block; margin-bottom: 8px; color: #89919b; font: 10px var(--ed-mono); letter-spacing: .1em; }.workspace-card__templates button { width: 100%; display: grid; grid-template-columns: 1fr auto; gap: 2px 10px; padding: 10px 0; border: 0; border-top: 1px solid #edf0f3; background: transparent; color: #252a31; text-align: left; cursor: pointer; }.workspace-card__templates button:first-of-type { border-top: 0; }.workspace-card__templates strong { font-size: 12px; }.workspace-card__templates small { color: #8a919b; font-size: 10px; }.workspace-card__templates b { grid-column: 2; grid-row: 1 / 3; align-self: center; color: var(--ed-accent, #5567d9); font: 16px Arial,sans-serif; }.workspace-card__templates button:hover strong { color: var(--ed-accent, #5567d9); }.recent-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 24px; }.recent-item { min-width: 0; display: flex; align-items: center; gap: 13px; padding: 15px 16px; border: 1px solid var(--ed-hairline, #e1e5ea); border-radius: 8px; background: #fff; color: inherit; text-decoration: none; transition: border-color 160ms ease, background 160ms ease; }.recent-item:hover { border-color: var(--ed-accent, #5567d9); background: #fbfbff; }.recent-item__mark { width: 8px; height: 42px; flex: 0 0 auto; border-radius: 4px; }.recent-item__mark--jewelry { background: #c89e67; }.recent-item__mark--food { background: #c8754d; }.recent-item__mark--digital { background: #1769e0; }.recent-item__content { min-width: 0; display: grid; gap: 4px; }.recent-item__content strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }.recent-item__content small { color: var(--ed-ink-muted, #747c87); font-size: 11px; }.recent-item__arrow { margin-left: auto; color: var(--ed-accent, #5567d9); font-size: 18px; }.recent-empty { min-height: 100px; margin-top: 24px; padding: 28px; display: flex; flex-direction: column; justify-content: center; gap: 6px; border: 1px dashed var(--ed-hairline, #e1e5ea); color: var(--ed-ink-muted, #747c87); font-size: 12px; }.recent-empty strong { color: var(--ed-ink, #17191c); font-size: 14px; }.filter-line { display: flex; gap: 8px; margin-top: 24px; padding-bottom: 12px; border-bottom: 1px solid var(--ed-hairline, #e1e5ea); }.filter-line button { padding: 8px 13px; border: 1px solid transparent; border-radius: 999px; background: transparent; color: var(--ed-ink-muted, #747c87); font-size: 12px; cursor: pointer; }.filter-line button:hover, .filter-line button.active { border-color: var(--ed-hairline, #e1e5ea); background: #fff; color: var(--ed-ink, #17191c); }.industry-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 16px; }.industry-item { min-width: 0; min-height: 92px; padding: 15px; display: flex; align-items: center; gap: 12px; border: 1px solid var(--ed-hairline, #e1e5ea); border-radius: 8px; background: #fff; color: var(--ed-ink, #17191c); text-align: left; }.industry-item.is-live { cursor: pointer; transition: transform 160ms ease, border-color 160ms ease; }.industry-item.is-live:hover { transform: translateY(-2px); border-color: var(--ed-accent, #5567d9); }.industry-item:not(.is-live) { opacity: .68; }.industry-item__icon { display: grid; place-items: center; width: 34px; height: 34px; flex: 0 0 auto; border-radius: 8px; background: #f1f3f6; color: #68717c; }.industry-item__icon svg { width: 18px; height: 18px; }.industry-item > span:nth-child(2) { min-width: 0; display: grid; gap: 4px; }.industry-item strong { font-size: 12px; }.industry-item small { overflow: hidden; color: var(--ed-ink-muted, #747c87); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }.industry-item > b { margin-left: auto; flex: 0 0 auto; color: var(--ed-accent, #5567d9); font: 10px var(--ed-mono); white-space: nowrap; }.industry-item:not(.is-live) > b { color: #9aa1ab; }.home-footer { max-width: 1184px; margin: 0 auto; padding: 24px 0 38px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; border-top: 1px solid var(--ed-hairline, #e1e5ea); color: var(--ed-ink-muted, #747c87); font-size: 11px; }.home-footer__icp { width: 100%; margin-top: 14px; text-align: center; color: var(--ed-ink-muted, #747c87); text-decoration: none; font-size: 11px; transition: color 160ms ease; }.home-footer__icp:hover { color: var(--ed-accent, #5567d9); }.home-logo--footer { color: var(--ed-ink, #17191c); font-size: 13px; }.home-logo--footer .home-logo__mark { width: 23px; height: 23px; }@media (max-width:980px) { .home-header { padding: 0 24px; }.home-main { padding: 54px 24px 80px; }.workspace-grid { grid-template-columns: 1fr; }.industry-grid { grid-template-columns: repeat(2, 1fr); } }@media (max-width:620px) { .home-header { height: 64px; }.home-header__meta .home-label { display: none; }.home-main { padding: 42px 18px 64px; }.home-intro { display: block; padding-bottom: 46px; }.home-intro h1 { font-size: 42px; }.home-intro__aside { margin-top: 36px; padding-left: 0; border-left: 0; }.section-head { display: block; }.section-head > p, .section-head__count { margin-top: 12px; text-align: left; }.recent-grid, .industry-grid { grid-template-columns: 1fr; }.filter-line { overflow-x: auto; }.home-footer { margin: 0 18px; flex-wrap: wrap; gap: 14px; }.home-footer > span:nth-child(2) { width: 100%; order: 3; }.home-footer__icp { order: 4; } }
.recent-empty__retry { align-self: flex-start; margin-top: 8px; padding: 7px 12px; border: 1px solid var(--ed-hairline, #e1e5ea); border-radius: 7px; background: #fff; color: var(--ed-ink, #17191c); cursor: pointer; }
.recent-empty__retry:hover { border-color: var(--ed-accent, #5567d9); color: var(--ed-accent, #5567d9); }
.recent-empty:not(:has(> strong)) { position: relative; }
.recent-empty:not(:has(> strong))::before { content: ''; width: 18px; height: 18px; margin-bottom: 8px; border: 2px solid color-mix(in srgb, var(--ed-accent, #5567d9) 24%, var(--ed-hairline, #e1e5ea)); border-right-color: var(--ed-accent, #5567d9); border-radius: 50%; animation: home-loading-spin .85s linear infinite; }
@keyframes home-loading-spin { to { transform: rotate(360deg); } }
.recent-list-enter-active, .recent-list-leave-active { transition: opacity 180ms ease, transform 180ms ease; }
.recent-list-enter-from, .recent-list-leave-to { opacity: 0; transform: translateY(6px); }
.recent-table { margin-top: 24px; overflow: hidden; border: 1px solid var(--ed-hairline, #e1e5ea); border-radius: 10px; background: #fff; }
.recent-table__head, .recent-table__row { display: grid; grid-template-columns: minmax(170px, 1.35fr) minmax(76px, .55fr) minmax(110px, .8fr) minmax(130px, 1fr) minmax(130px, .9fr) minmax(200px, 1.55fr) 24px; gap: 16px; align-items: center; }
.recent-table__head { min-height: 38px; padding: 0 18px; border-bottom: 1px solid var(--ed-hairline, #e1e5ea); background: var(--ed-surface-muted, #f1f3f6); color: var(--ed-ink-subtle, #9aa1ab); font: 10px var(--ed-mono); letter-spacing: .06em; }
.recent-table__body { display: grid; }
.recent-table__row { width: 100%; min-height: 82px; padding: 12px 18px; border: 0; border-bottom: 1px solid #edf0f3; background: #fff; color: var(--ed-ink, #17191c); font: inherit; font-size: 12px; text-align: left; text-decoration: none; cursor: pointer; transition: background 160ms ease, border-color 160ms ease; }
.recent-table__row:last-child { border-bottom: 0; }
.recent-table__row:hover { background: #fbfbff; border-color: color-mix(in srgb, var(--ed-accent, #5567d9) 28%, #edf0f3); }
.recent-table__project { display: flex; min-width: 0; align-items: center; gap: 10px; }
.recent-table__project > span { min-width: 0; display: grid; gap: 4px; }
.recent-table__project strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
.recent-table__project small, .recent-table__row > span:not(.recent-table__project) { color: var(--ed-ink-muted, #747c87); }
.recent-table__details { display: flex; min-width: 0; flex-wrap: wrap; gap: 5px 8px; }
.recent-table__details b { max-width: 100%; overflow: hidden; padding: 3px 6px; border-radius: 4px; background: var(--ed-surface-muted, #f1f3f6); color: var(--ed-ink-soft, #5f6873); font-size: 10px; font-weight: 400; text-overflow: ellipsis; white-space: nowrap; }
.recent-table__details em { color: var(--ed-ink-subtle, #9aa1ab); font-size: 10px; font-style: normal; }
.recent-table__arrow { color: var(--ed-accent, #5567d9) !important; font-size: 18px; text-align: right; }
.recent-table .recent-item__mark { width: 6px; height: 42px; }
@media (max-width: 980px) { .recent-table { overflow-x: auto; }.recent-table__head, .recent-table__row { min-width: 940px; } }
@media (max-width: 620px) { .recent-table { margin-top: 18px; }.recent-table__head, .recent-table__row { min-width: 840px; grid-template-columns: 160px 76px 110px 130px 120px 180px 24px; gap: 12px; }.recent-table__row { min-height: 76px; padding: 10px 14px; } }
.project-detail__meta { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 16px; color: var(--ed-ink-muted, #747c87); font-size: 12px; }
.project-detail__table { overflow: hidden; border: 1px solid var(--ed-hairline, #e1e5ea); border-radius: 8px; }
.project-detail__row { display: grid; grid-template-columns: 140px minmax(0, 1fr); gap: 18px; padding: 13px 16px; border-bottom: 1px solid #edf0f3; font-size: 13px; }
.project-detail__row:last-child { border-bottom: 0; }
.project-detail__row dt { color: var(--ed-ink-muted, #747c87); }
.project-detail__row dd { min-width: 0; margin: 0; color: var(--ed-ink, #17191c); white-space: pre-wrap; overflow-wrap: anywhere; }
.project-detail__empty { padding: 28px 16px; color: var(--ed-ink-muted, #747c87); text-align: center; }
.project-detail__close { padding: 8px 14px; border: 1px solid var(--ed-hairline, #e1e5ea); border-radius: 7px; background: #fff; color: var(--ed-ink, #17191c); cursor: pointer; }
.project-detail__close:hover { border-color: var(--ed-accent, #5567d9); color: var(--ed-accent, #5567d9); }
@media (max-width: 620px) { .project-detail__meta { display: grid; gap: 6px; }.project-detail__row { grid-template-columns: 100px minmax(0, 1fr); gap: 12px; padding: 11px 12px; } }

/* Recent projects: dense workspace rows with a quiet action affordance. */
.recent-table { overflow: visible; border: 0; background: transparent; }
.recent-table__head { min-height: 34px; padding: 0 18px 8px; border: 0; background: transparent; color: var(--ed-ink-subtle, #9aa1ab); font-size: 9px; letter-spacing: .1em; }
.recent-table__body { gap: 8px; }
.recent-table__row { min-height: 88px; padding: 14px 16px; border: 1px solid var(--ed-hairline, #e1e5ea); border-radius: 10px; background: #fff; box-shadow: 0 4px 14px rgba(31, 39, 58, .04); }
.recent-table__row:last-child { border-bottom: 1px solid var(--ed-hairline, #e1e5ea); }
.recent-table__row:hover { border-color: color-mix(in srgb, var(--ed-accent, #5567d9) 42%, #e1e5ea); background: #fff; box-shadow: 0 9px 24px rgba(31, 39, 58, .08); transform: translateY(-1px); }
.recent-table__row:focus-visible { outline: 2px solid var(--ed-accent, #5567d9); outline-offset: 3px; }
.recent-table__project { gap: 12px; }
.recent-table__project strong { font-size: 14px; font-weight: 650; }
.recent-table__project small { font: 9px var(--ed-mono); letter-spacing: .04em; }
.recent-table__industry { display: inline-flex; min-width: 0; align-items: center; gap: 7px; }
.recent-table__industry-dot { width: 7px; height: 7px; flex: 0 0 auto; border-radius: 50%; }
.recent-table__row > span:not(.recent-table__project):not(.recent-table__details):not(.recent-table__action) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.recent-table__details { align-content: center; }
.recent-table__details b { border: 1px solid #edf0f3; background: #f7f8fa; }
.recent-table__action { display: grid; place-items: center; width: 30px; height: 30px; justify-self: end; border: 1px solid var(--ed-hairline, #e1e5ea); border-radius: 50%; color: var(--ed-ink-muted, #747c87); transition: color 160ms ease, border-color 160ms ease, background 160ms ease; }
.recent-table__row:hover .recent-table__action { border-color: var(--ed-accent, #5567d9); background: var(--ed-accent, #5567d9); color: #fff; }
.project-detail__meta { margin: -4px 0 18px; }
.project-detail__meta span:first-child { display: inline-flex; align-items: center; gap: 7px; color: var(--ed-ink, #17191c); font-weight: 600; }
.project-detail__meta span:first-child::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--ed-accent, #5567d9); }
.project-detail__table { border: 0; border-radius: 0; background: #f7f8fa; }
.project-detail__row { grid-template-columns: 136px minmax(0, 1fr); padding: 12px 14px; border: 1px solid #e9ecf0; border-bottom: 0; background: #fff; }
.project-detail__row:first-child { border-radius: 8px 8px 0 0; }
.project-detail__row:last-child { border-bottom: 1px solid #e9ecf0; border-radius: 0 0 8px 8px; }
.project-detail__row dt { font: 10px var(--ed-mono); letter-spacing: .04em; }
.project-detail__row dd { font-size: 13px; line-height: 1.6; }
@media (max-width: 980px) { .recent-table { overflow-x: auto; padding-bottom: 4px; }.recent-table__head, .recent-table__row { min-width: 940px; } }
@media (max-width: 620px) { .recent-table__head, .recent-table__row { min-width: 840px; }.recent-table__row { min-height: 82px; padding: 12px 14px; } }
</style>

<style>
.home-search-trigger{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid #3a4049;border-radius:6px;background:#20252c;color:#fff;font-size:11px;cursor:pointer}.home-search-trigger kbd{color:#9ca4af;font:10px var(--ed-mono)}
.industry-toggle{display:flex;align-items:center;gap:7px;margin:20px auto 0;padding:8px 12px;border:1px solid var(--ed-hairline,#e1e5ea);border-radius:7px;background:#fff;color:var(--ed-ink-muted,#747c87);font-size:11px;cursor:pointer}.industry-no-results{display:flex;align-items:center;justify-content:space-between;margin-top:16px;padding:18px;border:1px dashed var(--ed-hairline,#e1e5ea);color:var(--ed-ink-muted,#747c87);font-size:12px}.industry-no-results button{padding:6px 10px;border:1px solid var(--ed-hairline,#e1e5ea);border-radius:6px;background:#fff;color:var(--ed-ink,#17191c);cursor:pointer}
.search-overlay{position:fixed;inset:0;z-index:100;background:rgba(23,26,31,.45);display:flex;justify-content:center;align-items:flex-start;padding-top:12vh}.search-dialog{width:min(620px,calc(100vw - 32px));overflow:hidden;border-radius:10px;background:#fff;box-shadow:0 20px 60px rgba(0,0,0,.22)}.search-dialog__input{display:flex;align-items:center;gap:10px;padding:16px 18px;border-bottom:1px solid #e7e9ed}.search-dialog__input input{min-width:0;flex:1;border:0;outline:0;color:#17191c;font-size:15px}.search-dialog__input kbd{color:#9aa1ab;font:10px var(--ed-mono)}.search-dialog__results{max-height:420px;overflow:auto;padding:8px}.search-result{width:100%;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px;border:0;border-radius:7px;background:transparent;text-align:left;cursor:pointer}.search-result:hover{background:#f4f5f7}.search-result span{min-width:0;display:grid;gap:4px}.search-result strong{font-size:13px}.search-result small{overflow:hidden;color:#7b838e;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.search-dialog__empty{padding:28px 12px;color:#7b838e;font-size:12px}.search-dialog footer{display:flex;justify-content:space-between;padding:11px 16px;border-top:1px solid #eef0f3;color:#9aa1ab;font-size:10px}
</style>
