<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/backend/auth/auth'
import { useRouter } from 'vue-router'
const auth = useAuthStore()
const router = useRouter()
const loading = ref(true)

function handleLogout() {
  fetch("/api/auth/logout", { method: "POST" }) // optional
  auth.logout()
  setTimeout(() => {
    loading.value = false
    router.push("/")
  }, 1500)
}

onMounted(() => {
  handleLogout()
})
</script>

<template>
  <div class="logout-container">
    <div v-if="loading" class="logout-loading">
      <div class="spinner"></div>
      <div class="logout-text">Logging out, Please wait a moment...</div>
    </div>
  </div>
</template>

<style scoped>
.logout-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
}
.logout-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}
.logout-text {
  color: #e6b800;
  font-size: 1.2rem;
  font-weight: 500;
}
.spinner {
  width: 48px;
  height: 48px;
  border: 6px solid #ffe680;
  border-top: 6px solid #a0522d;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>