<script setup>
import { computed, ref, toRef } from 'vue'
import { usePosterStore } from '../../store/poster'
import { FESTIVAL_GROUPS, festivalGroupKey } from '../../data/festivalGroups'
import { useCopyOptions } from '../../composables/useCopyOptions'
import CopyOptionsPanel from '../common/CopyOptionsPanel.vue'
import EdSection from '../common/EdSection.vue'
import EdButton from '../common/EdButton.vue'
import EdMark from '../common/EdMark.vue'
import EdField from '../common/EdField.vue'
import EdDialog from '../common/EdDialog.vue'
import EdIcon from '../common/EdIcon.vue'
import CalendarRangePicker from '../common/CalendarRangePicker.vue'
import { ensureContrast, mixHex, readableOn } from '../../utils/color'
import { getIndustryTemplate } from '../../data/industryTemplates'

const store = usePosterStore()
const festivals = toRef(store, 'festivals')
const brands = toRef(store, 'brands')
const festival = toRef(store, 'festival')
const brand = toRef(store, 'brand')
const startDate = toRef(store, 'startDate')
const endDate = toRef(store, 'endDate')
const canStep1Next = computed(() => store.canStep1Next)
const industry = toRef(store, 'industry')
const customBrandName = toRef(store, 'customBrandName')
const industryTemplate = computed(() => getIndustryTemplate(industry.value))

const selectedFestival = (id) => { store.festival = id }
const selectedBrand = (id) => { store.brand = id }
const groupTabs = [{ key: 'all', label: '全部' }, ...FESTIVAL_GROUPS.map(g => ({ key: g.key, label: g.label }))]
const groupTab = ref('all')
const keyword = ref('')

const visibleFestivals = computed(() => {
  const kw = keyword.value.trim()
  return festivals.value.filter(f =>
    (groupTab.value === 'all' || festivalGroupKey(f.id) === groupTab.value) &&
    (!kw || f.name.includes(kw)),
  )
})

const current = computed(() => festivals.value.find(x => x.id === festival.value) || null)
const brandName = computed(() => store.displayBrandName || '')

// 辅色先过对比度守护，再以 --pv-accent 分发给描边/副标题/分隔线/CTA
const accent = computed(() =>
  current.value ? ensureContrast(current.value.secondaryColor, current.value.bgColor, 4.5) : '',
)

const pcardStyle = computed(() => {
  const f = current.value
  if (!f) return {}
  return {
    background: `linear-gradient(178deg, ${f.bgColor} 0%, color-mix(in srgb, ${f.primaryColor} 55%, ${f.bgColor}) 100%)`,
    borderColor: accent.value,
    '--pv-primary': f.primaryColor,
    '--pv-accent': accent.value,
  }
})

const brandChipStyle = computed(() => {
  const f = current.value
  if (!f) return {}
  return { background: f.primaryColor, color: readableOn(f.primaryColor) }
})

// CTA：主色填充 + 辅色描边，与 buildFrontPrompt 的色块描述一致
const paletteStyle = computed(() => {
  const f = current.value
  if (!f) return {}
  return { '--festival-primary': f.primaryColor, '--festival-secondary': accent.value, '--festival-bg': f.bgColor }
})

const festivalCardStyle = (f) => ({
  '--festival-primary': f.primaryColor,
  '--festival-secondary': ensureContrast(f.secondaryColor, f.bgColor, 3.2),
  '--festival-bg': f.bgColor,
  '--festival-ink': readableOn(f.bgColor),
  '--festival-primary-ink': readableOn(f.primaryColor),
  '--festival-soft': mixHex('#FFFFFF', f.primaryColor, 0.84),
  '--festival-border': mixHex('#FFFFFF', f.primaryColor, 0.48),
})

const activeThemeStyle = computed(() => {
  const f = current.value
  if (!f) return {}
  return {
    '--active-primary': f.primaryColor,
    '--active-secondary': ensureContrast(f.secondaryColor, f.bgColor, 3.2),
    '--active-bg': f.bgColor,
    '--active-ink': readableOn(f.bgColor),
  }
})

const blockStyle = computed(() => {
  const f = current.value
  if (!f) return {}
  return { background: f.primaryColor, border: `1px solid ${accent.value}`, color: readableOn(f.primaryColor) }
})

