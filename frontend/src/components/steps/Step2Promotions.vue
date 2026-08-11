<script setup>
import { ref, computed, toRef } from 'vue'
import { usePosterStore } from '../../store/poster'
import { useToast } from '../../composables/useToast'
import api from '../../api'
import Md3Card from '../common/Md3Card.vue'
import Md3Button from '../common/Md3Button.vue'
import Md3TextField from '../common/Md3TextField.vue'

// Toast instance for AI operations
const toast = useToast()

const store = usePosterStore()
const mainPromotion = toRef(store, 'mainPromotion')
const secondaryPromotion = toRef(store, 'secondaryPromotion')
const mainCached = toRef(store, 'mainCached')
const secCached = toRef(store, 'secCached')
const canStep2Next = computed(() => store.canStep2Next)

/* ---------- Computed two-way bindings ---------- */
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

/* ---------- AI Smart Fill ---------- */
const mainAiText = ref('')
const mainAiLoading = ref(false)
const mainAiError = ref(false)
const secAiText = ref('')
const secAiLoading = ref(false)
const secAiError = ref(false)

async function handleMainAi() {
  if (!mainAiText.value.trim()) return
  mainAiLoading.value = true
  mainAiError.value = false
  try {
    const res = await api.smartFill(mainAiText.value)
    const d = res.data
    const filled = []
    const invalidTitles = ['...', '…', '...', '占位符', '无', '暂无', '-', '--']

    if (d.mainTitle && !invalidTitles.includes(d.mainTitle.trim())) {
      store.mainPromotion.mainTitle = d.mainTitle
      filled.push('主标题')
    }
    if (d.subTitle && !invalidTitles.includes(d.subTitle.trim())) {
      store.mainPromotion.subTitle = d.subTitle
      filled.push('副标题')
    }
    store.syncMainContent()

    if (filled.length) toast.success(`AI 已填充：${filled.join('、')}`)
    else { mainAiError.value = true; toast.error('AI 分析失败，请检查文案后重试') }
  } catch (e) {
    mainAiError.value = true
    toast.error('AI 分析失败：' + (e.message || '网络错误'))
  } finally {
    mainAiLoading.value = false
  }
}

async function handleSecAi() {
  if (!secAiText.value.trim()) return
  secAiLoading.value = true
  secAiError.value = false
  try {
    const res = await api.smartFill(secAiText.value)
    const d = res.data
    const filled = []
    const invalidTitles = ['...', '…', '...', '占位符', '无', '暂无', '-', '--']

    if (d.mainTitle && !invalidTitles.includes(d.mainTitle.trim())) {
      store.secondaryPromotion.mainTitle = d.mainTitle
      filled.push('主标题')
    }
    if (d.subTitle && !invalidTitles.includes(d.subTitle.trim())) {
      store.secondaryPromotion.subTitle = d.subTitle
      filled.push('副标题')
    }
    store.syncSecContent()

    if (filled.length) toast.success(`AI 已填充：${filled.join('、')}`)
    else { secAiError.value = true; toast.error('AI 分析失败，请检查文案后重试') }
  } catch (e) {
    secAiError.value = true
    toast.error('AI 分析失败：' + (e.message || '网络错误'))
  } finally {
    secAiLoading.value = false
  }
}

/* ---------- Activity type: fixed to text for promotions ---------- */
</script>

