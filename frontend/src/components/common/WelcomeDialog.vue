<script setup>
import { ref } from 'vue'

const emit = defineEmits(['close'])
const dontShowAgain = ref(false)
const page = ref(0)
const totalPages = 4

const nextPage = () => {
  if (page.value < totalPages - 1) page.value++
}
const prevPage = () => {
  if (page.value > 0) page.value--
}
const close = () => {
  if (dontShowAgain.value) {
    localStorage.setItem('haibao_skip_welcome', '1')
  }
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div class="welcome-overlay" @click.self="close">
      <div class="welcome-dialog">
        <!-- Header -->
        <div class="welcome-header">
          <div class="welcome-logo">
            <svg width="44" height="44" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="var(--md-primary)"/>
              <path d="M10.5 22L16 10.5L21.5 22H10.5Z" fill="none" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>
              <circle cx="16" cy="17.5" r="2.2" fill="#fff"/>
              <line x1="13" y1="19.5" x2="19" y2="19.5" stroke="#fff" stroke-width="0.8" opacity="0.5"/>
            </svg>
          </div>
          <h2 class="welcome-title">珠宝海报生成器</h2>
          <p class="welcome-subtitle">AI 智能设计，三步出图</p>
          <button class="welcome-close" @click="close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Page indicator -->
        <div class="page-indicator">
          <span v-for="i in totalPages" :key="i" :class="['dot', { active: page === i - 1 }]" @click="page = i - 1"></span>
        </div>

        <!-- Pages -->
        <div class="welcome-body">

          <!-- Page 1: 欢迎 + 功能介绍 -->
          <section v-show="page === 0" class="welcome-page">
            <div class="welcome-greeting">
              <h3 class="greeting-title">欢迎使用珠宝海报生成器</h3>
              <p class="greeting-desc">只需三步，AI 帮你生成专业级珠宝促销海报。<br>选择节日和品牌、填写优惠信息、一键生成，全程不到一分钟。</p>
            </div>
            <h3 class="section-label">核心功能</h3>
            <div class="feature-grid">
              <div class="feature-card">
                <div class="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--md-primary)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <path d="M3 15l5-5 4 4 4-4 5 5"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                  </svg>
                </div>
                <span class="feature-title">节日海报</span>
                <span class="feature-desc">春节、七夕、618...选择节日自动匹配配色和装饰风格</span>
              </div>
              <div class="feature-card">
                <div class="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--md-primary)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <span class="feature-title">品牌定制</span>
                <span class="feature-desc">内置周大福、六福等品牌 Logo，自动合成到海报</span>
              </div>
              <div class="feature-card">
                <div class="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--md-primary)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <path d="M8 21h8"/><path d="M12 17v4"/>
                    <path d="M7 8h4M7 11h6"/>
                  </svg>
                </div>
                <span class="feature-title">多种物料</span>
                <span class="feature-desc">正面海报、反面海报、车贴，一次填写同时生成</span>
              </div>
            </div>
            <div class="feature-highlight">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--md-primary)" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <span>AI 自动生成背景 + 精确排版文字，确保每张海报美观清晰</span>
            </div>
          </section>

          <!-- Page 2: 海报布局 -->
          <section v-show="page === 1" class="welcome-page">
            <h3 class="section-label">海报布局说明</h3>
            <div class="layout-diagrams">
              <!-- 正面 -->
              <div class="layout-card">
                <span class="layout-badge">正面海报</span>
                <svg class="layout-svg" viewBox="0 0 210 297" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <!-- background -->
                  <rect width="210" height="297" rx="6" fill="#1a1a3a"/>
                  <!-- brand -->
                  <rect x="52" y="8" width="106" height="16" rx="4" fill="rgba(255,255,255,0.15)"/>
                  <text x="105" y="20" text-anchor="middle" fill="#fff" font-size="10" font-weight="600">品牌名称</text>
                  <!-- theme -->
                  <text x="105" y="46" text-anchor="middle" fill="#FFD700" font-size="16" font-weight="700">活动主题</text>
                  <!-- subtitle -->
                  <text x="105" y="66" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="9">副标题</text>
                  <!-- date -->
                  <text x="105" y="84" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="8">活动时间</text>
                  <!-- color block -->
                  <rect x="8" y="100" width="194" height="185" rx="8" fill="#2a2a5a" stroke="#FFD700" stroke-width="1" stroke-opacity="0.5"/>
                  <!-- main title -->
                  <text x="105" y="138" text-anchor="middle" fill="#fff" font-size="18" font-weight="700">主爆点活动标题</text>
                  <!-- main subtitle -->
                  <text x="105" y="168" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="10">主爆点副标题</text>
                  <!-- divider -->
                  <line x1="55" y1="192" x2="155" y2="192" stroke="#FFD700" stroke-width="0.8"/>
                  <!-- sec title -->
                  <text x="105" y="216" text-anchor="middle" fill="#fff" font-size="14" font-weight="700">次爆点活动标题</text>
                  <!-- sec subtitle -->
                  <text x="105" y="244" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="9">次爆点副标题</text>
                  <!-- labels -->
                  <rect x="6" y="6" width="30" height="14" rx="4" fill="var(--md-primary)"/>
                  <text x="21" y="16" text-anchor="middle" fill="#fff" font-size="8" font-weight="600">品牌</text>
                  <rect x="6" y="32" width="30" height="14" rx="4" fill="var(--md-primary)"/>
                  <text x="21" y="42" text-anchor="middle" fill="#fff" font-size="8" font-weight="600">主题</text>
                  <rect x="6" y="98" width="40" height="14" rx="4" fill="var(--md-primary)"/>
                  <text x="26" y="108" text-anchor="middle" fill="#fff" font-size="8" font-weight="600">主爆点</text>
                  <rect x="6" y="190" width="40" height="14" rx="4" fill="var(--md-primary)"/>
                  <text x="26" y="200" text-anchor="middle" fill="#fff" font-size="8" font-weight="600">次爆点</text>
                </svg>
              </div>
              <!-- 反面 -->
              <div class="layout-card">
                <span class="layout-badge">反面海报</span>
                <svg class="layout-svg" viewBox="0 0 210 297" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <!-- background -->
                  <rect width="210" height="297" rx="6" fill="#1a1a3a"/>
                  <!-- white container -->
                  <rect x="8" y="14" width="194" height="230" rx="6" fill="rgba(255,255,255,0.75)"/>
                  <!-- module 1 -->
                  <rect x="12" y="18" width="92" height="70" rx="4" fill="#2a2a5a" stroke="#FFD700" stroke-width="0.6" stroke-opacity="0.5"/>
                  <rect x="72" y="24" width="28" height="28" rx="3" fill="rgba(255,255,255,0.1)"/>
                  <text x="46" y="38" text-anchor="middle" fill="#fff" font-size="8">活动文字</text>
                  <text x="46" y="52" text-anchor="middle" fill="#FFD700" font-size="10" font-weight="700">价格数字</text>
                  <!-- module 2 -->
                  <rect x="106" y="18" width="92" height="70" rx="4" fill="#2a2a5a" stroke="#FFD700" stroke-width="0.6" stroke-opacity="0.5"/>
                  <rect x="166" y="24" width="28" height="28" rx="3" fill="rgba(255,255,255,0.1)"/>
                  <text x="140" y="38" text-anchor="middle" fill="#fff" font-size="8">活动文字</text>
                  <text x="140" y="52" text-anchor="middle" fill="#FFD700" font-size="10" font-weight="700">价格数字</text>
                  <!-- module 3 full width -->
                  <rect x="12" y="94" width="186" height="55" rx="4" fill="#2a2a5a" stroke="#FFD700" stroke-width="0.6" stroke-opacity="0.5"/>
                  <text x="95" y="116" text-anchor="middle" fill="#fff" font-size="8">带图活动（独占一行）</text>
                  <text x="95" y="132" text-anchor="middle" fill="#FFD700" font-size="10" font-weight="700">价格数字</text>
                  <rect x="158" y="100" width="36" height="36" rx="3" fill="rgba(255,255,255,0.1)"/>
                  <!-- module 4 text only -->
                  <rect x="12" y="155" width="186" height="40" rx="4" fill="#2a2a5a" stroke="#FFD700" stroke-width="0.6" stroke-opacity="0.5"/>
                  <text x="105" y="180" text-anchor="middle" fill="#fff" font-size="8">纯文字活动（独占一行）</text>
                  <!-- module 5 text only -->
                  <rect x="12" y="201" width="186" height="40" rx="4" fill="#2a2a5a" stroke="#FFD700" stroke-width="0.6" stroke-opacity="0.5"/>
                  <text x="105" y="226" text-anchor="middle" fill="#fff" font-size="8">纯文字活动（独占一行）</text>
                  <!-- merchant bar -->
                  <rect x="8" y="260" width="194" height="24" rx="4" fill="rgba(255,255,255,0.8)"/>
                  <text x="105" y="276" text-anchor="middle" fill="#B8860B" font-size="8" font-weight="600">商家名称 | 地址 | 电话</text>
                  <!-- labels -->
                  <rect x="6" y="12" width="46" height="14" rx="4" fill="var(--md-primary)"/>
                  <text x="29" y="22" text-anchor="middle" fill="#fff" font-size="8" font-weight="600">活动区域</text>
                  <rect x="6" y="258" width="46" height="14" rx="4" fill="var(--md-primary)"/>
                  <text x="29" y="268" text-anchor="middle" fill="#fff" font-size="8" font-weight="600">商家信息</text>
                </svg>
              </div>
            </div>
            <div class="layout-legend">
              <div class="legend-item"><span class="legend-dot legend-dot--accent"></span>主爆点：最大最醒目的优惠，放在正面海报上半部分</div>
              <div class="legend-item"><span class="legend-dot legend-dot--secondary"></span>次爆点：次要优惠，可选，放在主爆点下方</div>
              <div class="legend-item"><span class="legend-dot legend-dot--neutral"></span>反面活动：详细活动列表，最多6个，支持配图</div>
            </div>
          </section>

          <!-- Page 3: 使用步骤 -->
          <section v-show="page === 2" class="welcome-page">
            <h3 class="section-label">使用步骤</h3>
            <div class="steps-list">
              <div class="step-row">
                <div class="step-num">1</div>
                <div class="step-content">
                  <span class="step-title">选择节日和品牌</span>
                  <span class="step-desc">挑选活动节日（如春节、七夕），系统自动匹配配色和装饰风格；选择品牌后自动合成 Logo</span>
                </div>
              </div>
              <div class="step-connector"></div>
              <div class="step-row">
                <div class="step-num">2</div>
                <div class="step-content">
                  <span class="step-title">填写优惠活动</span>
                  <span class="step-desc">输入主爆点（如"黄金8.5折"）和反面活动详情，支持 AI 智能填充，也可以上传商品图片</span>
                </div>
              </div>
              <div class="step-connector"></div>
              <div class="step-row">
                <div class="step-num">3</div>
                <div class="step-content">
                  <span class="step-title">一键生成海报</span>
                  <span class="step-desc">点击生成按钮，AI 自动生成正面和反面海报。生成后可预览、下载，不满意还能 AI 优化</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Page 4: 注意事项 -->
          <section v-show="page === 3" class="welcome-page">
            <h3 class="section-label">注意事项</h3>
            <ul class="notes-list">
              <li>
                <svg class="note-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--md-primary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                <span>生成海报需要几秒钟，请耐心等待，不要重复点击</span>
              </li>
              <li>
                <svg class="note-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--md-primary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                <span>生成后如果不满意，可以使用"AI 优化"功能调整效果</span>
              </li>
              <li>
                <svg class="note-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--md-primary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                <span>上传的商品图片会自动保存，12小时后自动清理</span>
              </li>
              <li>
                <svg class="note-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--md-primary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                <span>关闭弹窗后，可点击顶部导航栏的 <strong>?</strong> 按钮重新查看</span>
              </li>
            </ul>
          </section>
        </div>

        <!-- Footer -->
        <div class="welcome-footer">
          <label class="dont-show">
            <input type="checkbox" v-model="dontShowAgain" />
            <span>下次不再显示</span>
          </label>
          <div class="footer-actions">
            <button v-if="page > 0" class="md3-btn md3-btn--text" @click="prevPage">
              上一步
            </button>
            <button v-if="page < totalPages - 1" class="md3-btn md3-btn--filled" @click="nextPage">
              下一步
            </button>
            <button v-else class="md3-btn md3-btn--filled" @click="close">
              开始使用
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.welcome-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 24px;
}

