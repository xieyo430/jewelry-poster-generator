<script setup>
import { ref, computed, toRef } from 'vue'
import { usePosterStore } from '../../store/poster'
import { useToast } from '../../composables/useToast'
import api from '../../api'
import EdSection from '../common/EdSection.vue'
import EdButton from '../common/EdButton.vue'
import EdField from '../common/EdField.vue'
import EdIcon from '../common/EdIcon.vue'
import CopyOptionsPanel from '../common/CopyOptionsPanel.vue'
import { useCopyOptions } from '../../composables/useCopyOptions'

const toast = useToast()

const store = usePosterStore()
const mainPromotion = toRef(store, 'mainPromotion')
const secondaryPromotion = toRef(store, 'secondaryPromotion')
const canStep2Next = computed(() => store.canStep2Next)

const mainMainTitle = computed({
  get: () => mainPromotion.value.mainTitle,
  set: v => { mainPromotion.value.mainTitle = v; store.syncMainContent() },
})
const mainSubTitle = computed({
  get: () => mainPromotion.value.subTitle,
  set: v => { mainPromotion.value.subTitle = v; store.syncMainContent() },
})
const secMainTitle = computed({
  get: () => secondaryPromotion.value.mainTitle,
  set: v => { secondaryPromotion.value.mainTitle = v; store.syncSecContent() },
})
const secSubTitle = computed({
  get: () => secondaryPromotion.value.subTitle,
  set: v => { secondaryPromotion.value.subTitle = v; store.syncSecContent() },
})

const hasSecondary = computed({
  get: () => store.secCached.hasSecondary,
  set: v => { store.secCached.hasSecondary = v },
})

const mainAiText = ref('')
const mainAiLoading = ref(false)
const mainAiError = ref(false)
const secAiText = ref('')
const secAiLoading = ref(false)
const secAiError = ref(false)
const canWriteMain = computed(() => !!(store.theme.trim() || store.mainPromotion.mainTitle.trim()))
const canWriteSecondary = computed(() => !!(store.theme.trim() || store.secondaryPromotion.mainTitle.trim()))

const INVALID = ['...', '…', '占位符', '无', '暂无', '-', '--']

async function smartFill(target) {
  const isMain = target === 'main'
  const raw = (isMain ? mainAiText : secAiText).value
  if (!raw.trim()) return
  const loading = isMain ? mainAiLoading : secAiLoading
  const error = isMain ? mainAiError : secAiError
  loading.value = true
  error.value = false
  try {
    const d = (await api.post('/ai/smart-fill', {
      rawDescription: raw,
      industry: store.industry,
      industryName: store.industryTemplate.name,
    })).data
    const promo = isMain ? store.mainPromotion : store.secondaryPromotion
    const filled = []
    if (d.mainTitle && !INVALID.includes(d.mainTitle.trim())) { promo.mainTitle = d.mainTitle; filled.push('主标题') }
    if (d.subTitle && !INVALID.includes(d.subTitle.trim())) { promo.subTitle = d.subTitle; filled.push('副标题') }
    isMain ? store.syncMainContent() : store.syncSecContent()
    if (filled.length) toast.success(`AI 已填充：${filled.join('、')}`)
    else { error.value = true; toast.error('未识别到有效文案，请手动填写') }
  } catch (e) {
    error.value = true
    toast.error('AI 分析失败：' + (e.message || '网络错误'))
  } finally {
    loading.value = false
  }
}

// ===== AI 帮写：主爆点 / 次爆点 =====
const basePayload = () => ({
  festival: store.festivals.find(f => f.id === store.festival)?.name || '',
  brand: store.displayBrandName,
  brandTone: store.industry === 'jewelry'
    ? store.brands.find(b => b.id === store.brand)?.description || store.industryTemplate.visualStyle
    : store.industryTemplate.visualStyle,
  industry: store.industry,
  industryName: store.industryTemplate.name,
  theme: store.theme || store.mainPromotion.mainTitle || store.secondaryPromotion.mainTitle,
  subtitle: store.subtitle,
  startDate: store.startDate,
  endDate: store.endDate,
})

const {
  options: mainOptions,
  loading: mainWriteLoading,
  error: mainWriteError,
  filtered: mainWriteFiltered,
  generate: generateMain,
} = useCopyOptions(() => ({
  ...basePayload(),
  target: 'main',
  currentTitle: store.mainPromotion.mainTitle,
  currentSubtitle: store.mainPromotion.subTitle,
}))

const {
  options: secOptions,
  loading: secWriteLoading,
  error: secWriteError,
  filtered: secWriteFiltered,
  generate: generateSec,
} = useCopyOptions(() => ({
  ...basePayload(),
  target: 'secondary',
  currentTitle: store.secondaryPromotion.mainTitle,
  currentSubtitle: store.secondaryPromotion.subTitle,
}))

function applyWriter(target, opt, mode) {
  const promo = target === 'main' ? store.mainPromotion : store.secondaryPromotion
  for (const [f, v] of [['mainTitle', opt.title], ['subTitle', opt.subtitle]]) {
    const cur = promo[f]
    promo[f] = mode === 'merge' && cur ? `${cur} ${v}` : v
  }
  target === 'main' ? store.syncMainContent() : store.syncSecContent()
}

