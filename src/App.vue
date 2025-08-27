<script setup lang="ts">
import { SpeedInsights } from "@vercel/speed-insights/vue"
import { ref, onMounted } from "vue";
import axios from "axios";

export const userRole = ref("guest"); // default role = guest
export const isLoggedIn = ref(false);

export async function checkUser() {
  try {
    const res = await axios.get("/api/auth/me", { withCredentials: true });
    const user = res.data.user || { role: "guest" };
    userRole.value = user.role;
    isLoggedIn.value = user.role !== "guest";
  } catch {
    userRole.value = "guest";
    isLoggedIn.value = false;
  }
}

onMounted(() => {
  checkUser();
});
</script>

<template>
  <RouterView />
  <SpeedInsights />
</template>