// AI 帮写：活动主题 + 优惠副标题
const {
  options: themeOptions,
  loading: themeLoading,
  error: themeError,
  filtered: themeFiltered,
  generate: generateTheme,
} = useCopyOptions(() => ({
  target: 'theme',
  festival: current.value?.name || '',
  brand: brandName.value,
  brandTone: brands.value.find(b => b.id === brand.value)?.description || industryTemplate.value.visualStyle,
  industry: industry.value,
  industryName: industryTemplate.value.name,
  startDate: startDate.value,
  endDate: endDate.value,
}))

function applyTheme(opt, mode) {
  const set = (key, val) => {
    const cur = store[key]
    store[key] = mode === 'merge' && cur ? `${cur} ${val}` : val
  }
  set('theme', opt.title)
  set('subtitle', opt.subtitle)
}

const showResetConfirm = ref(false)
function confirmReset() {
  store.resetAll()
  showResetConfirm.value = false
}
</script>

<template>
  <EdSection num="01" title="节日与品牌" desc="选择节日和品牌，生成对应风格的活动海报">
    <div class="block">
      <div class="block__head">
        <h3 class="block__title ed-label">节日主题<span class="req-star">*</span></h3>
        <span v-if="current" class="block__picked ed-meta">已选：{{ current.name }}</span>
        <span class="ed-badge ed-badge--req">必选</span>
      </div>
      <p class="block__tip ed-meta">决定海报主视觉、工作台氛围与配色</p>
      <div class="facets">
        <div class="facets__tabs">
          <EdMark
            v-for="t in groupTabs"
            :key="t.key"
            :selected="groupTab === t.key"
            @click="groupTab = t.key"
          >{{ t.label }}</EdMark>
        </div>
        <input v-model="keyword" class="facets__search" type="search" placeholder="搜索节日" />
      </div>
      <div class="festival-grid" role="list" aria-label="节日主题">
        <button
          v-for="f in visibleFestivals"
          :key="f.id"
          type="button"
          :class="['festival-card', { 'is-selected': festival === f.id }]"
          :aria-pressed="festival === f.id"
          :style="festivalCardStyle(f)"
          @click="selectedFestival(f.id)"
        >
          <span class="festival-card__rail" aria-hidden="true" />
          <span class="festival-card__content">
            <span class="festival-card__line">
              <span class="festival-card__label">节日基调</span>
              <span v-if="festival === f.id" class="festival-card__active">已选</span>
            </span>
            <span class="festival-card__copy">
              <strong>{{ f.name }}</strong>
              <small>{{ f.colorScheme }}</small>
            </span>
          </span>
          <span class="festival-card__indicator" aria-hidden="true">
            <span class="festival-card__swatch" :style="{ background: f.primaryColor }" />
            <EdIcon v-if="festival === f.id" name="check" :size="12" class="festival-card__status" />
          </span>
        </button>
      </div>
      <div v-if="current" class="theme-active" :style="activeThemeStyle">
        <div class="theme-active__signal"><span class="theme-active__pulse" /><div><span class="theme-active__eyebrow">主题已启用</span><strong>{{ current.name }}</strong></div></div>
        <span class="theme-active__scheme">{{ current.colorScheme }}</span>
        <div class="theme-active__palette" aria-label="当前主题色板"><i :style="{ background: current.primaryColor }" /><i :style="{ background: current.secondaryColor }" /><i :style="{ background: current.bgColor }" /></div>
      </div>
      <p v-if="visibleFestivals.length === 0" class="marks__empty ed-meta">没有匹配的节日</p>
      <div class="preview">
        <Transition name="pv-fade" mode="out-in">
          <div v-if="current" :key="current.id" class="preview__body">
            <div class="pcard-wrap">
              <div class="pcard" :style="pcardStyle">
                <span class="pcard__brand" :style="brandChipStyle">{{ brandName || '品牌名称' }}</span>
                <span class="pcard__title">{{ store.theme || '活动主题示例' }}</span>
                <span class="pcard__sub">{{ store.subtitle || industryTemplate.defaultSubtitle }}</span>
                <span class="pcard__block" :style="blockStyle">优惠活动区域</span>
              </div>
              <p class="pcard__tip ed-meta">小样为配色示意，实际以 AI 出图为准</p>
            </div>
            <div class="plegend">
              <span class="plegend__head ed-label">海报配色预览</span>
              <p class="plegend__scheme">{{ current.colorScheme }}</p>
              <ul class="plegend__list">
                <li class="plegend__row">
                  <span class="plegend__chip" :style="{ background: current.primaryColor }" />
                  <span class="ed-meta">主色 {{ current.primaryColor }}</span>
                </li>
                <li class="plegend__row">
                  <span class="plegend__chip" :style="{ background: current.secondaryColor }" />
                  <span class="ed-meta">辅色 {{ current.secondaryColor }}</span>
                </li>
                <li class="plegend__row">
                  <span class="plegend__chip" :style="{ background: current.bgColor }" />
                  <span class="ed-meta">底色 {{ current.bgColor }}</span>
                </li>
              </ul>
            </div>
          </div>
          <div v-else key="empty" class="preview__empty">
            <EdIcon name="image" :size="22" />
            <span class="ed-meta">选择节日后在此预览海报配色</span>
          </div>
        </Transition>
      </div>
    </div>

    <div class="block">
      <div class="block__head">
        <h3 class="block__title ed-label">{{ industryTemplate.brandLabel }}<span class="req-star">*</span></h3>
        <span class="ed-badge ed-badge--req">必选</span>
      </div>
      <p class="block__tip ed-meta">用于海报品牌署名</p>
      <div v-if="industry === 'jewelry'" class="brands">
        <button
          v-for="b in brands"
          :key="b.id"
          type="button"
          :class="['brand', { 'is-selected': brand === b.id }]"
          @click="selectedBrand(b.id)"
        >
          <span class="brand__name">{{ b.name }}</span>
          <span class="brand__desc ed-meta">{{ b.description }}</span>
          <EdIcon v-if="brand === b.id" name="check" :size="14" class="brand__tick" />
        </button>
      </div>
      <div v-else class="fields">
        <EdField
          label="品牌名称"
          :model-value="customBrandName"
          @update:model-value="customBrandName = $event"
          :placeholder="industry === 'food' ? '例如：山海小馆' : '例如：星耀数码'"
        />
      </div>
    </div>

    <div class="block">
      <div class="block__head">
        <h3 class="block__title ed-label">活动主题</h3>
        <span class="ed-badge ed-badge--opt">选填</span>
      </div>
      <p class="block__tip ed-meta">用于生成海报主标题文案</p>
      <div class="writer">
        <span class="writer__hint ed-meta">文案没有灵感？试试 AI 帮写</span>
        <EdButton
          variant="solid" size="sm"
          :loading="themeLoading"
          :disabled="!canStep1Next"
          :title="!canStep1Next ? '请先填写品牌信息' : ''"
          @click="generateTheme"
        >
          <EdIcon name="sparkle" :size="14" />
          AI 帮写
        </EdButton>
      </div>
      <div class="fields">
        <EdField label="活动主标题" :model-value="store.theme" @update:model-value="store.theme = $event" placeholder="例如：七夕浪漫钜惠" />
        <EdField label="优惠副标题" :model-value="store.subtitle" @update:model-value="store.subtitle = $event" :placeholder="'例如：' + industryTemplate.defaultSubtitle" />
      </div>
      <CopyOptionsPanel
        :options="themeOptions"
        :loading="themeLoading"
        :error="themeError"
        :filtered="themeFiltered"
        :has-existing="!!(store.theme || store.subtitle)"
        @refresh="generateTheme"
        @apply="applyTheme"
      />
    </div>

    <div class="block">
      <div class="block__head">
        <h3 class="block__title ed-label">活动时间</h3>
        <span class="ed-badge ed-badge--opt">选填</span>
      </div>
      <p class="block__tip ed-meta">用于海报活动周期标注</p>
      <CalendarRangePicker
        :start-date="startDate"
        :end-date="endDate"
        @update:start-date="store.startDate = $event"
        @update:end-date="store.endDate = $event"
      />
    </div>

    <hr class="ed-rule" />
    <div class="actions">
      <EdButton class="actions__reset" variant="text" size="sm" @click="showResetConfirm = true">
        <EdIcon name="trash" :size="14" />
        清空重填
      </EdButton>
      <span v-if="!canStep1Next" class="actions__hint ed-meta">
        请先填写<span v-if="industry === 'jewelry' && !festival">节日</span><span v-if="industry === 'jewelry' && !festival && !brand">和</span><span v-if="industry !== 'jewelry' || !brand">品牌</span>
      </span>
      <EdButton variant="solid" :disabled="!canStep1Next" @click="store.setStep(2)">
        下一步
        <EdIcon name="arrow-right" :size="15" />
      </EdButton>
    </div>

    <EdDialog
      v-if="showResetConfirm"
      title="清空当前填写内容？"
      :width="420"
      @close="showResetConfirm = false"
    >
      <p class="confirm-text">已填写的节日、品牌、主题与活动时间都会被清空，且无法恢复。</p>
      <template #footer>
        <EdButton variant="text" @click="showResetConfirm = false">取消</EdButton>
        <EdButton variant="solid" @click="confirmReset">清空</EdButton>
      </template>
    </EdDialog>
  </EdSection>