<template>
  <Md3Card variant="elevated" class="step-card">
    <!-- Header -->
    <div class="step-header">
      <h2 class="step-title">正面推广配置</h2>
      <p class="step-subtitle">设置主爆点活动（必填）和次爆点活动（选填），将显示在海报正面</p>
    </div>

    <!-- ====== Main Promotion ====== -->
    <section class="section promo-section">
      <div class="section-head">
        <span class="md3-badge md3-badge--filled">主爆点</span>
        <h3 class="section-label">主爆点活动</h3>
        <span class="md3-badge md3-badge--error">必填</span>
      </div>

      <!-- AI Smart Fill -->
      <div class="ai-box">
        <Md3TextField
          v-model="mainAiText"
          type="textarea"
          placeholder="粘贴营销文案，AI 自动解析"
          variant="outlined"
          :rows="3"
        />
        <div v-if="mainAiError" class="md3-alert md3-alert--error" style="margin-top: 8px">
          <span class="md3-alert__icon">&#9888;</span>
          <span class="md3-alert__body">AI 分析失败，请检查文案或重试</span>
        </div>
        <Md3Button
          variant="filled"
          :loading="mainAiLoading"
          :disabled="!mainAiText.trim()"
          style="margin-top: 10px; width: 100%"
          @click="handleMainAi"
        >
          &#9889; 智能填充
        </Md3Button>
      </div>

      <!-- Titles -->
      <div class="field-group">
        <label class="field-label">主标题 <span class="required-dot">*</span></label>
        <Md3TextField
          v-model="mainMainTitle"
          placeholder="输入主标题，如：全场黄金8.5折"
          variant="outlined"
        />
      </div>

      <div class="field-group">
        <label class="field-label">副标题 <span class="optional-tag">选填</span></label>
        <Md3TextField
          v-model="mainSubTitle"
          placeholder="输入副标题"
          variant="outlined"
        />
      </div>

    </section>

    <!-- ====== Secondary Promotion ====== -->
    <section class="section">
      <div class="section-head">
        <h3 class="section-label">次爆点活动</h3>
        <span class="md3-badge md3-badge--tonal">选填</span>
        <div style="flex: 1"></div>
        <Md3Button
          v-if="!hasSecondary"
          variant="tonal"
          size="small"
          @click="hasSecondary = true"
        >
          &#43; 添加
        </Md3Button>
        <Md3Button
          v-else
          variant="outlined"
          size="small"
          @click="hasSecondary = false; store.secCached.fieldValues = {}; store.secondaryPromotion.content = ''; store.secondaryPromotion.discountDetail = ''; store.secondaryPromotion.mainTitle = ''; store.secondaryPromotion.subTitle = ''"
        >
          移除
        </Md3Button>
      </div>

      <template v-if="hasSecondary">
        <!-- AI Smart Fill -->
        <div class="ai-box">
          <Md3TextField
            v-model="secAiText"
            type="textarea"
            placeholder="粘贴活动文案"
            variant="outlined"
            :rows="3"
          />
          <div v-if="secAiError" class="md3-alert md3-alert--error" style="margin-top: 8px">
            <span class="md3-alert__icon">&#9888;</span>
            <span class="md3-alert__body">AI 分析失败，请检查文案或重试</span>
          </div>
          <Md3Button
            variant="filled"
            :loading="secAiLoading"
            :disabled="!secAiText.trim()"
            style="margin-top: 10px; width: 100%"
            @click="handleSecAi"
          >
            &#9889; 智能填充
          </Md3Button>
        </div>

        <!-- Titles -->
        <div class="field-group">
          <label class="field-label">主标题</label>
          <Md3TextField
            v-model="secMainTitle"
            placeholder="输入主标题"
            variant="outlined"
          />
        </div>

        <div class="field-group">
          <label class="field-label">副标题 <span class="optional-tag">选填</span></label>
          <Md3TextField
            v-model="secSubTitle"
            placeholder="输入副标题"
            variant="outlined"
          />
        </div>
      </template>
    </section>

    <!-- Action bar -->
    <div class="md3-card__divider"></div>
    <div class="action-bar">
      <Md3Button variant="outlined" @click="store.setStep(1)">
        &#8592; 上一步
      </Md3Button>
      <div class="action-right">
        <span v-if="!canStep2Next" class="validation-hint">
          <span class="hint-icon">!</span>
          请填写主爆点主标题
        </span>
        <Md3Button
          variant="filled"
          :disabled="!canStep2Next"
          @click="store.setStep(3)"
        >
          下一步 &#8594;
        </Md3Button>
      </div>
    </div>
  </Md3Card>
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

.promo-section {
  padding: 20px;
  background: var(--md-surface-container-low);
  border-radius: var(--md-shape-medium);
  border: 1px solid var(--md-outline-variant);
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

/* AI Box */
.ai-box {
  padding: 16px;
  background: var(--md-surface-container);
  border-radius: var(--md-shape-small);
  margin-bottom: 16px;
}

/* Field groups */
.field-group {
  margin-bottom: 16px;
}

.field-label {
  display: block;
  font-size: var(--md-label-large);
  font-weight: 500;
  color: var(--md-on-surface);
  margin-bottom: 8px;
}

.required-dot {
  color: var(--md-error);
}

.optional-tag {
  font-size: var(--md-label-small);
  color: var(--md-on-surface-variant);
  font-weight: 400;
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
