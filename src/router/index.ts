import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "@/layouts/MainLayout.vue";
import AdminLayout from "@/layouts/AdminLayout.vue";
import Landing from "@/components/admin/Landing.vue";
import Home from "@/components/views/Home.vue";
import Design from "@/components/views/Design.vue";
import Login from "@/components/auth/Login.vue";
import Register from "@/components/auth/Register.vue";
import NotFound from "@/components/views/NotFound.vue";

const routes = [
  {
    path: "/",
    component: MainLayout,
    children: [
      { path: "/", component: Home },
      { path: "/design", component: Design },
      { path: "/login", component: Login },
      { path: "/register", component: Register },
      { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFound },  // Catch-all route
      // ...other normal pages
    ]
  },
  {
    path: "/admin",
    component: AdminLayout,
    children: [
      { path: "", component: Landing },
      // ...other admin pages
    ]
  }
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return { 
        el: to.hash,
        behavior: 'smooth',
      };
    }
    return { top: 0 };
  }
});