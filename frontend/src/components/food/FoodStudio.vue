<script setup>
import { computed, ref, toRef } from 'vue'
import { usePosterStore } from '../../store/poster'
import api from '../../api'
import { useToast } from '../../composables/useToast'
import EdSection from '../common/EdSection.vue'
import EdField from '../common/EdField.vue'
import EdButton from '../common/EdButton.vue'
import EdIcon from '../common/EdIcon.vue'

const MODES = [
  { id: 'signature', title: '招牌菜', desc: '单品、新品、今日推荐' },
  { id: 'combo', title: '套餐促销', desc: '双人餐、午市餐、团购套餐' },
  { id: 'store-event', title: '门店活动', desc: '开业、会员日、买赠、满减' },
]

const store = usePosterStore()
const toast = useToast()
const campaign = toRef(store, 'foodCampaign')
const brand = toRef(store, 'customBrandName')
const merchant = toRef(store, 'merchantInfo')
const aiInput = ref('')
const aiLoading = ref(false)
const uploadLoading = ref(false)
const canStep1 = computed(() => !!brand.value.trim())
const canStep2 = computed(() => !!campaign.value.dishName.trim())
const canStep3 = computed(() => !!merchant.value.name.trim())
const canNext = computed(() => [canStep1, canStep2, canStep3][store.currentStep - 1]?.value ?? false)
const modeTitle = computed(() => MODES.find(m => m.id === campaign.value.mode)?.title || '餐饮海报')

const next = () => { if (canNext.value) store.setStep(store.currentStep + 1) }
const previous = () => store.setStep(store.currentStep - 1)

async function writeCopy() {
  if (!aiInput.value.trim()) return
  aiLoading.value = true
  try {
    const res = await api.writeCopy({
      target: 'main', industry: 'food', industryName: '餐饮美食', brand: brand.value,
      brandTone: '温暖、真实、有食欲，强调到店转化', theme: campaign.value.dishName || campaign.value.eventType,
      subtitle: aiInput.value, currentTitle: campaign.value.dishName, currentSubtitle: campaign.value.sellingPoints,
    })
    const option = res.data.options?.[0]
    if (option) {
      campaign.value.dishName = option.title || campaign.value.dishName
      campaign.value.sellingPoints = option.subtitle || campaign.value.sellingPoints
      if (res.data.filtered) toast.warning('AI 文案含违规表述，已自动替换，请核对菜品名称')
      else toast.success('AI 已生成餐饮文案')
    }
  } catch (error) { toast.error(`AI 文案生成失败：${error.message || '网络错误'}`) }
  finally { aiLoading.value = false }
}

async function uploadImage(event) {
  const file = event.target.files?.[0]
  if (!file) return
  uploadLoading.value = true
  try { campaign.value.dishImageUrl = (await api.uploadImage(file)).data.url; toast.success('菜品图片已上传') }
  catch (error) { toast.error(`图片上传失败：${error.message || '网络错误'}`) }
  finally { uploadLoading.value = false; event.target.value = '' }
}

const generate = () => { if (canNext.value) store.generatePosters() }
</script>