.welcome-dialog {
  background: var(--md-surface-container-low);
  border-radius: var(--md-shape-extra-large);
  width: 700px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: var(--md-elevation-3);
  animation: dialogIn 0.3s var(--md-easing-emphasized-decel);
  overflow: hidden;
}

@keyframes dialogIn {
  from { opacity: 0; transform: scale(0.92) translateY(12px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* Header */
.welcome-header {
  text-align: center;
  padding: 28px 28px 16px;
  position: relative;
  background: linear-gradient(180deg, color-mix(in srgb, var(--md-primary-container) 15%, var(--md-surface-container-low)) 0%, var(--md-surface-container-low) 100%);
}

.welcome-logo {
  display: inline-flex;
  margin-bottom: 10px;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.12));
}

.welcome-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--md-on-surface);
  margin: 0 0 4px;
}

.welcome-subtitle {
  font-size: var(--md-body-small);
  color: var(--md-on-surface-variant);
  margin: 0;
}

.welcome-close {
  position: absolute;
  top: 14px;
  right: 14px;
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
  transition: background var(--md-duration-short4) var(--md-easing-standard);
}
.welcome-close:hover {
  background: var(--md-surface-container-highest);
}

/* Page indicator */
.page-indicator {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 10px 0 2px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--md-outline-variant);
  cursor: pointer;
  transition: all var(--md-duration-short4) var(--md-easing-standard);
}

