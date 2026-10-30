<script setup>
import { ref, computed } from 'vue'
import EdDialog from './EdDialog.vue'
import EdButton from './EdButton.vue'
import EdIcon from './EdIcon.vue'

const emit = defineEmits(['close', 'start'])
const dontShowAgain = ref(false)
const page = ref(0)
const totalPages = 3
const skipKey = 'haibao_welcome_v2_skip'

const counter = computed(() => `${String(page.value + 1).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`)
const nextPage = () => { if (page.value < totalPages - 1) page.value++ }
const prevPage = () => { if (page.value > 0) page.value-- }
const finish = (startNow = false) => {
  if (dontShowAgain.value) localStorage.setItem(skipKey, '1')
  emit('close')
  if (startNow) emit('start')
}

const workflow = [
  { no: '01', title: '确定创作方向', desc: '选择行业、节日、品牌和物料类型，先定下视觉基调。' },
  { no: '02', title: '补充活动信息', desc: '填写标题、优惠、活动详情，AI 会帮你完善表达。' },
  { no: '03', title: '生成并调整', desc: '预览结果、继续优化，确认后下载需要的物料。' },
]
const outputs = [
  { icon: '✦', title: '模板与空白项目', desc: '从行业模板快速开始，也可以自由创建。' },
  { icon: '↗', title: '多种宣传物料', desc: '适配海报、车贴和后续更多尺寸。' },
  { icon: '◌', title: 'AI 辅助创作', desc: '从文案到视觉方向，减少重复工作。' },
]
</script>

<template>
  <EdDialog title="使用指南" :width="680" @close="finish()">
    <div class="welcome-pages">
      <section v-if="page === 0" class="welcome-page welcome-page--intro">
        <span class="welcome-kicker">WELCOME TO POSTER STUDIO</span>
        <h3 class="welcome-title">从一个想法开始，<br /><em>完成一张好海报。</em></h3>
        <p class="welcome-desc">海报工坊是面向多行业的 AI 视觉创作助手。你只需要告诉我们要宣传什么，剩下的创作路径会被整理得清清楚楚。</p>
        <div class="welcome-starts">
          <button class="welcome-start" type="button" @click="finish(true)"><span class="welcome-start__icon">✦</span><span><b>开始一张新海报</b><small>从行业和活动信息开始</small></span><EdIcon name="arrow-right" :size="16" /></button>
          <button class="welcome-start welcome-start--quiet" type="button" @click="nextPage"><span class="welcome-start__icon">01</span><span><b>先了解创作流程</b><small>三步完成，从选择到导出</small></span><EdIcon name="arrow-right" :size="16" /></button>
        </div>
        <p class="welcome-hint"><EdIcon name="sparkle" :size="13" /> 不需要设计经验，先从一个明确的宣传目标开始。</p>
      </section>

      <section v-else-if="page === 1" class="welcome-page">
        <span class="welcome-kicker">A SIMPLE CREATIVE PROCESS</span>
        <h3 class="welcome-page__title">三步完成一张海报</h3>
        <p class="welcome-page__desc">每一步只处理一类信息，随时可以返回修改。</p>
        <div class="welcome-workflow"><div v-for="item in workflow" :key="item.no" class="welcome-workflow__item"><span class="welcome-workflow__no">{{ item.no }}</span><div><h4>{{ item.title }}</h4><p>{{ item.desc }}</p></div></div></div>
      </section>

      <section v-else class="welcome-page">
        <span class="welcome-kicker">WHAT YOU CAN CREATE</span>
        <h3 class="welcome-page__title">把复杂的设计工作，<br />变成几个简单的决定。</h3>
        <div class="welcome-outputs"><div v-for="item in outputs" :key="item.title" class="welcome-output"><span>{{ item.icon }}</span><div><h4>{{ item.title }}</h4><p>{{ item.desc }}</p></div></div></div>
        <div class="welcome-tip"><EdIcon name="help" :size="15" /><span>卡住时，点击工作台顶部的问号，会打开当前步骤的针对性帮助。</span></div>
      </section>
    </div>

    <template #footer>
      <label class="welcome-check"><input v-model="dontShowAgain" type="checkbox"><span class="welcome-check__box"><EdIcon v-if="dontShowAgain" name="check" :size="11" /></span><span>下次不再显示</span></label>
      <span class="welcome-spacer" /><span class="welcome-counter">{{ counter }}</span>
      <EdButton v-if="page > 0" variant="text" @click="prevPage">上一步</EdButton>
      <EdButton v-if="page < totalPages - 1" variant="solid" @click="nextPage">下一步<EdIcon name="arrow-right" :size="15" /></EdButton>
      <EdButton v-else variant="solid" @click="finish(true)">开始创作<EdIcon name="arrow-right" :size="15" /></EdButton>
    </template>
  </EdDialog>
