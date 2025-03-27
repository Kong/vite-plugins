import { createApp } from 'vue'
import App from './App.vue'

import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./HomeView.vue') },
    { path: '/about', component: () => import('./AboutView.vue') },
  ],
})

createApp(App)
  .use(router)
  .mount('#app')