</template>

<style scoped>
.block__picked { margin-left: auto; }
.actions__reset { margin-right: auto; }
.confirm-text { color: var(--ed-ink-soft); font-size: 14px; }

.writer { margin-bottom: var(--ed-space-4); }

.facets {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--ed-space-3);
  margin-bottom: var(--ed-space-4);
}
.facets__tabs {
  display: flex;
  flex-wrap: wrap;
  flex: 1 1 auto;
  min-width: 0;
  column-gap: 14px;
  row-gap: 2px;
  padding-bottom: 6px;
  border-bottom: 1px solid #c4cad3;
}
.facets__search {
  width: 168px;
  max-width: 100%;
  height: 36px;
  padding: 0 11px;
  border: 1px solid var(--ed-rule);
  border-radius: 8px;
  background: var(--theme-surface);
  font-size: 13px;
  color: var(--ed-ink);
  transition: border-color var(--ed-fast) var(--ed-ease), box-shadow var(--ed-fast) var(--ed-ease);
}
.facets__search::placeholder { color: var(--ed-ink-faint); }
.facets__search:focus { border-color: var(--ed-accent); outline: none; box-shadow: 0 0 0 3px color-mix(in srgb, var(--ed-accent) 12%, transparent); }

.marks {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  gap: var(--ed-space-3);
}
.marks .ed-mark { width: 100%; justify-content: center; }
.marks__empty { margin-top: var(--ed-space-3); grid-column: 1 / -1; }

