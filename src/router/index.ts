import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "@/layouts/MainLayout.vue";
import AdminLayout from "@/layouts/AdminLayout.vue";
import AuthenticationLayout from "@/layouts/Authentication.vue";

const routes = [
  {
    path: "/",
    component: MainLayout,
    children: [
      { path: "", component: () => import("@/components/views/Home.vue") },
      { path: "design", component: () => import("@/components/views/Design.vue") },
      // ...other normal pages
    ]
  },
  {
    path: "/admin",
    component: AdminLayout,
    children: [
      { path: "", component: () => import("@/components/admin/Landing.vue") },
      { path: "product", component: () => import("@/components/admin/Product.vue") },
      // ...other admin pages
    ]
  },
  {
    path: "/auth" ,
    component: AuthenticationLayout,
    children: [
      { path: "login", component: () => import("@/components/auth/Login.vue") },
      { path: "register", component: () => import("@/components/auth/Register.vue") },
    ]
  },
  // Move catch-all route here to avoid conflict with /admin
  { path: "/:pathMatch(.*)*", name: "NotFound", component: () => import("@/components/views/NotFound.vue") }  // Catch-all route
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