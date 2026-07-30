import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import './styles/index.css'
import App from './App.vue'
import { router } from './router'

if (localStorage.getItem('admin-theme') !== 'light') {
  document.documentElement.classList.add('dark')
  document.documentElement.style.colorScheme = 'dark'
}

createApp(App).use(router).use(ElementPlus, { locale: zhCn }).mount('#app')