.preview { display: none; }
.preview__body {
  animation: preview-rise .35s var(--ed-ease);
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--ed-space-6);
}

/* 动态主题卡片：节日色只作用于预览和状态，不覆盖工作台 */
.pcard { position: relative; display: flex; flex-direction: column; align-items: center; width: 240px; aspect-ratio: 4 / 5; padding: var(--ed-space-4); border: 0; border-radius: 16px; color: #fff; text-align: center; overflow: hidden; isolation: isolate; box-shadow: 0 20px 42px color-mix(in srgb, var(--festival-primary) 22%, transparent); transition: background .35s ease, box-shadow .35s ease, transform .35s ease; }
.pcard::before { content: ''; position: absolute; inset: 10px; z-index: -1; border: 1px solid rgba(255,255,255,.3); border-radius: 11px; }
.pcard:hover { transform: translateY(-4px) rotate(-1deg); }
.pcard__top, .pcard__bottom { position: relative; z-index: 2; width: 100%; display: flex; justify-content: space-between; color: rgba(255,255,255,.72); font: 9px var(--ed-mono); letter-spacing: .1em; }
.pcard__orb { position: absolute; z-index: -1; width: 230px; height: 230px; top: 48px; right: -70px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, rgba(255,255,255,.94), color-mix(in srgb, var(--festival-secondary) 70%, transparent) 17%, transparent 67%); opacity: .8; }
.pcard__brand { position: relative; z-index: 2; margin-top: 44px; padding: 5px 10px; border-radius: 100px; font-size: 10px; letter-spacing: .08em; }
.pcard__title { position: relative; z-index: 2; margin-top: auto; max-width: 190px; font-family: var(--ed-serif); font-size: 23px; font-weight: 700; line-height: 1.2; color: #fff; }
.pcard__sub { position: relative; z-index: 2; margin-top: var(--ed-space-2); font-size: 10px; color: rgba(255,255,255,.78); }
.pcard__block { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; width: 100%; height: 42px; margin-top: var(--ed-space-4); padding: 0 12px; border: 1px solid rgba(255,255,255,.3); border-radius: 8px; font-size: 11px; letter-spacing: .05em; }
.pcard__block b { font-size: 16px; font-weight: 400; }.pcard__bottom { margin-top: auto; padding-top: 14px; }.pcard-wrap { display: flex; flex-direction: column; align-items: center; }
.pcard__tip { margin-top: var(--ed-space-3); font-size: 12px; text-transform: none; text-align: center; }

.industry-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.industry-option {
  position: relative;
  display: flex;
  min-height: 82px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 6px;
  padding: 13px 34px 13px 14px;
  border: 1px solid #c4cad3;
  border-radius: 10px;
  background: var(--theme-surface);
  color: var(--ed-ink);
  text-align: left;
  cursor: pointer;
  transition: border-color 160ms var(--ed-ease), background 160ms var(--ed-ease), box-shadow 160ms var(--ed-ease), transform 160ms var(--ed-ease);
}
.industry-option:hover {
  border-color: var(--theme-primary);
  background: color-mix(in srgb, var(--theme-primary) 4%, var(--theme-surface));
  transform: translateY(-1px);
}
.industry-option.is-selected {
  border-color: var(--theme-primary);
  background: color-mix(in srgb, var(--theme-primary) 8%, var(--theme-surface));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--theme-primary) 12%, transparent);
}
.industry-option .ed-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  color: var(--theme-primary);
}
.industry-option__name { font-family: var(--ed-serif); font-size: 15px; font-weight: 700; }
.industry-option__desc { line-height: 1.5; text-transform: none; letter-spacing: 0; }

