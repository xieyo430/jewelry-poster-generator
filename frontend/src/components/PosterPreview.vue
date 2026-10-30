<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePosterStore } from '../store/poster'
import api from '../api'
import { useToast } from '../composables/useToast'
import EnhancePanel from './EnhancePanel.vue'
import EdButton from './common/EdButton.vue'
import EdIcon from './common/EdIcon.vue'

const toast = useToast()
const route = useRoute()
const router = useRouter()

const store = usePosterStore()
const enhancing = computed(() => store?.enhancing ?? false)
const generateError = computed(() => store?.generateError ?? null)

const showEnhance = ref(false)
const enhanceTarget = ref('back')
const showOriginalFront = ref(false)
const showOriginalBack = ref(false)
const lightboxUrl = ref(null)
const downloading = ref(new Set())
const saving = ref(false)

const displayFrontUrl = computed(() =>
  store.enhancedFrontUrl && !showOriginalFront.value ? store.enhancedFrontUrl : store.frontPosterUrl
)
const displayBackUrl = computed(() =>
  store.enhancedBackUrl && !showOriginalBack.value ? store.enhancedBackUrl : store.backPosterUrl
)
const hasEnhancedFront = computed(() => !!store.enhancedFrontUrl)
const hasEnhancedBack = computed(() => !!store.enhancedBackUrl)
const hasFront = computed(() => !!store.frontPosterUrl)
const hasBack = computed(() => !!store.backPosterUrl)
const hasCarSticker = computed(() => !!store.carStickerUrl)
const isPoster = computed(() => !store.carStickerUrl)

const brandName = computed(() => store.displayBrandName || store.brand)
const festivalName = computed(() => store.festivals.find(f => f.id === store.festival)?.name || store.festival)

const handleSaveProject = async () => {
  if (saving.value) return
  saving.value = true
  store.projectStatus = 'saving'
  store.saveError = null
  try {
    const projectTitle = store.projectTitle || store.suggestedProjectTitle
    const rawData = { ...store.$state }
    delete rawData.frontPosterUrl
    delete rawData.backPosterUrl
    delete rawData.carStickerUrl
    delete rawData.backBgImageUrl
    delete rawData.enhancedFrontUrl
    delete rawData.enhancedBackUrl
    const res = await api.saveProject({
      title: projectTitle,
      projectId: store.projectId || undefined,
      materialType: store.materialType,
      festivalCode: store.festival,
      brandCode: store.industry === 'jewelry' ? store.brand : null,
      startDate: store.startDate,
      endDate: store.endDate,
      theme: store.theme,
      subtitle: store.subtitle,
      mainPromotion: store.mainPromotion,
      secondaryPromotion: store.secondaryPromotion,
      activities: store.activities,
      merchantInfo: store.merchantInfo,
      frontPosterUrl: store.frontPosterUrl,
      backPosterUrl: store.backPosterUrl,
      backBgUrl: store.backBgImageUrl,
      carStickerUrl: store.carStickerUrl,
      carStickerText: store.carStickerText,
      carStickerSize: store.carStickerSize,
      colorScheme: store.colorScheme,
      rawData,
    })
    if (res.data.success) {
      const savedProjectId = res.data.projectId
      store.projectId = savedProjectId
      store.projectTitle = projectTitle
      store.projectSaved = true
      store.projectStatus = 'saved'
      await router.replace({
        name: 'studio',
        query: {
          ...route.query,
          projectId: savedProjectId,
          industry: store.industry,
        },
      })
      toast.success(`项目已保存 (ID: ${savedProjectId})`)
    }
  } catch (e) {
    store.projectStatus = 'error'
    store.saveError = e.detail || e.message || '网络错误'
    toast.error('保存失败：' + (e.detail || e.message || '网络错误'))
  } finally {
    saving.value = false
  }
}