.dot.active {
  background: var(--md-primary);
  width: 24px;
  border-radius: 4px;
}

/* Body */
.welcome-body {
  position: relative;
  padding: 8px 28px 12px;
  height: 480px;
}

.welcome-page {
  position: absolute;
  top: 8px;
  left: 28px;
  right: 28px;
  bottom: 12px;
  overflow: hidden;
  animation: fadeIn 0.25s var(--md-easing-emphasized-decel);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(8px); }
  to { opacity: 1; transform: translateX(0); }
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--md-primary);
  margin: 0 0 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--md-outline-variant);
}

.page-hint {
  margin-top: 16px;
  font-size: var(--md-body-small);
  color: var(--md-on-surface-variant);
  text-align: center;
  padding: 10px 16px;
  background: var(--md-surface);
  border-radius: var(--md-shape-small);
  border: 1px solid var(--md-outline-variant);
}

/* Page 1: Welcome greeting */
.welcome-greeting {
  text-align: center;
  margin-bottom: 16px;
  padding: 14px 20px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--md-primary) 8%, transparent) 0%, color-mix(in srgb, var(--md-primary-container) 12%, transparent) 100%);
  border-radius: var(--md-shape-medium);
  border: 1px solid color-mix(in srgb, var(--md-primary) 15%, var(--md-outline-variant));
}

