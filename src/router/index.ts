import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/views/Home.vue'
import Design from '../components/views/Design.vue'
import Login from '../components/auth/Login.vue'
import Register from '../components/auth/Register.vue'
import Admin from '../components/admin/Dashboard.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/design', component: Design },
    { path: "/login", component: Login },
    { path: "/register", component: Register },
    { path: "/admin", component: Admin }
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
