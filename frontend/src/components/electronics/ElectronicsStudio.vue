<script setup>
import { computed, toRef } from 'vue'
import { usePosterStore } from '../../store/poster'
import EdSection from '../common/EdSection.vue'
import EdField from '../common/EdField.vue'
import EdButton from '../common/EdButton.vue'
import EdIcon from '../common/EdIcon.vue'

const GOALS = [
  { id: '新品直降', title: '新品上市', desc: '突出新品、首发和价格优势' },
  { id: '以旧换新', title: '焕新换购', desc: '强调补贴、换新和服务权益' },
  { id: '套装赠礼', title: '套装赠礼', desc: '组合产品、赠品和延保服务' },
]

const store = usePosterStore()
const campaign = toRef(store, 'electronicsCampaign')
const brand = toRef(store, 'customBrandName')
const merchant = toRef(store, 'merchantInfo')
const canStep1 = computed(() => brand.value.trim().length > 0)
const canStep2 = computed(() => campaign.value.productName.trim().length > 0)
const canStep3 = computed(() => canStep2.value && merchant.value.name.trim().length > 0)

const next = () => store.setStep(store.currentStep + 1)
const previous = () => store.setStep(store.currentStep - 1)
const generate = () => { if (canStep3.value) store.generatePosters() }
</script>

<template>
  <EdSection v-if="store.currentStep === 1" num="01" title="数码创作目标" desc="先确定品牌和传播方向，再组织产品利益点，不使用珠宝节日模板。">
    <div class="goal-grid">
      <button v-for="item in GOALS" :key="item.id" type="button" :class="['goal-card', { selected: campaign.promotionType === item.id }]" @click="campaign.promotionType = item.id">
        <span><strong>{{ item.title }}</strong><small>{{ item.desc }}</small></span><EdIcon :name="campaign.promotionType === item.id ? 'check' : 'arrow-right'" :size="16" />
      </button>
    </div>
    <EdField v-model="brand" label="品牌或店铺名称" required placeholder="如：星耀数码、未来家电" />
    <div class="actions"><span v-if="!canStep1" class="actions__hint ed-meta">请填写品牌或店铺名称</span><EdButton variant="solid" :disabled="!canStep1" @click="next">开始填写 <EdIcon name="arrow-right" :size="15" /></EdButton></div>
  </EdSection>

  <EdSection v-else-if="store.currentStep === 2" num="02" title="产品与优惠" desc="用产品名称、核心卖点和真实优惠构成清晰的购买理由。">
    <EdField v-model="campaign.productName" label="产品名称" required placeholder="如：Pro Max 智能手机、旗舰扫地机器人" />
    <EdField v-model="campaign.productDescription" label="产品定位" placeholder="如：轻薄旗舰、全屋智能、办公高效" />
    <div class="grid"><EdField v-model="campaign.promotionValue" label="优惠信息" placeholder="如：直降300元、补贴500元" /><EdField v-model="campaign.features" label="核心参数或卖点" placeholder="如：1TB存储、AI降噪、五年质保" /></div>
    <EdField v-model="campaign.sellingPoints" label="海报主卖点" placeholder="如：新品首发，购机赠延保" />
    <div class="actions"><EdButton variant="text" @click="previous"><EdIcon name="arrow-left" :size="15" /> 上一步</EdButton><span v-if="!canStep2" class="actions__hint ed-meta">请填写产品名称</span><EdButton variant="solid" :disabled="!canStep2" @click="next">填写服务信息 <EdIcon name="arrow-right" :size="15" /></EdButton></div>
  </EdSection>

  <EdSection v-else num="03" title="门店与服务信息" desc="把购买方式、服务保障和门店信息放在反面，帮助用户完成决策。">
    <div class="grid"><EdField v-model="merchant.name" label="门店名称" required placeholder="如：星耀数码（旗舰店）" /><EdField v-model="merchant.phone" label="联系电话" placeholder="输入联系电话" /><EdField v-model="merchant.address" label="门店地址" placeholder="如：中央大街 88 号" /><EdField v-model="campaign.service" label="服务保障" placeholder="全国联保、免费安装、送货上门" /></div>
    <div class="grid"><EdField v-model="store.startDate" label="活动开始日期" type="date" /><EdField v-model="store.endDate" label="活动结束日期" type="date" /></div>
    <div class="back-note"><span class="section-label">数码海报信息结构</span><p>产品卖点 → 参数与优惠 → 服务权益 → 门店与购买方式</p><small>以清晰参数层级和科技感留白呈现，不使用珠宝装饰。</small></div>
    <div class="actions"><EdButton variant="text" @click="previous"><EdIcon name="arrow-left" :size="15" /> 上一步</EdButton><span v-if="!canStep3" class="actions__hint ed-meta">请填写门店名称</span><EdButton variant="solid" :disabled="!canStep3 || store.generating" :loading="store.generating" @click="generate"><EdIcon v-if="!store.generating" name="sparkle" :size="15" />{{ store.generating ? '生成中...' : '生成数码海报' }}</EdButton></div>
    <div v-if="store.generateError" class="note"><EdIcon name="warning" :size="13" />{{ store.generateError }}</div>
  </EdSection>
</template>

<style scoped>
.goal-grid { display: grid; gap: 10px; margin-bottom: 22px; }
.goal-card { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 15px; border: 1px solid var(--ed-rule); border-radius: 10px; background: var(--theme-surface); color: var(--ed-ink); text-align: left; cursor: pointer; }
.goal-card:hover, .goal-card.selected { border-color: #1769e0; background: color-mix(in srgb, #1769e0 7%, var(--theme-surface)); }
.goal-card strong, .goal-card small { display: block; }.goal-card strong { font-family: var(--ed-serif); font-size: 17px; }.goal-card small { margin-top: 3px; color: var(--ed-ink-soft); font-size: 12px; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 18px; }
.actions { display: flex; align-items: center; justify-content: flex-end; gap: 14px; margin-top: 26px; }.actions__hint { margin-right: auto; text-transform: none; letter-spacing: 0; }
.back-note { margin-top: 24px; padding: 15px; border: 1px solid #b9cbe7; background: #f4f8ff; color: #28558e; }.back-note p { font-size: 12px; }.back-note small { display: block; margin-top: 7px; color: #5277a8; }.section-label { display: block; margin-bottom: 7px; font: 600 12px var(--ed-mono); }
.note { display: flex; gap: 7px; margin-top: 18px; padding: 10px; background: #fff0ee; color: var(--ed-danger); font-size: 12px; }
@media (max-width: 620px) { .grid { grid-template-columns: 1fr; } }
</style>
