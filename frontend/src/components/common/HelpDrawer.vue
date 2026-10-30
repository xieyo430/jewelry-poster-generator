<script setup>
import { computed } from 'vue'
import EdIcon from './EdIcon.vue'
import EdButton from './EdButton.vue'

const props = defineProps({ step: { type: Number, default: 1 } })
const emit = defineEmits(['close', 'go-step'])

const guides = [
  { no: 1, eyebrow: '01 / 03 · DIRECTION', title: '先确定视觉方向', desc: '从行业、节日和品牌开始，系统会根据你的选择建立海报的视觉基调。', tips: ['节日决定主色和氛围', '品牌会出现在海报顶部', '可以先选内容，之后再补充文案'], example: '例如：春节 × 门店促销 × 新品发布' },
  { no: 2, eyebrow: '02 / 03 · CONTENT', title: '把活动说清楚', desc: '填写主标题、优惠和活动卖点。信息越明确，生成结果越容易贴近你的目标。', tips: ['主标题尽量短而有行动感', '优惠信息优先填写数字和门槛', '没有灵感时可以使用 AI 帮写'], example: '例如：全场新品限时 7 折起' },
  { no: 3, eyebrow: '03 / 03 · OUTPUT', title: '生成、调整、导出', desc: '完成活动详情和商家信息后生成海报。结果不满意时，可以返回修改或继续 AI 优化。', tips: ['生成期间不要重复点击', '可以分别查看正面和反面', '确认后下载对应物料'], example: '生成后：预览 → 优化 → 下载' },
]
const guide = computed(() => guides[Math.min(Math.max(props.step - 1, 0), guides.length - 1)])
const goStep = () => emit('go-step', guide.value.no)
</script>

<template>
  <Teleport to="body">
    <div class="help-layer" @mousedown.self="emit('close')">
      <aside class="help-drawer" role="dialog" aria-modal="true" aria-label="当前步骤帮助">
        <header class="help-drawer__head"><div><span class="help-drawer__kicker">CONTEXTUAL HELP</span><h2>当前步骤帮助</h2></div><button class="help-drawer__close" type="button" aria-label="关闭帮助" @click="emit('close')"><EdIcon name="close" :size="18" /></button></header>
        <div class="help-drawer__body"><div class="help-drawer__step"><span>{{ guide.eyebrow }}</span><b>{{ guide.no }}</b></div><h3>{{ guide.title }}</h3><p class="help-drawer__desc">{{ guide.desc }}</p><div class="help-example"><span>填写示例</span><b>{{ guide.example }}</b></div><div class="help-tips"><p>你可以这样做</p><ul><li v-for="tip in guide.tips" :key="tip"><EdIcon name="check" :size="13" />{{ tip }}</li></ul></div></div>
        <footer class="help-drawer__foot"><EdButton variant="outline" @click="emit('close')">继续查看</EdButton><EdButton variant="solid" @click="goStep">去填写这一步<EdIcon name="arrow-right" :size="15" /></EdButton></footer>
      </aside>
    </div>
  </Teleport>
</template>

<style scoped>
.help-layer{position:fixed;inset:0;z-index:1500;background:rgba(18,22,29,.22);animation:help-fade .2s ease}.help-drawer{position:absolute;top:0;right:0;width:min(390px,100vw);height:100%;display:flex;flex-direction:column;background:#fff;box-shadow:-18px 0 50px rgba(21,27,36,.14);animation:help-slide .25s cubic-bezier(.2,.6,.2,1)}.help-drawer__head{display:flex;align-items:flex-start;justify-content:space-between;padding:28px 26px 22px;border-bottom:1px solid #e6e9ed}.help-drawer__kicker{color:#8b949f;font:10px var(--ed-mono);letter-spacing:.13em}.help-drawer h2{margin-top:8px;font-size:20px;font-weight:600;letter-spacing:-.04em}.help-drawer__close{display:grid;place-items:center;width:32px;height:32px;border:1px solid #e1e5ea;border-radius:7px;background:#fff;color:#737c87;cursor:pointer}.help-drawer__close:hover{color:#5567d9;border-color:#aeb7f2}.help-drawer__body{flex:1;overflow:auto;padding:28px 26px}.help-drawer__step{display:flex;align-items:center;justify-content:space-between;color:#7f8995;font:10px var(--ed-mono);letter-spacing:.1em}.help-drawer__step b{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:#eef1ff;color:#5567d9;font:14px var(--ed-mono)}.help-drawer h3{margin-top:27px;font:700 28px/1.2 var(--ed-sans);letter-spacing:-.06em}.help-drawer__desc{margin-top:14px;color:#707a87;font-size:13px;line-height:1.85}.help-example{margin-top:28px;padding:16px;background:#f4f6f9;border-radius:9px}.help-example span{display:block;color:#8d96a1;font:10px var(--ed-mono);letter-spacing:.08em}.help-example b{display:block;margin-top:9px;color:#323943;font:600 14px/1.5 var(--ed-serif)}.help-tips{margin-top:30px;padding-top:22px;border-top:1px solid #e6e9ed}.help-tips>p{color:#363d46;font-size:13px;font-weight:600}.help-tips ul{display:flex;flex-direction:column;gap:14px;margin:16px 0 0;padding:0;list-style:none}.help-tips li{display:flex;align-items:flex-start;gap:9px;color:#737d89;font-size:12px;line-height:1.6}.help-tips li .ed-icon{margin-top:2px;color:#5567d9;flex-shrink:0}.help-drawer__foot{display:flex;justify-content:flex-end;gap:10px;padding:18px 26px 24px;border-top:1px solid #e6e9ed}.help-drawer__foot :deep(.ed-btn){height:38px;font-size:12px}@keyframes help-fade{from{opacity:0}}@keyframes help-slide{from{transform:translateX(20px);opacity:.5}}
</style>