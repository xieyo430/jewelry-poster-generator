import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'

import './styles/md3-tokens.css'
import './styles/global.css'
import './styles/md3-components.css'

const pinia = createPinia()
pinia.use(piniaPersistedstate)

const app = createApp(App)
app.use(pinia)
app.mount('#app')
