import { createRouter, createWebHistory } from 'vue-router'

import IndexPage from '@/pages/IndexPage.vue'
import LoginPage from '@/pages/LoginPage.vue'

const routes = [
  {
    path: '/',
    component: IndexPage,
    meta: {
      title: 'AI会话',
    },
  },
  {
    path: '/login',
    component: LoginPage,
    meta: {
      title: '登录页',
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