.greeting-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--md-on-surface);
  margin: 0 0 6px;
}

.greeting-desc {
  font-size: var(--md-body-small);
  color: var(--md-on-surface-variant);
  margin: 0;
  line-height: 1.6;
}

.feature-highlight {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 10px 14px;
  background: var(--md-surface);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-small);
  font-size: var(--md-body-small);
  color: var(--md-on-surface-variant);
}

.feature-highlight svg {
  flex-shrink: 0;
}

/* Page 1: Features */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.feature-card {
  background: var(--md-surface);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-medium);
  padding: 18px 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: box-shadow var(--md-duration-short4) var(--md-easing-standard);
}

.feature-card:hover {
  box-shadow: var(--md-elevation-1);
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--md-shape-medium);
  background: color-mix(in srgb, var(--md-primary) 10%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-title {
  font-size: var(--md-title-small);
  font-weight: 600;
  color: var(--md-on-surface);
}

.feature-desc {
  font-size: var(--md-body-small);
  color: var(--md-on-surface-variant);
  line-height: 1.5;
}

/* Page 2: Layout diagrams */
.layout-diagrams {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 14px;
}

.layout-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.layout-badge {
  font-size: var(--md-label-medium);
  font-weight: 600;
  color: var(--md-on-surface);
  background: var(--md-surface);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-full);
  padding: 4px 14px;
}

