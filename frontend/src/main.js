import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'

import './styles/global.css'
import './styles/ed-tokens.css'

const pinia = createPinia()
pinia.use(piniaPersistedstate)

// The project-root index is a functional landing page. Mount the Vue workspace
// on every application route while leaving the landing markup visible at `/`.
let mountTarget = document.getElementById('app')
if (!mountTarget && window.location.pathname !== '/') {
  document.querySelectorAll('.page, .grain, .toast').forEach(node => node.remove())
  mountTarget = document.createElement('div')
  mountTarget.id = 'app'
  document.body.appendChild(mountTarget)
}

if (mountTarget) {
  const app = createApp(App)
  app.use(pinia)
  app.use(router)
  app.mount(mountTarget)
}
