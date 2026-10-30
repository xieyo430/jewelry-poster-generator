import { ref, onBeforeUnmount } from 'vue'
import api from '../api'

// 文案候选生成（AI 帮写）。三处复用：Step1 活动主题、Step2 主爆点、Step2 次爆点
// payloadFn: () => 请求体；必须包含 target
export function useCopyOptions(payloadFn) {
  const options = ref([])
  const loading = ref(false)
  const error = ref('')
  const filtered = ref(false)
  let abortCtrl = null
  let timeoutId = null

  async function generate() {
    if (loading.value) return
    loading.value = true
    error.value = ''
    abortCtrl = new AbortController()
    timeoutId = setTimeout(() => abortCtrl.abort(), 90000)
    try {
      const res = await api.writeCopy(payloadFn(), abortCtrl.signal)
      options.value = res.data.options
      filtered.value = res.data.filtered
    } catch (e) {
      if (e.code === 'ERR_CANCELED') error.value = '生成超时（90 秒），请重试'
      else error.value = e.message || '生成失败，请重试'
    } finally {
      clearTimeout(timeoutId)
      loading.value = false
      abortCtrl = null
    }
  }

  onBeforeUnmount(() => {
    clearTimeout(timeoutId)
    abortCtrl?.abort()
  })

  return { options, loading, error, filtered, generate }
}
