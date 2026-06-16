import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 180000,
})

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  response => response,
  error => {
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
  // 节日
  getFestivals() { return api.get('/festivals') },
  // 优惠类型
  getDiscountTypes() { return api.get('/discount-types') },
  // 商家模板
  getMerchantTemplates() { return api.get('/merchant-info') },

  // 生成LOGO
  generateLogo(brandName, festival) { return api.post('/logo', { brandName, festival }) },

  // 生成正面海报
  generateFrontPoster(data) { return api.post('/poster/front', data) },
  // 生成反面海报
  generateBackPoster(data) { return api.post('/poster/back', data) },
  // 生成车贴
  generateCarSticker(data) { return api.post('/poster/car-sticker', data) },

  // 数据保存/加载
  saveProject(data) { return api.post('/data/save', data) },
  loadProject(projectId) { return api.get(`/data/load/${projectId}`) },
  listProjects() { return api.get('/data/list') },

  // 上传图片
  uploadImage(file) {
    const form = new FormData()
    form.append('image', file)
    return api.post('/data/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
