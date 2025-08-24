import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "../layouts/MainLayout.vue";
import AdminLayout from "../layouts/AdminLayout.vue";
import Landing from "../components/admin/Landing.vue";
import Home from "../components/views/Home.vue";

const routes = [
  {
    path: "/",
    component: MainLayout,
    children: [
      { path: "", component: Home },
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
});