</template>

<style scoped>
.welcome-pages{min-height:330px}.welcome-page{min-height:330px}.welcome-page--intro{padding:4px 0}.welcome-kicker{color:#7d8793;font:10px var(--ed-mono);letter-spacing:.14em}.welcome-title{margin:22px 0 15px;font:700 34px/1.18 var(--ed-sans);letter-spacing:-.06em}.welcome-title em{font-style:normal;color:#5567d9}.welcome-desc,.welcome-page__desc{max-width:510px;color:#747e8a;font-size:13px;line-height:1.8}.welcome-starts{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:30px}.welcome-start{min-height:112px;padding:18px;display:flex;align-items:flex-start;gap:12px;border:1px solid #dce1e7;border-radius:10px;background:#f5f7fb;color:#1e242b;text-align:left;cursor:pointer;transition:transform .2s,border-color .2s,background .2s}.welcome-start:hover{transform:translateY(-2px);border-color:#8e9be3;background:#eef1ff}.welcome-start--quiet{background:#fff}.welcome-start__icon{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:#5567d9;color:#fff;font-size:14px;flex-shrink:0}.welcome-start--quiet .welcome-start__icon{background:#eef0f4;color:#59636f;font:10px var(--ed-mono)}.welcome-start b,.welcome-start small{display:block}.welcome-start b{font-size:13px;font-weight:600}.welcome-start small{margin-top:7px;color:#8a939e;font-size:11px;line-height:1.5}.welcome-start>.ed-icon{margin-left:auto;color:#7a8490}.welcome-hint{display:flex;align-items:center;gap:8px;margin-top:25px;color:#929aa5;font-size:11px}.welcome-hint .ed-icon{color:#5567d9}.welcome-page__title{margin:18px 0 10px;font:700 27px var(--ed-sans);letter-spacing:-.05em}.welcome-workflow{margin-top:28px}.welcome-workflow__item{display:flex;gap:22px;padding:18px 0;border-bottom:1px solid #e5e8ed}.welcome-workflow__item:last-child{border-bottom:0}.welcome-workflow__no{color:#5567d9;font:18px var(--ed-mono)}.welcome-workflow h4,.welcome-output h4{font-size:15px;font-weight:600}.welcome-workflow p,.welcome-output p{margin-top:5px;color:#818b97;font-size:12px;line-height:1.7}.welcome-outputs{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:28px}.welcome-output{min-height:140px;padding:17px;background:#f4f6f9;border-radius:9px}.welcome-output>span{font-size:20px;color:#5567d9}.welcome-output h4{margin-top:20px}.welcome-tip{display:flex;gap:9px;margin-top:24px;padding:13px 14px;background:#eef1ff;color:#626c7d;font-size:12px;line-height:1.6}.welcome-tip .ed-icon{color:#5567d9;flex-shrink:0;margin-top:2px}.welcome-check{display:flex;align-items:center;gap:8px;color:#89929d;font-size:11px;cursor:pointer}.welcome-check input{position:absolute;width:1px;height:1px;opacity:0}.welcome-check__box{display:grid;place-items:center;width:16px;height:16px;border:1px solid #aeb6c0;color:#fff}.welcome-check input:checked+.welcome-check__box{background:#1e242b;border-color:#1e242b}.welcome-check input:focus-visible+.welcome-check__box{outline:2px solid #5567d9;outline-offset:2px}.welcome-spacer{flex:1}.welcome-counter{color:#9aa2ad;font:10px var(--ed-mono)}
@media(max-width:600px){.welcome-starts,.welcome-outputs{grid-template-columns:1fr}.welcome-title{font-size:29px}.welcome-pages,.welcome-page{min-height:390px}}
</style>