<template>
  <EdSection v-if="store.currentStep === 1" num="01" title="餐饮创作目标" desc="餐饮海报从经营目标开始，不套用珠宝类的节日与品牌结构。">
    <div class="mode-grid">
      <button v-for="item in MODES" :key="item.id" type="button" class="mode-card" :class="{ selected: campaign.mode === item.id }" @click="campaign.mode = item.id">
        <span><strong>{{ item.title }}</strong><small>{{ item.desc }}</small></span><EdIcon :name="campaign.mode === item.id ? 'check' : 'arrow-right'" :size="16" />
      </button>
    </div>
    <div class="callout"><EdIcon name="sparkle" :size="15" />AI 会根据菜品、套餐价格或活动机制，分别安排正面吸引和反面转化信息。</div>
    <EdField v-model="brand" label="品牌或店铺名称" required placeholder="如：巷口小馆、麦香烘焙、山野火锅" />
    <div class="actions"><span v-if="!canNext" class="actions__hint ed-meta">请填写品牌或店铺名称</span><EdButton variant="solid" :disabled="!canNext" @click="next">开始填写 <EdIcon name="arrow-right" :size="15" /></EdButton></div>
  </EdSection>

  <EdSection v-else-if="store.currentStep === 2" num="02" :title="`${modeTitle}内容`" desc="填写消费者真正关心的菜品、套餐、价格和优惠信息。">
    <EdField v-model="campaign.dishName" :label="campaign.mode === 'store-event' ? '活动名称' : campaign.mode === 'combo' ? '套餐名称' : '菜品名称'" required :placeholder="campaign.mode === 'store-event' ? '如：周三会员日' : campaign.mode === 'combo' ? '如：双人招牌套餐' : '如：炙烤黑椒牛排'" />
    <EdField v-if="campaign.mode !== 'store-event'" v-model="campaign.dishDescription" label="口味与卖点" placeholder="如：现切牛肉、炭火现烤、外酥里嫩" />
    <EdField v-model="campaign.sellingPoints" label="海报主卖点" placeholder="如：招牌菜限时8折、两人吃得满足还省30元" />
    <div class="grid">
      <EdField v-if="campaign.mode === 'combo'" v-model="campaign.setContents" label="套餐内容" type="textarea" :rows="3" placeholder="如：牛排2份、薯条1份、饮品2杯" />
      <EdField v-if="campaign.mode === 'combo'" v-model="campaign.audience" label="适用人群" placeholder="双人 / 家庭聚餐" />
      <EdField v-model="campaign.originalPrice" label="原价（可选）" placeholder="如：168" />
      <EdField v-model="campaign.promoPrice" label="活动价或折扣" placeholder="如：99 或 8折" />
      <EdField v-if="campaign.mode === 'store-event'" v-model="campaign.eventType" label="活动类型" placeholder="如：会员日、第二份半价" />
      <EdField v-if="campaign.mode === 'store-event'" v-model="campaign.gift" label="赠品或额外权益" placeholder="如：赠饮品1杯" />
    </div>
    <div class="upload-row"><div><span class="section-label">菜品图片（可选）</span><p class="ed-meta">真实菜品图会成为正面主视觉。</p></div><label class="upload"><EdIcon name="upload" :size="14" />{{ uploadLoading ? '上传中...' : '上传图片' }}<input type="file" accept="image/png,image/jpeg,image/webp" @change="uploadImage" /></label><img v-if="campaign.dishImageUrl" :src="campaign.dishImageUrl" alt="菜品预览" /></div>
    <div class="ai-row"><EdField v-model="aiInput" label="AI 餐饮文案" type="textarea" :rows="3" placeholder="描述菜品、套餐或活动，AI 会生成更适合海报的标题和卖点" /><EdButton variant="outline" :loading="aiLoading" :disabled="!aiInput.trim()" @click="writeCopy"><EdIcon name="sparkle" :size="14" /> AI 帮写</EdButton></div>
    <div class="actions"><EdButton variant="text" @click="previous"><EdIcon name="arrow-left" :size="15" /> 上一步</EdButton><span v-if="!canNext" class="actions__hint ed-meta">请填写菜品、套餐或活动名称</span><EdButton variant="solid" :disabled="!canNext" @click="next">填写门店信息 <EdIcon name="arrow-right" :size="15" /></EdButton></div>
  </EdSection>

  <EdSection v-else num="03" title="门店与转化信息" desc="反面海报会把规则、时间和门店信息排成易读的行动说明。">
    <div class="grid"><EdField v-model="merchant.name" label="门店名称" required placeholder="如：巷口小馆（万象城店）" /><EdField v-model="merchant.phone" label="联系电话" placeholder="输入联系电话" /><EdField v-model="merchant.address" label="门店地址" placeholder="如：中央大街 88 号" /><EdField v-model="campaign.serviceMode" label="消费方式" placeholder="堂食、外卖、打包" /></div>
    <div class="grid"><EdField v-model="store.startDate" label="活动开始日期" type="date" /><EdField v-model="store.endDate" label="活动结束日期" type="date" /></div>
    <EdField v-model="campaign.eventRule" label="使用规则与核销说明" type="textarea" :rows="4" placeholder="如：需提前2小时预约，每桌限用一张，不与其他优惠同享" />
    <div class="back-note"><span class="section-label">反面信息结构</span><p>活动利益点 → 菜品/套餐详情 → 使用规则 → 门店地址与联系方式</p><small>不堆叠背景图，保证信息清晰可读</small></div>
    <div class="actions"><EdButton variant="text" @click="previous"><EdIcon name="arrow-left" :size="15" /> 上一步</EdButton><span v-if="!canNext" class="actions__hint ed-meta">请填写门店名称</span><EdButton variant="solid" :disabled="!canNext || store.generating" :loading="store.generating" @click="generate"><EdIcon v-if="!store.generating" name="sparkle" :size="15" />{{ store.generating ? '生成中...' : '生成餐饮海报' }}</EdButton></div>
    <div v-if="store.generateError" class="note"><EdIcon name="warning" :size="13" />{{ store.generateError }}</div>
  </EdSection>
</template>

<style scoped>
.mode-grid { display: grid; gap: 10px; margin-bottom: 22px; }
.mode-card { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 15px; border: 1px solid var(--ed-rule); border-radius: 10px; background: var(--theme-surface); color: var(--ed-ink); text-align: left; cursor: pointer; }
.mode-card:hover, .mode-card.selected { border-color: var(--ed-accent); background: color-mix(in srgb, var(--ed-accent) 7%, var(--theme-surface)); }
.mode-card strong, .mode-card small { display: block; }.mode-card strong { font-family: var(--ed-serif); font-size: 17px; }.mode-card small { margin-top: 3px; color: var(--ed-ink-soft); font-size: 12px; }
.callout { display: flex; gap: 8px; margin: 0 0 22px; padding: 12px; border-left: 3px solid #c8754d; background: #fff4ed; color: #75452f; font-size: 12px; line-height: 1.7; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 18px; }.section-label { display: block; margin-bottom: 7px; color: var(--ed-ink-soft); font: 600 12px var(--ed-mono); }
.upload-row, .ai-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 14px; align-items: end; margin-top: 22px; padding-top: 20px; border-top: 1px solid var(--ed-rule); }.upload { display: inline-flex; align-items: center; gap: 7px; padding: 9px 12px; border: 1px solid var(--ed-rule); border-radius: 8px; font-size: 12px; cursor: pointer; }.upload input { display: none; }.upload-row img { grid-column: 1 / -1; width: 150px; height: 100px; object-fit: cover; border-radius: 8px; }.ai-row { align-items: end; }.actions { display: flex; align-items: center; justify-content: flex-end; gap: 14px; margin-top: 26px; }.actions__hint { margin-right: auto; text-transform: none; letter-spacing: 0; }.back-note { margin-top: 24px; padding: 15px; border: 1px solid #dfc2ae; background: #fff8f3; color: #75452f; }.back-note p { font-size: 12px; }.back-note small { display: block; margin-top: 7px; color: #a94f2e; }.note { display: flex; gap: 7px; margin-top: 18px; padding: 10px; background: #fff0ee; color: var(--ed-danger); font-size: 12px; }
@media (max-width: 620px) { .grid, .upload-row, .ai-row { grid-template-columns: 1fr; } .upload { justify-self: start; } }
</style>
