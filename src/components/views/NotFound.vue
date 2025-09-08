<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  document.title = '404 Not Found | Hotto Choco'
})
</script>

<template>
  <div class="not-found-container">
    <h1 class="not-found-title">404 - Page Not Found</h1>
    <p class="not-found-message">
      Oops! The page you're looking for doesn't exist.
    </p>
    <router-link to="/" class="home-link">Go back to Home</router-link>
  </div>
</template>

<style scoped>
.not-found-container {
  text-align: center;
  padding: 50px;
}
.not-found-title {
  font-size: 48px;
  margin-bottom: 20px;
}
.not-found-message {
  font-size: 18px;
  margin-bottom: 30px;
}
.home-link {
  display: inline-block;
  padding: 10px 20px;
  background-color: #a0522d;
  color: white;
  text-decoration: none;
  border-radius: 5px;
}
.home-link:hover {
  background-color: #8b4513;
}
</style>