import { ref } from 'vue'

const toasts = ref([])
let toastId = 0

function addToast(type, msg, duration = 3000) {
  const id = ++toastId
  toasts.value.push({ id, type, msg })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, duration)
}

export function useToast() {
  return {
    success: (msg, duration) => addToast('success', msg, duration || 3000),
    error: (msg, duration) => addToast('error', msg, duration || 5000),
    info: (msg, duration) => addToast('info', msg, duration || 3000),
    warning: (msg, duration) => addToast('warning', msg, duration || 4000),
  }
}

export { toasts }