.plegend { max-width: 260px; border-left: 1px solid var(--ed-rule); padding-left: var(--ed-space-5); }
.plegend__head { display: block; margin-bottom: var(--ed-space-2); }
.plegend__scheme {
  margin: 0 0 var(--ed-space-4);
  font-family: var(--ed-serif);
  font-size: 15px;
  color: var(--ed-accent);
}
.plegend__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--ed-space-2); }
.plegend__row { display: flex; align-items: center; gap: var(--ed-space-3); }
.plegend__chip { width: 22px; height: 22px; border: 1px solid var(--ed-ink); flex-shrink: 0; }

.preview__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ed-space-3);
  width: 208px;
  aspect-ratio: 2100 / 2970;
  border: 1px dashed var(--ed-ink-faint);
  color: var(--ed-ink-faint);
  text-align: center;
}

@keyframes preview-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.pv-fade-enter-active, .pv-fade-leave-active { transition: opacity var(--ed-fast) var(--ed-ease); }
.pv-fade-enter-from, .pv-fade-leave-to { opacity: 0; }
</style>

<style scoped>
.festival-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.festival-card {
  position: relative;
  display: flex;
  min-height: 136px;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  padding: 15px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--festival-primary) 22%, var(--festival-bg));
  border-radius: 17px;
  background: linear-gradient(145deg, var(--festival-bg), color-mix(in srgb, var(--festival-primary) 30%, var(--festival-bg)));
  color: var(--festival-ink);
  text-align: left;
  cursor: pointer;
  isolation: isolate;
  transition: transform 220ms var(--ed-ease), border-color 220ms var(--ed-ease), box-shadow 220ms var(--ed-ease), filter 220ms var(--ed-ease);
}
.festival-card::after {
  content: '';
  position: absolute;
  inset: 7px;
  z-index: -1;
  border: 1px solid color-mix(in srgb, var(--festival-secondary) 28%, transparent);
  border-radius: 11px;
  pointer-events: none;
}
.festival-card__glow {
  position: absolute;
  z-index: -1;
  width: 150px;
  height: 150px;
  top: -74px;
  right: -44px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--festival-secondary) 72%, white), transparent 68%);
  opacity: .7;
  transition: transform 260ms var(--ed-ease), opacity 220ms var(--ed-ease);
}
.festival-card:hover {
  transform: translateY(-4px);
  border-color: var(--festival-secondary);
  box-shadow: 0 18px 34px color-mix(in srgb, var(--festival-primary) 25%, transparent);
  filter: saturate(1.08);
}
.festival-card:hover .festival-card__glow { transform: scale(1.25); opacity: .95; }
.festival-card.is-selected {
  border-color: var(--festival-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--festival-primary) 25%, transparent), 0 20px 38px color-mix(in srgb, var(--festival-primary) 28%, transparent);
  transform: translateY(-4px);
}
.festival-card.is-selected::after { border-color: color-mix(in srgb, var(--festival-secondary) 65%, transparent); }
.festival-card__top,
.festival-card__copy { position: relative; z-index: 1; }
.festival-card__top { display: flex; align-items: center; justify-content: space-between; color: color-mix(in srgb, var(--festival-ink) 60%, transparent); font: 9px var(--ed-mono); letter-spacing: .1em; }
.festival-card__active { color: var(--festival-secondary); font-weight: 700; }
.festival-card__copy { display: flex; max-width: calc(100% - 58px); flex-direction: column; gap: 4px; margin-top: 19px; }
.festival-card__copy strong { font-family: var(--ed-serif); font-size: 20px; font-weight: 700; line-height: 1.15; letter-spacing: -.04em; }
.festival-card__copy small { overflow: hidden; color: color-mix(in srgb, var(--festival-ink) 72%, transparent); font: 10px/1.4 var(--ed-sans); text-overflow: ellipsis; white-space: nowrap; }
.festival-card__check { position: absolute; right: 14px; bottom: 14px; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: var(--festival-primary); color: var(--festival-primary-ink); box-shadow: 0 5px 12px color-mix(in srgb, var(--festival-primary) 34%, transparent); }

