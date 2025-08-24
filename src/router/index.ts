import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import Home from '../components/views/Home.vue'
import Design from '../components/views/Design.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/design', component: Design },
    { path: "/login", component: () => import('../components/auth/Login.vue') },
    { path: "/register", component: () => import('../components/auth/Register.vue') },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      const el = document.querySelector(to.hash)
      if (el) {
        return { el: to.hash, behavior: 'smooth' }
      }
    }
    return savedPosition || { top: 0 }
  }
})

export default router
