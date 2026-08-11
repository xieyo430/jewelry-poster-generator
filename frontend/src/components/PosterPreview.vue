<script setup>
import { ref, computed } from 'vue'
import { usePosterStore } from '../store/poster'
import api from '../api'
import { useToast } from '../composables/useToast'
import EnhancePanel from './EnhancePanel.vue'

const toast = useToast()

const store = usePosterStore()
const enhancing = computed(() => store?.enhancing ?? false)
const generateError = computed(() => store?.generateError ?? null)

const showEnhance = ref(false)
const enhanceTarget = ref('back')
const showOriginalFront = ref(false)
const showOriginalBack = ref(false)
const lightboxUrl = ref(null)
const downloading = ref(new Set())

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

const brandName = computed(() => store.brands.find(b => b.id === store.brand)?.name || store.brand)
const festivalName = computed(() => store.festivals.find(f => f.id === store.festival)?.name || store.festival)

const handleSaveProject = async () => {
  try {
    const res = await api.saveProject({
      materialType: store.materialType,
      festival: store.festival,
      brand: store.brand,
      startDate: store.startDate,
      endDate: store.endDate,
      mainPromotion: store.mainPromotion,
      secondaryPromotion: store.secondaryPromotion,
      activities: store.activities,
      merchantInfo: store.merchantInfo,
      frontPosterUrl: store.frontPosterUrl,
      backPosterUrl: store.backPosterUrl,
      carStickerUrl: store.carStickerUrl,
      carStickerText: store.carStickerText,
      carStickerSize: store.carStickerSize,
      colorScheme: store.colorScheme,
    })
    if (res.data.success) toast.success(`项目已保存 (ID: ${res.data.projectId})`)
  } catch (e) {
    toast.error('保存失败：' + (e.message || '网络错误'))
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

const handleRegenerate = async () => {
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
    <!-- Hero section -->
    <div class="md3-card md3-card--filled result-hero">
      <span class="md3-badge md3-badge--tonal">AI 生成完成</span>
      <h1 class="result-title">你的海报已就绪</h1>
      <p class="result-sub">点击图片可放大查看，确认无误后保存或下载</p>
      <div class="hero-actions">
        <button class="md3-btn md3-btn--filled" @click="handleSaveProject">
          保存项目
        </button>
        <button class="md3-btn md3-btn--tonal" :disabled="store.generating" @click="handleRegenerate">
          <span v-if="store.generating" class="md3-spinner md3-spinner--small"><span class="md3-spinner__circle"></span></span>
          <span v-else>重新生成</span>
        </button>
        <button class="md3-btn md3-btn--outlined" @click="handleEdit">
          修改
        </button>
        <button class="md3-btn md3-btn--text" @click="handleRestart">
          重新开始
        </button>
      </div>
    </div>

    <!-- Car sticker -->
    <div v-if="hasCarSticker" class="poster-row">
      <div class="md3-card md3-card--elevated poster-card poster-card--wide">
        <div class="poster-head">
          <span class="poster-label">车贴</span>
          <button class="md3-btn md3-btn--filled md3-btn--small" @click="handleDownload(store.carStickerUrl, '车贴')">
            下载
          </button>
        </div>
        <div class="poster-img-wrap" @click="openLightbox(store.carStickerUrl)">
          <img :src="store.carStickerUrl" alt="车贴" />
        </div>
      </div>
    </div>

    <!-- Poster front/back -->
    <div v-if="isPoster" class="poster-row">
      <!-- Front -->
      <div v-if="hasFront" class="md3-card md3-card--elevated poster-card">
        <div class="poster-head">
          <span class="poster-label">
            正面
            <span v-if="hasEnhancedFront && !showOriginalFront" class="enhanced-badge">已优化</span>
          </span>
          <div class="poster-actions">
            <button v-if="hasEnhancedFront" class="md3-btn md3-btn--text md3-btn--small" @click="showOriginalFront = !showOriginalFront">
              {{ showOriginalFront ? '看优化版' : '看原图' }}
            </button>
            <button v-if="hasEnhancedFront" class="md3-btn md3-btn--text md3-btn--small" style="color: var(--md-error)" @click="store.revertEnhancement('front')">
              撤销
            </button>
            <button class="md3-btn md3-btn--text md3-btn--small" :disabled="store.enhancing" @click="openEnhance('front')">
              AI 优化
            </button>
            <button class="md3-icon-btn md3-icon-btn--outlined" @click="handleDownload(displayFrontUrl, '海报_正面')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            </button>
          </div>
        </div>
        <div class="poster-img-wrap" @click="openLightbox(displayFrontUrl)">
          <img :src="displayFrontUrl" alt="正面海报" />
        </div>
      </div>

      <!-- Back -->
      <div v-if="hasBack" class="md3-card md3-card--elevated poster-card">
        <div class="poster-head">
          <span class="poster-label">
            反面
            <span v-if="hasEnhancedBack && !showOriginalBack" class="enhanced-badge">已优化</span>
          </span>
          <div class="poster-actions">
            <button v-if="hasEnhancedBack" class="md3-btn md3-btn--text md3-btn--small" @click="showOriginalBack = !showOriginalBack">
              {{ showOriginalBack ? '看优化版' : '看原图' }}
            </button>
            <button v-if="hasEnhancedBack" class="md3-btn md3-btn--text md3-btn--small" style="color: var(--md-error)" @click="store.revertEnhancement('back')">
              撤销
            </button>
            <button class="md3-btn md3-btn--text md3-btn--small" :disabled="store.enhancing" @click="openEnhance('back')">
              AI 优化
            </button>
            <button class="md3-icon-btn md3-icon-btn--outlined" @click="handleDownload(displayBackUrl, '海报_反面')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            </button>
          </div>
        </div>
        <div class="poster-img-wrap" @click="openLightbox(displayBackUrl)">
          <img :src="displayBackUrl" alt="反面海报" />
        </div>
      </div>
    </div>

    <!-- Enhancing indicator -->
    <div v-if="store.enhancing" class="md3-card md3-card--outlined enhancing-bar">
      <span class="md3-spinner md3-spinner--small"><span class="md3-spinner__circle"></span></span>
      <span>AI 正在优化海报...</span>
    </div>

    <!-- Summary card -->
    <div class="md3-card md3-card--filled summary-card">
      <div class="summary-header">{{ isPoster ? '海报信息' : '车贴信息' }}</div>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-label">品牌</span>
          <span class="summary-value">{{ brandName }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">节日</span>
          <span class="summary-value">{{ festivalName }}</span>
        </div>
        <template v-if="isPoster">
          <div class="summary-item">
            <span class="summary-label">主爆点</span>
            <span class="summary-value">{{ store.mainPromotion.content }}</span>
          </div>
          <div v-if="store.secondaryPromotion.content" class="summary-item">
            <span class="summary-label">次爆点</span>
            <span class="summary-value">{{ store.secondaryPromotion.content }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">活动数</span>
            <span class="summary-value">{{ store.activities.length }} 个</span>
          </div>
        </template>
        <template v-else>
          <div class="summary-item">
            <span class="summary-label">尺寸</span>
            <span class="summary-value">{{ store.carStickerSize.width }} x {{ store.carStickerSize.height }}</span>
          </div>
          <div v-if="store.carStickerText" class="summary-item">
            <span class="summary-label">文案</span>
            <span class="summary-value">{{ store.carStickerText }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <Transition name="lightbox-fade">
        <div v-if="lightboxUrl" class="lightbox-overlay" @click.self="closeLightbox">
          <button class="lightbox-close" @click="closeLightbox">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <img :src="lightboxUrl" class="lightbox-img" alt="预览" />
        </div>
      </Transition>
    </Teleport>

    <!-- Enhance dialog -->
    <EnhancePanel
      v-if="showEnhance"
      :target="enhanceTarget"
      :show="showEnhance"
      @update:show="showEnhance = $event"
    />
  </div>
  <div v-else class="preview" style="padding: 40px; text-align: center; color: var(--md-on-surface-variant);">
    加载中...
  </div>
</template>

<style scoped>
.preview {
  animation: fadeUp 0.4s ease;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Hero */
.result-hero {
  margin-bottom: 28px;
  border-radius: var(--md-shape-extra-large);
  padding: 28px 32px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--md-primary) 8%, var(--md-surface)) 0%, var(--md-surface) 100%);
}

.result-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--md-on-surface);
  letter-spacing: -0.5px;
  margin: 12px 0 4px;
}

.result-sub {
  font-size: var(--md-body-medium);
  color: var(--md-on-surface-variant);
  margin: 0 0 20px;
}

.hero-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Poster cards */
.poster-row {
  display: flex;
  gap: 20px;
  justify-content: center;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 28px;
}

.poster-card {
  flex: 1;
  min-width: 340px;
  max-width: 540px;
  border-radius: var(--md-shape-large);
  overflow: hidden;
}

.poster-card--wide {
  max-width: 800px;
  flex: 1 1 100%;
}

.poster-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--md-outline-variant);
}

