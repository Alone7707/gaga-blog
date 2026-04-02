import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter } from './router'
import App from './App.vue'
import 'virtual:uno.css'
import './style.css'

// 创建前端应用实例，并挂载全局能力。
const app = createApp(App)

app.use(createPinia())
app.use(createRouter())
app.mount('#app')
