import { defineStore } from 'pinia'
import api from '../api'

export const usePosterStore = defineStore('poster', {
  persist: {
    omit: ['generating', 'generateError'],
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
      hasSecondary: false,
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
      wechat: '',
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
  }),

  getters: {
    canStep1Next: (s) => s.festival && s.brand,
    canStep2Next: (s) => s.mainPromotion.mainTitle.trim().length > 0,
    canStep3Next: (s) => s.activities.length > 0 && s.merchantInfo.name.trim().length > 0,

    colorScheme: (s) => {
      if (!s.festival) return null
      const f = s.festivals.find(f => f.id === s.festival)
      return f ? f.colorScheme : null
    },
    festivalColors: (s) => {
      if (!s.festival) return null
      const f = s.festivals.find(f => f.id === s.festival)
      return f ? { primary: f.primaryColor, secondary: f.secondaryColor, bg: f.bgColor } : null
    },
  },

  actions: {
    async loadStaticData() {
      try {
        const [brandsRes, festivalsRes, discountRes, merchantRes] = await Promise.all([
          api.getBrands(),
          api.getFestivals(),
          api.getDiscountTypes(),
          api.getMerchantTemplates(),
        ])
        this.brands = brandsRes.data.brands
        this.festivals = festivalsRes.data.festivals
        this.discountTypes = discountRes.data.discountTypes
        this.merchantTemplates = merchantRes.data.merchantTemplates
      } catch (e) {
        console.error('加载静态数据失败:', e)
      }
    },

    setStep(n) {
      this.currentStep = n
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
      this.mainPromotion.discountDetail = this.mainPromotion.content
    },

    syncSecContent() {
      const parts = [this.secondaryPromotion.mainTitle, this.secondaryPromotion.subTitle].filter(Boolean)
      this.secondaryPromotion.content = parts.join('\n')
      this.secondaryPromotion.discountDetail = this.secondaryPromotion.content
    },

    async generatePosters() {
      this.generating = true
      this.generateError = null
      const brandName = this.brands.find(b => b.id === this.brand)?.name || this.brand

      try {
        const colors = this.festivalColors || {}

        const frontData = {
          brand: brandName,
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
          api.generateFrontPoster(frontData),
          api.generateBackPoster(backData),
        ])

        this.frontPosterUrl = frontRes.data.imageUrl
        this.backPosterUrl = backRes.data.imageUrl
      } catch (e) {
        console.error('海报生成失败:', e)
        this.generateError = e.message || '生成失败'
      } finally {
        this.generating = false
      }
    },

    async generateCarSticker() {
      this.generating = true
      this.generateError = null
      const brandName = this.brands.find(b => b.id === this.brand)?.name || this.brand

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
  },
})