.theme-active {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 60px;
  margin-top: 14px;
  padding: 12px 15px;
  border: 1px solid color-mix(in srgb, var(--active-secondary) 38%, transparent);
  border-radius: 14px;
  background: linear-gradient(112deg, var(--active-bg), color-mix(in srgb, var(--active-primary) 35%, var(--active-bg)));
  color: var(--active-ink);
  box-shadow: 0 12px 24px color-mix(in srgb, var(--active-bg) 24%, transparent);
  animation: theme-active-in 320ms var(--ed-ease);
}
.theme-active__signal { display: flex; align-items: center; gap: 10px; min-width: 142px; }
.theme-active__pulse { width: 9px; height: 9px; flex: 0 0 auto; border-radius: 50%; background: var(--active-primary); box-shadow: 0 0 0 5px color-mix(in srgb, var(--active-primary) 18%, transparent); }
.theme-active__eyebrow { display: block; margin-bottom: 3px; color: color-mix(in srgb, var(--active-ink) 62%, transparent); font: 9px var(--ed-mono); letter-spacing: .12em; }
.theme-active__signal strong { display: block; font: 700 15px/1.2 var(--ed-serif); }
.theme-active__scheme { flex: 1; min-width: 0; overflow: hidden; color: color-mix(in srgb, var(--active-ink) 74%, transparent); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.theme-active__palette { display: flex; align-items: center; }
.theme-active__palette i { width: 24px; height: 24px; margin-left: -5px; border: 2px solid color-mix(in srgb, var(--active-bg) 72%, white); border-radius: 50%; box-shadow: 0 3px 7px #0004; }
.theme-active__palette i:first-child { width: 31px; height: 31px; margin-left: 0; }

@keyframes theme-active-in { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 900px) {
  .festival-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .industry-grid { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .facets { align-items: stretch; gap: 10px; }
  .facets__tabs { width: 100%; }
  .facets__search { width: 100%; height: 34px; }
  .festival-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .theme-active { align-items: flex-start; flex-wrap: wrap; }
  .theme-active__scheme { flex-basis: calc(100% - 160px); }
}

.facets__tabs :deep(.ed-mark) {
  min-height: 28px;
  padding: 3px 2px;
  border-color: transparent;
  background: transparent;
  color: var(--ed-ink-faint);
  font-size: 12px;
}
.facets__tabs :deep(.ed-mark:hover:not(:disabled)) {
  border-color: transparent;
  color: var(--ed-ink);
}
.facets__tabs :deep(.ed-mark.is-selected) {
  border-color: transparent;
  background: transparent;
  color: var(--ed-accent);
  box-shadow: inset 0 -2px 0 var(--ed-accent);
}

.festival-card {
  display: grid;
  min-height: 78px;
  grid-template-columns: 3px minmax(0, 1fr) 24px;
  padding: 0 10px 0 0;
  border-color: #c4cad3;
  border-radius: 10px;
  background: var(--theme-surface);
  color: var(--ed-ink);
  box-shadow: none;
  transition: border-color 160ms var(--ed-ease), background 160ms var(--ed-ease), box-shadow 160ms var(--ed-ease), transform 160ms var(--ed-ease);
}
.festival-card::before { display: none; }
.festival-card::after,
.festival-card__glow { display: none; }
.festival-card:hover {
  transform: translateY(-1px);
  border-color: var(--festival-primary);
  background: color-mix(in srgb, var(--festival-primary) 4%, var(--theme-surface));
  box-shadow: 0 5px 14px color-mix(in srgb, var(--festival-primary) 10%, transparent);
  filter: none;
}
.festival-card.is-selected {
  transform: none;
  border-color: var(--festival-primary);
  background: color-mix(in srgb, var(--festival-primary) 6%, var(--theme-surface));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--festival-primary) 13%, transparent);
}
.festival-card__rail {
  align-self: stretch;
  width: 3px;
  background: linear-gradient(180deg, var(--festival-primary), var(--festival-secondary));
}
.festival-card__content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 10px 0 10px 11px;
}
.festival-card__line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  color: var(--ed-ink-faint);
  font: 9px var(--ed-mono);
  letter-spacing: .08em;
}
.festival-card__label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.festival-card__active {
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--theme-soft);
  color: var(--ed-accent);
  font-size: 9px;
  letter-spacing: .02em;
}
.festival-card__copy {
  display: flex;
  max-width: 100%;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
  margin: 0;
}
.festival-card__copy strong { overflow: hidden; color: var(--ed-ink); font-family: var(--ed-serif); font-size: 16px; letter-spacing: -.02em; text-overflow: ellipsis; white-space: nowrap; }
.festival-card__copy small { overflow: hidden; color: var(--ed-ink-soft); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.festival-card__indicator {
  position: relative;
  display: grid;
  place-items: center;
  align-self: center;
  width: 24px;
  height: 24px;
}
.festival-card__swatch {
  width: 14px;
  height: 14px;
  border: 2px solid var(--theme-surface);
  border-radius: 50%;
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--festival-primary) 40%, #c4cad3);
}
.festival-card__status {
  position: absolute;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--festival-primary);
  color: var(--festival-primary-ink);
}
.festival-card.is-selected .festival-card__swatch { opacity: .22; }

