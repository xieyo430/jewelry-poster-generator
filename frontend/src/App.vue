<script setup>
import { onMounted, watch, ref } from 'vue'
import { usePosterStore } from './store/poster'
import { generateTonalPalette, applyPalette, resetPalette } from './utils/color'
import { toasts } from './composables/useToast'
import PosterWizard from './components/PosterWizard.vue'
import PosterPreview from './components/PosterPreview.vue'
import SettingsDialog from './components/common/SettingsDialog.vue'
import WelcomeDialog from './components/common/WelcomeDialog.vue'

const showSettings = ref(false)
const showWelcome = ref(false)

const store = usePosterStore()
const dataLoading = ref(true)

onMounted(async () => {
  // 每次刷新重置海报状态，回到向导页
  store.$reset()
  store.generating = false
  store.generateError = null
  resetPalette()
  await store.loadStaticData()
  dataLoading.value = false

  // 每次刷新都弹出欢迎弹窗
  showWelcome.value = true
})

// Dynamic color: when festival changes, update CSS variables
watch(() => store.festival, (id) => {
  if (!id) { resetPalette(); return }
  const f = store.festivals.find(f => f.id === id)
  if (f?.primaryColor) {
    applyPalette(generateTonalPalette(f.primaryColor))
  }
}, { immediate: true })

// Re-apply palette after festivals load (fixes reload issue)
watch(() => store.festivals, () => {
  if (store.festival) {
    const f = store.festivals.find(f => f.id === store.festival)
    if (f?.primaryColor) applyPalette(generateTonalPalette(f.primaryColor))
  }
})
</script>

<template>
  <div class="app md3-transition-color">
    <!-- Top App Bar -->
    <header class="topbar md3-transition-color">
      <div class="topbar__inner">
        <div class="topbar__left">
          <div class="topbar__logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" :fill="store.festival ? 'var(--md-primary)' : '#1d1d1f'"/>
              <path d="M10.5 22L16 10.5L21.5 22H10.5Z" fill="none" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>
              <circle cx="16" cy="17.5" r="2.2" fill="#fff"/>
              <line x1="13" y1="19.5" x2="19" y2="19.5" stroke="#fff" stroke-width="0.8" opacity="0.5"/>
            </svg>
          </div>
          <div class="topbar__title">
            <span class="topbar__name">珠宝海报生成器</span>
            <span class="md3-badge md3-badge--filled">AI</span>
          </div>
        </div>
        <div class="topbar__right">
          <button class="topbar__icon-btn" @click="showWelcome = true" title="使用帮助">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </button>
          <button class="topbar__icon-btn" @click="showSettings = true" title="模型设置">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          </button>
          <span class="topbar__status">
            <span class="topbar__dot"></span>
            在线
          </span>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="main">
      <!-- Loading -->
      <div v-if="dataLoading" class="content-wrap">
        <div class="loading-wrap">
          <div class="loading-skeleton">
            <div class="md3-skeleton md3-skeleton--pill" style="width:100px;height:40px"></div>
            <div class="md3-skeleton md3-skeleton--pill" style="width:100px;height:40px"></div>
          </div>
          <div class="loading-body">
            <div class="loading-sidebar">
              <div class="md3-skeleton" style="width:60%;height:14px"></div>
              <div class="md3-skeleton" style="height:48px;border-radius:12px"></div>
              <div class="md3-skeleton" style="height:36px;width:70%;border-radius:12px"></div>
            </div>
            <div class="loading-main">
              <div class="md3-skeleton" style="width:200px;height:32px;border-radius:8px"></div>
              <div class="md3-skeleton" style="width:80%;height:14px"></div>
              <div class="md3-skeleton" style="width:50%;height:14px"></div>
              <div class="loading-grid">
                <div v-for="i in 6" :key="i" class="md3-skeleton" style="height:100px;border-radius:16px"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Wizard -->
      <div v-else-if="!store.frontPosterUrl && !store.carStickerUrl" class="content-wrap">
        <PosterWizard />
      </div>

      <!-- Preview -->
      <div v-else class="content-wrap">
        <PosterPreview />
      </div>
    </main>

    <!-- Toast container -->
    <Teleport to="body">
      <div class="toast-container">
        <TransitionGroup name="toast">
          <div
            v-for="toast in toasts"
            :key="toast.id"
            :class="['toast-item', `toast--${toast.type}`]"
          >
            <span class="toast-icon">
              {{ toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : toast.type === 'warning' ? '!' : 'i' }}
            </span>
            <span class="toast-msg">{{ toast.msg }}</span>
          </div>
        </TransitionGroup>
      </div>
    </Teleport>

    <!-- Settings Dialog -->
    <SettingsDialog v-if="showSettings" @close="showSettings = false" />

    <!-- Welcome Dialog -->
    <WelcomeDialog v-if="showWelcome" @close="showWelcome = false" />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--md-surface);
}

