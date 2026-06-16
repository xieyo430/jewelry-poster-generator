<script setup>
import { onMounted } from 'vue'
import { usePosterStore } from './store/poster'
import PosterWizard from './components/PosterWizard.vue'
import PosterPreview from './components/PosterPreview.vue'

const store = usePosterStore()

onMounted(() => {
  store.generating = false
  store.generateError = null
  store.loadStaticData()
})
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>珠宝节日海报生成器</h1>
      <p class="subtitle">AI 智能生成 · 多种物料 · 快速出图</p>
    </header>

    <main class="app-main">
      <div v-if="!store.frontPosterUrl && !store.carStickerUrl" class="wizard-section">
        <PosterWizard />
      </div>
      <div v-else class="preview-section">
        <PosterPreview />
      </div>
    </main>
  </div>
</template>

<style>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  text-align: center;
  padding: 24px 16px 12px;
  border-bottom: 1px solid #1e1e3a;
}

.app-header h1 {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #FFD700, #FF6B35, #FF1493);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-header .subtitle {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.app-main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 20px;
}

.wizard-section,
.preview-section {
  width: 100%;
  max-width: 1400px;
}

@media (max-width: 768px) {
  .app-header h1 { font-size: 20px; }
  .app-main { padding: 12px; }
}
</style>
