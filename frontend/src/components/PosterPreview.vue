<script setup>
import { computed } from 'vue'
import { usePosterStore } from '../store/poster'
import api from '../api'

const store = usePosterStore()

const hasFront = computed(() => !!store.frontPosterUrl)
const hasBack = computed(() => !!store.backPosterUrl)
const hasCarSticker = computed(() => !!store.carStickerUrl)
const isPoster = computed(() => !store.carStickerUrl)

const handleSaveProject = async () => {
  try {
    const projectData = {
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
    }
    const res = await api.saveProject(projectData)
    if (res.data.success) {
      alert(`项目已保存，ID: ${res.data.projectId}`)
    }
  } catch (e) {
    console.error('保存失败:', e)
  }
}

const handleDownload = async (url, name) => {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${name}.png`
    a.click()
    URL.revokeObjectURL(a.href)
  } catch (e) {
    console.error('下载失败:', e)
  }
}

const handleRestart = () => {
  store.resetAll()
  store.loadStaticData()
}

const handleEdit = () => {
  // 批量更新，清除海报URL以切回向导，保留其余数据
  store.$patch({
    frontPosterUrl: null,
    backPosterUrl: null,
    carStickerUrl: null,
    currentStep: store.materialType === 'car-sticker' ? 1 : 3,
  })
}

const handleRegenerate = async () => {
  if (store.materialType === 'car-sticker') {
    await store.generateCarSticker()
  } else {
    await store.generatePosters()
  }
}
</script>

<template>
  <div class="preview-container">
    <div class="preview-header">
      <h2>生成结果</h2>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="handleRestart">← 重新制作</button>
        <button class="btn btn-edit" @click="handleEdit">✏️ 修改内容</button>
        <button class="btn btn-regenerate" @click="handleRegenerate" :disabled="store.generating">
          <span v-if="store.generating">⏳ 重新生成中...</span>
          <span v-else>🔄 重新生成</span>
        </button>
        <button class="btn btn-primary" @click="handleSaveProject">💾 保存项目</button>
      </div>
    </div>

    <!-- 车贴 -->
    <div class="posters-row" v-if="hasCarSticker">
      <div class="poster-card car-sticker-card">
        <div class="poster-label">
          <span>🚗 车贴</span>
          <button class="download-btn" @click="handleDownload(store.carStickerUrl, '车贴')">⬇ 下载</button>
        </div>
        <div class="poster-image-wrapper">
          <img :src="store.carStickerUrl" alt="车贴" class="poster-image" />
        </div>
      </div>
    </div>

    <!-- 海报（正反面） -->
    <div class="posters-row" v-if="isPoster">
      <!-- 正面 -->
      <div class="poster-card" v-if="hasFront">
        <div class="poster-label">
          <span>正面</span>
          <button class="download-btn" @click="handleDownload(store.frontPosterUrl, '海报_正面')">⬇ 下载</button>
        </div>
        <div class="poster-image-wrapper">
          <img :src="store.frontPosterUrl" alt="正面海报" class="poster-image" />
        </div>
      </div>

      <!-- 反面 -->
      <div class="poster-card" v-if="hasBack">
        <div class="poster-label">
          <span>反面</span>
          <button class="download-btn" @click="handleDownload(store.backPosterUrl, '海报_反面')">⬇ 下载</button>
        </div>
        <div class="poster-image-wrapper">
          <img :src="store.backPosterUrl" alt="反面海报" class="poster-image" />
        </div>
      </div>
    </div>

    <!-- 信息摘要 -->
    <div class="summary-card">
      <h3>{{ isPoster ? '海报内容摘要' : '车贴信息' }}</h3>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-label">品牌</span>
          <span class="summary-value">{{ store.brands.find(b => b.id === store.brand)?.name || store.brand }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">节日</span>
          <span class="summary-value">{{ store.festivals.find(f => f.id === store.festival)?.name || store.festival }}</span>
        </div>
        <template v-if="isPoster">
          <div class="summary-item">
            <span class="summary-label">主爆点</span>
            <span class="summary-value">{{ store.mainPromotion.content }}</span>
          </div>
          <div class="summary-item" v-if="store.secondaryPromotion.content">
            <span class="summary-label">次爆点</span>
            <span class="summary-value">{{ store.secondaryPromotion.content }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">反面活动</span>
            <span class="summary-value">{{ store.activities.length }} 个</span>
          </div>
        </template>
        <template v-else>
          <div class="summary-item">
            <span class="summary-label">尺寸</span>
            <span class="summary-value">{{ store.carStickerSize.width }} × {{ store.carStickerSize.height }}</span>
          </div>
          <div class="summary-item" v-if="store.carStickerText">
            <span class="summary-label">文案</span>
            <span class="summary-value">{{ store.carStickerText }}</span>
          </div>
          <div class="summary-item" v-if="store.merchantInfo.phone">
            <span class="summary-label">电话</span>
            <span class="summary-value">{{ store.merchantInfo.phone }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-container {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.preview-header h2 { font-size: 22px; color: #FFD700; }

.header-actions { display: flex; gap: 12px; }

/* 海报并排展示 */
.posters-row {
  display: flex;
  gap: 32px;
  justify-content: center;
  align-items: flex-start;
  flex-wrap: wrap;
}

.poster-card {
  flex: 1;
  min-width: 300px;
  max-width: 450px;
}

.car-sticker-card {
  max-width: 700px;
}

.poster-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #13132b;
  border: 1px solid #1e1e3a;
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  font-size: 14px;
  font-weight: 600;
  color: #FFD700;
}

.download-btn {
  background: transparent;
  border: 1px solid #2a2a4a;
  color: #999;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.download-btn:hover { border-color: #FFD700; color: #FFD700; }

.poster-image-wrapper {
  border: 1px solid #1e1e3a;
  border-radius: 0 0 12px 12px;
  overflow: hidden;
  background: #0d0d1a;
}

.poster-image {
  width: 100%;
  height: auto;
  display: block;
}

/* 摘要 */
.summary-card {
  margin-top: 32px;
  background: #13132b;
  border: 1px solid #1e1e3a;
  border-radius: 12px;
  padding: 20px;
}

.summary-card h3 { font-size: 14px; color: #ccc; margin-bottom: 16px; }

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
.summary-value { font-size: 14px; color: #e0e0e0; }

/* 按钮 */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #FFD700, #FF6B35);
  color: #000;
}

.btn-secondary {
  background: transparent;
  border: 1px solid #2a2a4a;
  color: #999;
}
.btn-secondary:hover { border-color: #666; color: #ccc; }

.btn-regenerate {
  background: transparent;
  border: 1px solid #FFD700;
  color: #FFD700;
}
.btn-regenerate:hover:not(:disabled) { background: rgba(255, 215, 0, 0.1); }
.btn-regenerate:disabled { opacity: 0.35; cursor: not-allowed; }

.btn-edit {
  background: transparent;
  border: 1px solid #4a9eff;
  color: #4a9eff;
}
.btn-edit:hover { background: rgba(74, 158, 255, 0.1); }

@media (max-width: 768px) {
  .poster-card { min-width: 100%; max-width: 100%; }
  .preview-header { flex-direction: column; gap: 12px; }
}
</style>
