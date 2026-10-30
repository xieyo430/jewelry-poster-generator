import { defineStore } from 'pinia'
import api from '../api'
import { getIndustryTemplate } from '../data/industryTemplates'

export const usePosterStore = defineStore('poster', {
  persist: {
    omit: ['generating', 'generateError', 'enhancing', 'enhanceError', 'mainCached', 'secCached', 'enhancedFrontUrl', 'enhancedBackUrl', 'backBgImageUrl'],
  },
  state: () => ({
    currentStep: 1,

    // ====== 物料类型 ======
    materialType: 'poster', // 'poster' | 'car-sticker'

    // ====== 车贴 ======
    carStickerSize: { width: 2560, height: 1440 },
    carStickerText: '',

    // ====== 步骤1: 节日与品牌 ======
    industry: 'jewelry',
    customBrandName: '',
    electronicsCampaign: {
      productName: '',
      productDescription: '',
      sellingPoints: '',
      promotionType: '新品直降',
      promotionValue: '',
      features: '',
      service: '全国联保',
    },
    foodCampaign: {
      mode: 'signature',
      dishName: '',
      dishDescription: '',
      sellingPoints: '',
      dishImageUrl: '',
      serviceMode: '堂食',
      originalPrice: '',
      promoPrice: '',
      setContents: '',
      audience: '朋友聚餐',
      eventType: '门店限时优惠',
      eventRule: '',
      gift: '',
      actionText: '到店尝鲜',
    },
    festival: null,
    brand: null,
    startDate: '',
    endDate: '',
    theme: '',
    subtitle: '',
    festivals: [],
    brands: [],

    // ====== 步骤2: 正面推广 ======
    mainPromotion: {
      type: 'text',
      mainTitle: '',
      subTitle: '',
      content: '',
      discountType: null,
      discountDetail: '',
      imageUrls: [],
    },
    mainCached: {
      type: 'text',
      discountTypeId: '',
      fieldValues: {},
      imageUrls: [],
    },
    secondaryPromotion: {
      type: null,
      mainTitle: '',
      subTitle: '',
      content: '',
      discountType: null,
      discountDetail: '',
      imageUrls: [],
    },
    secCached: {
      hasSecondary: true,
      type: 'text',
      discountTypeId: '',
      fieldValues: {},
      imageUrls: [],
    },

    // ====== 步骤3: 反面活动 ======
    activities: [],
    merchantInfo: {
      name: '',
      address: '',
      phone: '',
    },
    selectedMerchantTemplateId: null,
    projectId: null,
    projectTitle: '',
    projectSaved: false,
    projectStatus: 'draft',
    saveError: null,

    discountTypes: [],
    merchantTemplates: [],

    // 生成结果
    frontPosterUrl: null,
    backPosterUrl: null,
    carStickerUrl: null,
    generating: false,
    generateError: null,

    // AI 优化
    enhancing: false,
    enhanceError: null,
    enhancedFrontUrl: null,   // 优化后的正面（原图保留不动）
    enhancedBackUrl: null,    // 优化后的反面（原图保留不动）
    backBgImageUrl: null,     // 反面海报的背景图 URL
  }),

  getters: {
    suggestedProjectTitle: (s) => {
      if (s.projectTitle) return s.projectTitle
      const brand = s.industry === 'jewelry'
        ? s.brands?.find(item => item.id === s.brand)?.name || ''
        : s.customBrandName || ''
      if (s.industry === 'food') return [s.merchantInfo.name, s.foodCampaign.dishName || s.foodCampaign.setContents || s.foodCampaign.eventType].filter(Boolean).join(' · ') || '餐饮海报项目'
      if (s.industry === 'electronics') return [s.merchantInfo.name, s.electronicsCampaign.productName].filter(Boolean).join(' · ') || '数码海报项目'
      return [brand, s.festival && s.festivals?.find(f => f.id === s.festival)?.name, s.theme || s.mainPromotion.mainTitle].filter(Boolean).join(' · ') || '珠宝海报项目'
    },
    canStep1Next: (s) => s.industry === 'jewelry'
      ? Boolean(s.festival && s.brand)
      : s.customBrandName.trim().length > 0,
    industryTemplate: (s) => getIndustryTemplate(s.industry),
    displayBrandName: (s) => s.industry === 'jewelry'
      ? (s.brands?.find(b => b.id === s.brand)?.name || '')
      : s.customBrandName.trim(),
    canStep2Next: (s) => s.industry === 'food'
      ? s.foodCampaign.dishName.trim().length > 0
      : s.industry === 'electronics'
        ? s.electronicsCampaign.productName.trim().length > 0
        : s.mainPromotion.mainTitle.trim().length > 0,
    canStep3Next: (s) => s.industry === 'food'
      ? s.merchantInfo.name.trim().length > 0 && (s.foodCampaign.mode !== 'signature' || s.foodCampaign.dishName.trim().length > 0)
      : s.industry === 'electronics'
        ? s.merchantInfo.name.trim().length > 0 && s.electronicsCampaign.productName.trim().length > 0
        : s.activities.length > 0 && s.merchantInfo.name.trim().length > 0,

    colorScheme: (s) => {
      if (!s.festival) return s.industry === 'food' ? '餐饮暖食欲' : s.industry === 'electronics' ? '数码科技蓝' : null
      const f = s.festivals?.find(f => f.id === s.festival)
      return f ? f.colorScheme : (s.industry === 'food' ? '餐饮暖食欲' : null)
    },
    festivalColors: (s) => {
      if (!s.festival) {
        return s.industry === 'food'
          ? { primary: '#C75C3C', secondary: '#F2A65A', bg: '#FFF5EB' }
          : s.industry === 'electronics'
            ? { primary: '#1769E0', secondary: '#42D4FF', bg: '#F2F7FF' }
            : null
      }
      const f = s.festivals?.find(f => f.id === s.festival)
      return f
        ? { primary: f.primaryColor, secondary: f.secondaryColor, bg: f.bgColor }
        : (s.industry === 'food'
          ? { primary: '#C75C3C', secondary: '#F2A65A', bg: '#FFF5EB' }
          : s.industry === 'electronics'
            ? { primary: '#1769E0', secondary: '#42D4FF', bg: '#F2F7FF' }
            : null)
    },
  },

  actions: {
    async loadStaticData() {
      const results = await Promise.allSettled([
        api.getBrands(),
        api.getFestivals(),
        api.getDiscountTypes(),
        api.getMerchantTemplates(),
      ])
      if (results[0].status === 'fulfilled') this.brands = results[0].value.data.brands
      else console.error('加载品牌失败:', results[0].reason)
      if (results[1].status === 'fulfilled') this.festivals = results[1].value.data.festivals
      else console.error('加载节日失败:', results[1].reason)
      if (results[2].status === 'fulfilled') this.discountTypes = results[2].value.data.discountTypes
      else console.error('加载优惠类型失败:', results[2].reason)
      if (results[3].status === 'fulfilled') this.merchantTemplates = results[3].value.data.merchantTemplates
      else console.error('加载商家模板失败:', results[3].reason)
    },

    setStep(n) {
      this.currentStep = n
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },

    updateMainCache(data) {
      Object.assign(this.mainCached, data)
      if (data.discountDetail !== undefined) {
        this.mainPromotion.content = data.discountDetail
        this.mainPromotion.discountDetail = data.discountDetail
      }
    },

    updateSecCache(data) {
      Object.assign(this.secCached, data)
      if (data.discountDetail !== undefined) {
        this.secondaryPromotion.content = data.discountDetail
        this.secondaryPromotion.discountDetail = data.discountDetail
      }
    },

    syncMainContent() {
      const parts = [this.mainPromotion.mainTitle, this.mainPromotion.subTitle].filter(Boolean)
      this.mainPromotion.content = parts.join('\n')
    },

    syncSecContent() {
      const parts = [this.secondaryPromotion.mainTitle, this.secondaryPromotion.subTitle].filter(Boolean)
      this.secondaryPromotion.content = parts.join('\n')
    },

    async generatePosters() {
      this.generating = true
      this.generateError = null
      this.enhancedFrontUrl = null
      this.enhancedBackUrl = null
      this._abortController = new AbortController()
      const brandName = this.displayBrandName || this.brand
      const selectedBrandName = this.industry === 'jewelry' ? brandName : this.customBrandName.trim()

      // 餐饮不使用珠宝节日模板；兼容旧项目中误保存的春节 festival。
      if (this.industry === 'food') this.festival = null

      if (this.industry === 'food') {
        const food = this.foodCampaign
        const offer = food.mode === 'combo'
          ? `${food.setContents || food.dishName}${food.promoPrice ? ` ${food.promoPrice}元` : ''}`
          : food.mode === 'store-event'
            ? `${food.eventType}${food.eventRule ? `：${food.eventRule}` : ''}`
            : `${food.dishName}${food.promoPrice ? ` ${food.promoPrice}元` : ''}`
        this.theme = food.mode === 'combo' ? (food.setContents || '人气套餐') : food.mode === 'store-event' ? (food.eventType || '门店活动') : (food.dishName || '招牌美食')
        this.subtitle = food.sellingPoints || food.dishDescription || offer
        this.mainPromotion.mainTitle = offer
        this.mainPromotion.subTitle = food.actionText || food.serviceMode || '到店尝鲜'
        this.syncMainContent()
        this.activities = [{
          id: `food_${Date.now()}`,
          type: 'food-offer',
          discountType: food.mode,
          discountDetail: offer,
          content: food.eventRule || food.dishDescription || food.setContents || food.sellingPoints,
          highlight: food.promoPrice || food.gift || food.actionText,
          imageUrls: food.dishImageUrl ? [food.dishImageUrl] : [],
          fieldValues: { ...food },
        }]
      }

      if (this.industry === 'electronics') {
        const electronics = this.electronicsCampaign
        const offer = `${electronics.promotionType}${electronics.promotionValue ? ` ${electronics.promotionValue}` : ''}`
        this.festival = null
        this.theme = electronics.productName || '新品焕新季'
        this.subtitle = electronics.sellingPoints || electronics.productDescription || offer
        this.mainPromotion.mainTitle = offer
        this.mainPromotion.subTitle = electronics.features || electronics.service || '立即了解'
        this.syncMainContent()
        this.activities = [{
          id: `electronics_${Date.now()}`,
          type: 'electronics-offer',
          discountType: electronics.promotionType,
          discountDetail: offer,
          content: electronics.productDescription || electronics.sellingPoints,
          highlight: electronics.promotionValue || electronics.features,
          imageUrls: [],
          fieldValues: { ...electronics },
        }]
      }

      try {
        const colors = this.festivalColors || {}
        const signal = this._abortController.signal

        const frontData = {
          brand: selectedBrandName,
          brandId: this.industry === 'jewelry' ? this.brand : '',
          industry: this.industry,
          industryName: this.industryTemplate.name,
          industryStyle: this.industryTemplate.visualStyle,
          theme: this.theme,
          subtitle: this.subtitle,
          startDate: this.startDate,
          endDate: this.endDate,
          mainTitle: this.mainPromotion.mainTitle,
          subTitle: this.mainPromotion.subTitle,
          secMainTitle: this.secondaryPromotion?.mainTitle || '',
          secSubTitle: this.secondaryPromotion?.subTitle || '',
          mainPromotion: this.mainPromotion.content,
          secondaryPromotion: this.secondaryPromotion?.content || '',
          colorScheme: this.colorScheme || '默认',
          primaryColor: colors.primary || '',
          secondaryColor: colors.secondary || '',
          bgColor: colors.bg || '',
          festivalId: this.festival || '',
          foodCampaign: this.industry === 'food' ? { ...this.foodCampaign } : undefined,
        }

        const backData = {
          brand: selectedBrandName,
          industry: this.industry,
          industryName: this.industryTemplate.name,
          industryStyle: this.industryTemplate.visualStyle,
          activities: this.activities,
          merchantInfo: this.merchantInfo,
          colorScheme: this.colorScheme || '默认',
          primaryColor: colors.primary || '',
          secondaryColor: colors.secondary || '',
          bgColor: colors.bg || '',
          festivalId: this.festival || '',
          foodCampaign: this.industry === 'food' ? { ...this.foodCampaign } : undefined,
        }

        const [frontRes, backRes] = await Promise.all([
          api.generateFrontPoster(frontData, signal),
          api.generateBackPoster(backData, signal),
        ])

        this.frontPosterUrl = frontRes.data.imageUrl
        this.backPosterUrl = backRes.data.imageUrl
        this.backBgImageUrl = backRes.data.bgImageUrl || null
      } catch (e) {
        if (e.code === 'ERR_CANCELED' || e.name === 'CanceledError' || e.name === 'AbortError') {
          this.generateError = null
          this.frontPosterUrl = null
          this.backPosterUrl = null
        } else {
          console.error('海报生成失败:', e)
          this.generateError = e.message || '生成失败'
        }
      } finally {
        this.generating = false
        this._abortController = null
      }
    },

    cancelGenerate() {
      if (this._abortController) {
        this._abortController.abort()
      }
    },

    async generateCarSticker() {
      this.generating = true
      this.generateError = null
      const brandName = this.displayBrandName || this.brand

      try {
        const colors = this.festivalColors || {}
        const data = {
          brand: brandName,
          text: this.carStickerText,
          phone: this.merchantInfo.phone || '',
          merchantName: this.merchantInfo.name || '',
          width: this.carStickerSize.width,
          height: this.carStickerSize.height,
          primaryColor: colors.primary || '',
          secondaryColor: colors.secondary || '',
          bgColor: colors.bg || '',
          festivalId: this.festival || '',
        }

        const res = await api.generateCarSticker(data)
        this.carStickerUrl = res.data.imageUrl
      } catch (e) {
        console.error('车贴生成失败:', e)
        this.generateError = e.message || '生成失败'
      } finally {
        this.generating = false
      }
    },

    // 保留静态数据与当前行业，只重置用户输入
    resetAll() {
      const keep = {
        festivals: this.festivals,
        brands: this.brands,
        discountTypes: this.discountTypes,
        merchantTemplates: this.merchantTemplates,
        industry: this.industry,
      }
      this.$reset()
      Object.assign(this, keep)
      this.currentStep = 1
      this.materialType = 'poster'
      this.projectStatus = 'draft'
      this.saveError = null
    },

    addActivity(activity) {
      if (this.activities.length < 6) {
        this.activities.push({ ...activity, id: activity.id || Date.now() })
      }
    },
    removeActivity(id) {
      this.activities = this.activities.filter(a => a.id !== id)
    },
    updateActivity(id, data) {
      const idx = this.activities.findIndex(a => a.id === id)
      if (idx !== -1) this.activities[idx] = { ...this.activities[idx], ...data }
    },

    async addCustomMerchant(data) {
      const res = await api.addCustomMerchant(data)
      this.merchantTemplates.push(res.data.merchant)
      return res.data.merchant
    },

    async deleteCustomMerchant(id) {
      await api.deleteCustomMerchant(id)
      this.merchantTemplates = this.merchantTemplates.filter(m => m.id !== id)
      if (this.selectedMerchantTemplateId === id) {
        this.selectedMerchantTemplateId = null
        this.merchantInfo = { name: '', address: '', phone: '' }
      }
    },

    async enhancePoster({ type = 'overall', target = 'back' }) {
      this.enhancing = true
      this.enhanceError = null

      try {
        const brandName = this.displayBrandName || this.brand
        const colors = this.festivalColors || {}

        const isBack = target === 'back'
        const sourceUrl = isBack ? this.backPosterUrl : this.frontPosterUrl
        if (!sourceUrl) {
          throw new Error('当前海报源图已失效，请先重新生成海报后再优化')
        }
        if (/^https?:\/\//i.test(sourceUrl) || sourceUrl.startsWith('/uploads/')) {
          const probeUrl = sourceUrl.startsWith('/') ? `${window.location.origin}${sourceUrl}` : sourceUrl
          const probe = await fetch(probeUrl, { method: 'HEAD' })
          if (!probe.ok) throw new Error('当前海报源图已失效，请先重新生成海报后再优化')
        }
        const payload = {
          imageUrl: sourceUrl,
          posterType: target,
          bgImageUrl: this.backBgImageUrl,
          type,
          activities: this.activities,
          merchantInfo: this.merchantInfo,
          brand: brandName,
          industry: this.industry,
          industryName: this.industryTemplate.name,
          industryStyle: this.industryTemplate.visualStyle,
          primaryColor: colors.primary || '',
          secondaryColor: colors.secondary || '',
          bgColor: colors.bg || '',
        }

        const res = await api.enhancePoster(payload)
        if (res.data.success) {
          if (isBack) {
            this.enhancedBackUrl = res.data.imageUrl
            if (res.data.bgImageUrl) this.backBgImageUrl = res.data.bgImageUrl
          } else {
            this.enhancedFrontUrl = res.data.imageUrl
          }
        }
      } catch (e) {
        console.error('海报优化失败:', e)
        this.enhanceError = e.message || '优化失败'
      } finally {
        this.enhancing = false
      }
    },

    // 撤销优化（清除优化版本，回到原图）
    revertEnhancement(target) {
      if (target === 'front') this.enhancedFrontUrl = null
      else if (target === 'back') this.enhancedBackUrl = null
      else { this.enhancedFrontUrl = null; this.enhancedBackUrl = null }
    },
  },
})