.layout-svg {
  width: 100%;
  max-width: 200px;
  border-radius: var(--md-shape-small);
  box-shadow: var(--md-elevation-1);
}

.layout-legend {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px;
  background: var(--md-surface);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-small);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--md-body-small);
  color: var(--md-on-surface-variant);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-dot--accent { background: #FFD700; }
.legend-dot--secondary { background: #fff; border: 1.5px solid #FFD700; }
.legend-dot--neutral { background: #2a2a5a; border: 1.5px solid #FFD700; opacity: 0.6; }

/* Page 3: Steps */
.steps-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.step-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
  padding: 16px;
  background: var(--md-surface);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-medium);
}

.step-num {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--md-primary);
  color: var(--md-on-primary);
  font-size: var(--md-title-small);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step-title {
  font-size: var(--md-title-small);
  font-weight: 600;
  color: var(--md-on-surface);
}

.step-desc {
  font-size: var(--md-body-small);
  color: var(--md-on-surface-variant);
  line-height: 1.6;
}

.step-connector {
  width: 2px;
  height: 16px;
  background: var(--md-outline-variant);
  border-radius: 1px;
}

/* Page 4: Notes */
.notes-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notes-list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: var(--md-body-medium);
  color: var(--md-on-surface-variant);
  line-height: 1.6;
  padding: 12px 14px;
  background: var(--md-surface);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-small);
}

.notes-list li strong {
  color: var(--md-primary);
  font-weight: 600;
}

.note-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

/* Footer */
.welcome-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 28px 20px;
  border-top: 1px solid var(--md-outline-variant);
}

.dont-show {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: var(--md-body-small);
  color: var(--md-on-surface-variant);
  user-select: none;
}

.dont-show input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--md-primary);
  cursor: pointer;
}

.footer-actions {
  display: flex;
  gap: 8px;
}

.md3-btn {
  height: 40px;
  padding: 0 24px;
  border-radius: 20px;
  border: none;
  font-size: var(--md-label-large);
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all var(--md-duration-short4) var(--md-easing-standard);
}

.md3-btn--filled {
  background: var(--md-primary);
  color: var(--md-on-primary);
}

.md3-btn--filled:hover {
  box-shadow: var(--md-elevation-1);
}

.md3-btn--text {
  background: transparent;
  color: var(--md-primary);
}

.md3-btn--text:hover {
  background: color-mix(in srgb, var(--md-primary) 8%, transparent);
}

/* Responsive */
@media (max-width: 600px) {
  .welcome-dialog {
    width: 100%;
    max-height: 92vh;
  }
  .feature-grid {
    grid-template-columns: 1fr;
  }
  .layout-diagrams {
    grid-template-columns: 1fr;
  }
}
</style>