const removeSecondary = () => {
  hasSecondary.value = false
  store.secCached.fieldValues = {}
  store.secondaryPromotion.content = ''
  store.secondaryPromotion.discountDetail = ''
  store.secondaryPromotion.mainTitle = ''
  store.secondaryPromotion.subTitle = ''
}
</script>

<template>
  <EdSection num="02" title="正面推广" desc="设置主爆点活动（必选）和次爆点活动（选填），将显示在海报正面">
    <div class="block">
      <div class="block__head">
        <span class="ed-tag">主爆点</span>
        <h3 class="block__title ed-label">主爆点活动</h3>
        <span class="ed-badge ed-badge--req">必选</span>
      </div>

      <div class="fields">
        <EdField
          v-model="mainAiText"
          label="AI 文案输入"
          type="textarea"
          :rows="3"
          :placeholder="`粘贴${store.industryTemplate.name}营销文案，AI 自动解析`"
        />
        <div v-if="mainAiError" class="note">
          <EdIcon name="warning" :size="13" class="note__icon" />
          <span>未识别到有效文案，请手动填写</span>
        </div>
        <EdButton
          variant="solid"
          block
          :loading="mainAiLoading"
          :disabled="!mainAiText.trim()"
          @click="smartFill('main')"
        >
          <EdIcon name="sparkle" :size="15" />
          智能填充
        </EdButton>
        <EdField v-model="mainMainTitle" label="活动主标题" placeholder="输入主标题，如：全场黄金8.5折" />
        <EdField v-model="mainSubTitle" label="活动副标题" placeholder="输入副标题" />

        <div class="writer">
          <span class="writer__hint ed-meta">使用 AI 帮写，AI 将根据活动主标题生成对应文案</span>
          <EdButton
            variant="solid" size="sm"
            :loading="mainWriteLoading"
            :disabled="!canWriteMain"
            :title="!canWriteMain ? '请先填写活动主题或主爆点标题' : ''"
            @click="generateMain"
          >
            <EdIcon name="sparkle" :size="14" />
            AI 帮写
          </EdButton>
        </div>

        <CopyOptionsPanel
          :options="mainOptions"
          :loading="mainWriteLoading"
          :error="mainWriteError"
          :filtered="mainWriteFiltered"
          :has-existing="!!(store.mainPromotion.mainTitle || store.mainPromotion.subTitle)"
          @refresh="generateMain"
          @apply="(opt, mode) => applyWriter('main', opt, mode)"
        />
      </div>
    </div>

    <div class="block">
      <div class="block__head">
        <h3 class="block__title ed-label">次爆点活动</h3>
        <span class="ed-badge ed-badge--opt">选填</span>
        <EdButton
          v-if="!hasSecondary"
          variant="text"
          size="sm"
          @click="hasSecondary = true"
        >
          <EdIcon name="plus" :size="15" />
          添加
        </EdButton>
        <EdButton v-else variant="outline" size="sm" @click="removeSecondary">
          移除
        </EdButton>
      </div>

      <div v-if="hasSecondary" class="fields">
        <EdField
          v-model="secAiText"
          label="AI 文案输入"
          type="textarea"
          :rows="3"
          :placeholder="`粘贴${store.industryTemplate.name}活动文案`"
        />
        <div v-if="secAiError" class="note">
          <EdIcon name="warning" :size="13" class="note__icon" />
          <span>未识别到有效文案，请手动填写</span>
        </div>
        <EdButton
          variant="solid"
          block
          :loading="secAiLoading"
          :disabled="!secAiText.trim()"
          @click="smartFill('secondary')"
        >
          <EdIcon name="sparkle" :size="15" />
          智能填充
        </EdButton>
        <EdField v-model="secMainTitle" label="活动主标题" placeholder="输入主标题" />
        <EdField v-model="secSubTitle" label="活动副标题" placeholder="输入副标题" />

        <div class="writer">
          <span class="writer__hint ed-meta">使用 AI 帮写，AI 将根据活动主标题生成对应文案</span>
          <EdButton
            variant="solid" size="sm"
            :loading="secWriteLoading"
            :disabled="!canWriteSecondary"
            :title="!canWriteSecondary ? '请先填写活动主题或次爆点标题' : ''"
            @click="generateSec"
          >
            <EdIcon name="sparkle" :size="14" />
            AI 帮写
          </EdButton>
        </div>

        <CopyOptionsPanel
          :options="secOptions"
          :loading="secWriteLoading"
          :error="secWriteError"
          :filtered="secWriteFiltered"
          :has-existing="!!(store.secondaryPromotion.mainTitle || store.secondaryPromotion.subTitle)"
          @refresh="generateSec"
          @apply="(opt, mode) => applyWriter('secondary', opt, mode)"
        />
      </div>
    </div>

    <hr class="ed-rule" />
    <div class="actions">
      <EdButton variant="text" @click="store.setStep(1)">
        <EdIcon name="arrow-left" :size="15" />
        上一步
      </EdButton>
      <span v-if="!canStep2Next" class="actions__hint ed-meta">
        请填写主爆点主标题
      </span>
      <EdButton variant="solid" :disabled="!canStep2Next" @click="store.setStep(3)">
        下一步
        <EdIcon name="arrow-right" :size="15" />
      </EdButton>
    </div>
  </EdSection>
</template>