/* Top App Bar */
.topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--md-surface-container);
  box-shadow: var(--md-elevation-2);
}
.topbar__inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.topbar__left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.topbar__logo {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.15));
}
.topbar__title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.topbar__name {
  font-size: 18px;
  font-weight: 500;
  color: var(--md-on-surface);
  letter-spacing: -0.2px;
}
.topbar__right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.topbar__icon-btn {
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
  transition: background var(--md-duration-short4) var(--md-easing-standard), color var(--md-duration-short4) var(--md-easing-standard);
}
.topbar__icon-btn:hover {
  background: var(--md-surface-container-highest);
  color: var(--md-on-surface);
}
.topbar__status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--md-body-small);
  color: var(--md-on-surface-variant);
  font-weight: 500;
}
.topbar__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #34c759;
  animation: pulse 2s ease infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Main */
.main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 32px 40px 60px;
}
.content-wrap {
  width: 100%;
  max-width: 1200px;
  animation: md3-slide-up 0.4s var(--md-easing-emphasized-decel);
}

/* Loading */
.loading-wrap {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.loading-skeleton {
  display: flex;
  gap: 8px;
}
.loading-body {
  display: flex;
  gap: 28px;
}
.loading-sidebar {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.loading-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.loading-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 1024px) {
  .topbar__inner { padding: 0 24px; }
  .main { padding: 24px; }
  .loading-body { flex-direction: column; }
  .loading-sidebar { width: 100%; }
}
@media (max-width: 768px) {
  .topbar__inner { padding: 0 16px; height: 56px; }
  .topbar__name { font-size: 16px; }
  .main { padding: 16px; }
}

/* Toast */
.toast-container {
  position: fixed;
  top: 80px;
  right: 24px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}
.toast-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: var(--md-shape-medium);
  background: var(--md-inverse-surface);
  color: var(--md-inverse-on-surface);
  font-size: var(--md-body-medium);
  box-shadow: var(--md-elevation-3);
  pointer-events: auto;
  min-width: 240px;
  max-width: 400px;
}
.toast--success { border-left: 4px solid #34c759; }
.toast--error { border-left: 4px solid var(--md-error); }
.toast--warning { border-left: 4px solid #f0a020; }
.toast--info { border-left: 4px solid var(--md-primary); }
.toast-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.toast--success .toast-icon { background: #34c759; color: #fff; }
.toast--error .toast-icon { background: var(--md-error); color: #fff; }
.toast--warning .toast-icon { background: #f0a020; color: #fff; }
.toast--info .toast-icon { background: var(--md-primary); color: #fff; }
.toast-msg { flex: 1; }

.toast-enter-active { transition: all 0.3s var(--md-easing-emphasized-decel); }
.toast-leave-active { transition: all 0.2s var(--md-easing-emphasized-accel); }
.toast-enter-from { opacity: 0; transform: translateX(40px); }
.toast-leave-to { opacity: 0; transform: translateX(40px); }
</style>
