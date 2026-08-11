import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 180000,
})

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  response => response,
  error => {
    // 取消请求直接透传，不转换
    if (error.code === 'ERR_CANCELED') {
      return Promise.reject(error)
    }
    // 提取具体错误信息
    const message = error.response?.data?.error
      || error.response?.data?.message
      || error.message
      || '网络请求失败'

    return Promise.reject(new Error(message))
  }
)

export default {
  // 原生 axios 实例（用于 AI 分析等通用请求）
  post(url, data) { return api.post(url, data) },
  get(url) { return api.get(url) },
  // 品牌
  getBrands() { return api.get('/brands') },
  getAllBrands() { return api.get('/brands/all') },
  createBrand(data) { return api.post('/brands', data) },
  updateBrand(code, data) { return api.put(`/brands/${code}`, data) },
  deleteBrand(code) { return api.delete(`/brands/${code}`) },
  uploadBrandLogo(code, file) {
    const form = new FormData()
    form.append('image', file)
    return api.post(`/brands/${code}/logo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deleteBrandLogo(code) { return api.delete(`/brands/${code}/logo`) },
  // 节日
  getFestivals() { return api.get('/festivals') },
  getAllFestivals() { return api.get('/festivals/all') },
  createFestival(data) { return api.post('/festivals', data) },
  updateFestival(code, data) { return api.put(`/festivals/${code}`, data) },
  deleteFestival(code) { return api.delete(`/festivals/${code}`) },
  // 优惠类型
  getDiscountTypes() { return api.get('/discount-types') },
  getAllDiscountTypes() { return api.get('/discount-types/all') },
  createDiscountType(data) { return api.post('/discount-types', data) },
  updateDiscountType(code, data) { return api.put(`/discount-types/${code}`, data) },
  deleteDiscountType(code) { return api.delete(`/discount-types/${code}`) },
  // 商家模板
  getMerchantTemplates() { return api.get('/merchant-info') },
  addCustomMerchant(data) { return api.post('/merchant-info/custom', data) },
  updateMerchant(id, data) { return api.put(`/merchant-info/${id}`, data) },
  deleteCustomMerchant(id) { return api.delete(`/merchant-info/custom/${id}`) },

  // 生成LOGO
  generateLogo(brandName, festival) { return api.post('/logo', { brandName, festival }) },

  // 生成正面海报
  generateFrontPoster(data, signal) { return api.post('/poster/front', data, { signal }) },
  // 生成反面海报
  generateBackPoster(data, signal) { return api.post('/poster/back', data, { signal }) },
  // 生成车贴
  generateCarSticker(data) { return api.post('/poster/car-sticker', data) },
  // AI 优化海报
  enhancePoster(data) { return api.post('/poster/enhance', data) },

  // 数据保存/加载
  saveProject(data) { return api.post('/data/save', data) },
  loadProject(projectId) { return api.get(`/data/load/${projectId}`) },
  listProjects() { return api.get('/data/list') },

  // 设置
  getSettings() { return api.get('/settings') },
  updateSettings(data) { return api.put('/settings', data) },

  // 上传文件管理
  getUploadStats() { return api.get('/data/upload-stats') },
  cleanupUploads(days = 7) { return api.post('/data/cleanup-uploads', { days }) },

  // AI 智能填充（一体化：分析+标题）
  smartFill(rawDescription) { return api.post('/ai/smart-fill', { rawDescription }) },

  // 上传图片
  uploadImage(file) {
    const form = new FormData()
    form.append('image', file)
    return api.post('/data/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