.festival-card:focus-visible {
  outline: 2px solid var(--festival-primary);
  outline-offset: 2px;
}

.brands .brand { border-bottom-color: #c4cad3; }
.brands .brand:hover { border-bottom-color: var(--ed-ink-soft); }
.brands .brand.is-selected { border-bottom-color: var(--ed-accent); }

.fields { gap: 0; }
.fields :deep(.ed-field + .ed-field) {
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid #c4cad3;
}

.theme-active {
  min-height: 52px;
  margin-top: 12px;
  padding: 10px 12px;
  border-color: var(--theme-border);
  border-radius: 10px;
  background: var(--theme-soft);
  color: var(--ed-ink);
  box-shadow: none;
  animation: none;
}
.theme-active__signal { min-width: 126px; }
.theme-active__pulse {
  width: 7px;
  height: 7px;
  background: var(--active-primary);
  box-shadow: none;
}
.theme-active__eyebrow { color: var(--ed-accent); }
.theme-active__signal strong { font-size: 14px; }
.theme-active__scheme { color: var(--ed-ink-soft); }
.theme-active__palette i,
.theme-active__palette i:first-child {
  width: 20px;
  height: 12px;
  margin-left: 3px;
  border: 0;
  border-radius: 3px;
  box-shadow: none;
}

@media (max-width: 560px) {
  .festival-card { min-height: 74px; grid-template-columns: 3px minmax(0, 1fr) 22px; padding-right: 8px; }
  .festival-card__content { gap: 5px; padding: 9px 0 9px 9px; }
  .festival-card__copy strong { font-size: 15px; }
  .festival-card__copy small { font-size: 9px; }
}
</style>