.poster-label {
  font-size: var(--md-title-small);
  font-weight: 600;
  color: var(--md-on-surface);
  display: flex;
  align-items: center;
  gap: 6px;
}

.enhanced-badge {
  font-size: 11px;
  font-weight: 500;
  color: var(--md-on-primary);
  background: var(--md-primary);
  padding: 2px 8px;
  border-radius: 10px;
}

.poster-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.poster-img-wrap {
  background: var(--md-surface-container-low);
  position: relative;
  cursor: zoom-in;
}

.poster-img-wrap img {
  width: 100%;
  height: auto;
  display: block;
}

/* Enhancing bar */
.enhancing-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  margin-bottom: 24px;
  font-size: var(--md-body-medium);
  color: var(--md-on-surface);
}

/* Summary */
.summary-card {
  padding: 20px;
  border-radius: var(--md-shape-large);
}

.summary-header {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--md-on-surface-variant);
  margin-bottom: 16px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-label {
  font-size: var(--md-label-small);
  color: var(--md-on-surface-variant);
  font-weight: 500;
}

.summary-value {
  font-size: var(--md-body-medium);
  color: var(--md-on-surface);
}

/* Lightbox */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 40px;
}

.lightbox-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--md-duration-short4) var(--md-easing-standard);
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.lightbox-img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: var(--md-shape-medium);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.lightbox-fade-enter-active {
  transition: all var(--md-duration-medium2) var(--md-easing-standard);
}

.lightbox-fade-leave-active {
  transition: all var(--md-duration-short4) var(--md-easing-standard);
}

.lightbox-fade-enter-from,
.lightbox-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .poster-card {
    min-width: 100%;
  }

  .result-title {
    font-size: 22px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
