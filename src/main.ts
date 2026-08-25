import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
  
import './assets/main.css'
import router from './router'
import { i18n } from './i18n'
import { applyTheme } from './utiles/theme'

// Sets this year's brand colors as CSS custom properties, overriding
// main.css's fallback defaults. To reskin for a new year, edit
// src/constants/colors.ts only.
applyTheme()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)                   

app.mount('#app')