const handleDownload = async (url, name) => {
  const key = name
  if (downloading.value.has(key)) return
  downloading.value.add(key)
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`下载失败 (${res.status})`)
    const blob = await res.blob()
    const a = document.createElement('a')
    const objectUrl = URL.createObjectURL(blob)
    a.href = objectUrl
    a.download = `${name}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  } catch (e) {
    toast.error('下载失败：' + (e.message || '网络错误'))
  } finally {
    downloading.value.delete(key)
  }
}

const handleRestart = () => {
  store.resetAll()
}

const handleEdit = () => {
  store.$patch({
    frontPosterUrl: null,
    backPosterUrl: null,
    carStickerUrl: null,
    enhancedFrontUrl: null,
    enhancedBackUrl: null,
    backBgImageUrl: null,
    generateError: null,
    currentStep: 3,
  })
}

const handleRegenerate = async (event) => {
  event?.preventDefault()
  if (store.generating) return

  // 重新生成属于当前工作台操作，不能因为结果页状态丢失而回到首页。
  if (route.name !== 'studio') {
    await router.replace({
      name: 'studio',
      query: {
        ...route.query,
        industry: store.industry === 'food' ? 'food' : store.industry === 'electronics' ? 'electronics' : 'jewelry',
        regenerate: '1',
      },
    })
  }
  store.frontPosterUrl = null
  store.backPosterUrl = null
  store.carStickerUrl = null
  store.backBgImageUrl = null
  store.enhancedFrontUrl = null
  store.enhancedBackUrl = null
  store.currentStep = 3
  if (store.materialType === 'car-sticker') await store.generateCarSticker()
  else await store.generatePosters()
}

const openLightbox = (url) => { lightboxUrl.value = url }
const closeLightbox = () => { lightboxUrl.value = null }

const openEnhance = (target) => {
  enhanceTarget.value = target
  showEnhance.value = true
}
</script>

<template>
  <div v-if="store" class="preview">
    <header class="pv-hero">
      <span class="ed-tag">AI 生成完成</span>
      <h1 class="pv-hero__title">你的海报已就绪</h1>
      <p class="pv-hero__sub ed-meta">点击图片可放大查看，确认无误后保存或下载</p>
      <div class="pv-hero__actions">
        <EdButton variant="solid" :loading="saving" :disabled="saving" @click="handleSaveProject">保存项目</EdButton>
        <EdButton variant="outline" :loading="store.generating" @click="handleRegenerate">重新生成</EdButton>
        <EdButton variant="outline" @click="handleEdit">修改</EdButton>
        <EdButton variant="text" @click="handleRestart">重新开始</EdButton>
      </div>
    </header>

    <div v-if="hasCarSticker" class="plates">
      <section class="plate">
        <img
          class="plate__img"
          :src="store.carStickerUrl"
          alt="车贴"
          @click="openLightbox(store.carStickerUrl)"
        >
        <div class="plate__cap">
          <span class="plate__no ed-num">图版 01</span>
          <span class="plate__name ed-meta">车贴.png</span>
          <span class="plate__ops">
            <EdButton
              variant="text" size="sm"
              :loading="downloading.has('车贴')"
              @click="handleDownload(store.carStickerUrl, '车贴')"
            ><EdIcon name="download" :size="13" />下载</EdButton>
            <EdButton variant="text" size="sm" @click="openLightbox(store.carStickerUrl)">
              <EdIcon name="zoom-in" :size="13" />放大
            </EdButton>
          </span>
        </div>
      </section>
    </div>

    <div v-if="isPoster" class="plates plates--pair">
      <section v-if="hasFront" class="plate">
        <img
          class="plate__img"
          :src="displayFrontUrl"
          alt="正面海报"
          @click="openLightbox(displayFrontUrl)"
        >
        <div class="plate__cap">
          <span class="plate__no ed-num">图版 01</span>
          <span class="plate__name ed-meta">海报_正面.png</span>
          <span v-if="hasEnhancedFront && !showOriginalFront" class="ed-tag plate__tag">已优化</span>
          <span class="plate__ops">
            <EdButton v-if="hasEnhancedFront" variant="text" size="sm" @click="showOriginalFront = !showOriginalFront">
              {{ showOriginalFront ? '看优化版' : '看原图' }}
            </EdButton>
            <EdButton v-if="hasEnhancedFront" variant="text" size="sm" class="plate__danger" @click="store.revertEnhancement('front')">
              撤销
            </EdButton>
            <EdButton variant="text" size="sm" :disabled="store.enhancing" @click="openEnhance('front')">
              <EdIcon name="sparkle" :size="13" />优化
            </EdButton>
            <EdButton variant="text" size="sm" @click="openLightbox(displayFrontUrl)">
              <EdIcon name="zoom-in" :size="13" />放大
            </EdButton>
            <EdButton
              variant="text" size="sm"
              :loading="downloading.has('海报_正面')"
              @click="handleDownload(displayFrontUrl, '海报_正面')"
            ><EdIcon name="download" :size="13" />下载</EdButton>
          </span>
        </div>
      </section>

      <section v-if="hasBack" class="plate">
        <img
          class="plate__img"
          :src="displayBackUrl"
          alt="反面海报"
          @click="openLightbox(displayBackUrl)"
        >
        <div class="plate__cap">
          <span class="plate__no ed-num">图版 02</span>
          <span class="plate__name ed-meta">海报_反面.png</span>
          <span v-if="hasEnhancedBack && !showOriginalBack" class="ed-tag plate__tag">已优化</span>
          <span class="plate__ops">
            <EdButton v-if="hasEnhancedBack" variant="text" size="sm" @click="showOriginalBack = !showOriginalBack">
              {{ showOriginalBack ? '看优化版' : '看原图' }}
            </EdButton>
            <EdButton v-if="hasEnhancedBack" variant="text" size="sm" class="plate__danger" @click="store.revertEnhancement('back')">
              撤销
            </EdButton>
            <EdButton variant="text" size="sm" :disabled="store.enhancing" @click="openEnhance('back')">
              <EdIcon name="sparkle" :size="13" />优化
            </EdButton>
            <EdButton variant="text" size="sm" @click="openLightbox(displayBackUrl)">
              <EdIcon name="zoom-in" :size="13" />放大
            </EdButton>
            <EdButton
              variant="text" size="sm"
              :loading="downloading.has('海报_反面')"
              @click="handleDownload(displayBackUrl, '海报_反面')"
            ><EdIcon name="download" :size="13" />下载</EdButton>
          </span>
        </div>
      </section>
    </div>

    <div v-if="store.enhancing" class="note pv__note">
      <EdIcon name="sparkle" :size="13" class="pv__note-icon" />
      <span>AI 正在优化海报...</span>
    </div>

    <section class="pv-summary">
      <h3 class="pv-summary__head ed-label">{{ isPoster ? '海报信息' : '车贴信息' }}</h3>
      <dl class="summary">
        <dt class="ed-meta">品牌</dt>
        <dd>{{ brandName }}</dd>
        <dt class="ed-meta">节日</dt>
        <dd>{{ festivalName }}</dd>
        <template v-if="isPoster">
          <dt class="ed-meta">主爆点</dt>
          <dd>{{ store.mainPromotion.content }}</dd>
          <template v-if="store.secondaryPromotion.content">
            <dt class="ed-meta">次爆点</dt>
            <dd>{{ store.secondaryPromotion.content }}</dd>
          </template>
          <dt class="ed-meta">活动数</dt>
          <dd>{{ store.activities.length }} 个</dd>
        </template>
        <template v-else>
          <dt class="ed-meta">尺寸</dt>
          <dd>{{ store.carStickerSize.width }} × {{ store.carStickerSize.height }}</dd>
          <template v-if="store.carStickerText">
            <dt class="ed-meta">文案</dt>
            <dd>{{ store.carStickerText }}</dd>
          </template>
        </template>
      </dl>
    </section>

    <Teleport to="body">
      <Transition name="pv-lb">
        <div v-if="lightboxUrl" class="lightbox" @click.self="closeLightbox">
          <button class="lightbox__close" @click="closeLightbox" aria-label="关闭">
            <EdIcon name="close" :size="20" />
          </button>
          <img :src="lightboxUrl" class="lightbox__img" alt="预览" />
        </div>
      </Transition>
    </Teleport>

    <EnhancePanel
      v-if="showEnhance"
      :target="enhanceTarget"
      :show="showEnhance"
      @update:show="showEnhance = $event"
    />
  </div>
  <div v-else class="preview pv-loading ed-meta">加载中...</div>
</template>

<style scoped>
.preview {
  display: flex;
  flex-direction: column;
  gap: var(--ed-space-7);
}

.pv-hero__title {
  margin: var(--ed-space-3) 0 var(--ed-space-2);
  font-family: var(--ed-serif);
  font-size: 26px;
  font-weight: 700;
  color: var(--ed-ink);
}
.pv-hero__sub { text-transform: none; }
.pv-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ed-space-2);
  margin-top: var(--ed-space-5);
}

.plates { display: flex; flex-direction: column; gap: var(--ed-space-7); }

.plate { display: block; }

.plate__img {
  display: block;
  width: 100%;
  border: 1px solid var(--ed-rule);
  background: var(--ed-paper-deep);
  cursor: zoom-in;
}

.plate__cap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ed-space-3);
  padding-top: var(--ed-space-3);
  border-top: 1px solid var(--ed-rule);
  margin-top: var(--ed-space-3);
}
.plate__no { flex-shrink: 0; }
.plate__name {
  flex: 1 1 120px;
  min-width: 0;
  text-transform: none;
  letter-spacing: .02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.plate__tag { flex-shrink: 0; }
.plate__ops { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ed-space-1); flex-shrink: 0; }
.plate__danger { color: var(--ed-danger); }

.pv__note { gap: var(--ed-space-2); }
.pv__note-icon { flex-shrink: 0; }

.pv-summary__head { margin-bottom: var(--ed-space-4); }
.summary {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: var(--ed-space-2) var(--ed-space-4);
  margin: 0;
}
.summary dd { margin: 0; font-family: var(--ed-serif); font-size: 14px; color: var(--ed-ink); }

.lightbox {
  position: fixed;
  inset: 0;
  z-index: 1500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--ed-space-5);
  background: rgba(22, 21, 15, .88);
}
.lightbox__img { max-width: 100%; max-height: 88vh; border: 1px solid var(--ed-paper); }
.lightbox__close {
  position: absolute;
  top: var(--ed-space-5);
  right: var(--ed-space-5);
  display: flex;
  border: 0;
  background: transparent;
  color: var(--ed-paper);
  cursor: pointer;
}

.pv-lb-enter-active { transition: opacity var(--ed-fast) var(--ed-ease); }
.pv-lb-leave-active { transition: opacity var(--ed-fast) var(--ed-ease); }
.pv-lb-enter-from,
.pv-lb-leave-to { opacity: 0; }

.pv-loading { position: relative; min-height: 86px; padding: 56px var(--ed-space-7) var(--ed-space-4); text-align: center; text-transform: none; color: var(--ed-ink-faint); }
.pv-loading::before { content: ''; position: absolute; top: 22px; left: 50%; width: 22px; height: 22px; border: 2px solid color-mix(in srgb, var(--ed-accent) 22%, var(--ed-rule)); border-right-color: var(--ed-accent); border-radius: 50%; transform: translateX(-50%); animation: pv-loading-spin .85s linear infinite; }
.pv-loading::after { content: ''; position: absolute; top: 32px; left: calc(50% + 1px); width: 5px; height: 5px; border-radius: 50%; background: var(--ed-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ed-accent) 15%, transparent); animation: pv-loading-pulse 1.1s ease-in-out infinite; }
@keyframes pv-loading-spin { to { transform: translateX(-50%) rotate(360deg); } }
@keyframes pv-loading-pulse { 50% { opacity: .35; transform: scale(.7); } }

@media (min-width: 1000px) {
  .plates--pair { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ed-space-6); align-items: start; }
}
</style>
