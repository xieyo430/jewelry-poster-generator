import { defineStore } from 'pinia'
import api from '../api'

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
    canStep1Next: (s) => s.festival && s.brand,
    canStep2Next: (s) => s.mainPromotion.mainTitle.trim().length > 0,
    canStep3Next: (s) => s.activities.length > 0 && s.merchantInfo.name.trim().length > 0,

    colorScheme: (s) => {
      if (!s.festival) return null
      const f = s.festivals?.find(f => f.id === s.festival)
      return f ? f.colorScheme : null
    },
    festivalColors: (s) => {
      if (!s.festival) return null
      const f = s.festivals?.find(f => f.id === s.festival)
      return f ? { primary: f.primaryColor, secondary: f.secondaryColor, bg: f.bgColor } : null
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
      const brandName = (this.brands?.find(b => b.id === this.brand)?.name) || this.brand

      try {
        const colors = this.festivalColors || {}
        const signal = this._abortController.signal

        const frontData = {
          brand: brandName,
          brandId: this.brand,
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
        }

        const backData = {
          brand: brandName,
          activities: this.activities,
          merchantInfo: this.merchantInfo,
          colorScheme: this.colorScheme || '默认',
          primaryColor: colors.primary || '',
          secondaryColor: colors.secondary || '',
          bgColor: colors.bg || '',
          festivalId: this.festival || '',
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
      const brandName = (this.brands?.find(b => b.id === this.brand)?.name) || this.brand

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

    // 修复：保留静态数据，只重置用户输入
    resetAll() {
      const keep = {
        festivals: this.festivals,
        brands: this.brands,
        discountTypes: this.discountTypes,
        merchantTemplates: this.merchantTemplates,
      }
      this.$reset()
      Object.assign(this, keep)
      this.currentStep = 1
      this.materialType = 'poster'
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
        const brandName = (this.brands?.find(b => b.id === this.brand)?.name) || this.brand
        const colors = this.festivalColors || {}

        const isBack = target === 'back'
        const payload = {
          imageUrl: isBack ? this.backPosterUrl : this.frontPosterUrl,
          posterType: target,
          bgImageUrl: this.backBgImageUrl,
          type,
          activities: this.activities,
          merchantInfo: this.merchantInfo,
          brand: brandName,
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
