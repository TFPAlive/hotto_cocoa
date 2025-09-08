<template>
  <div class="not-found-page">
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
    <router-link to="/">Go Home</router-link>
  </div>
</template>

<script setup lang="ts">
// No script needed for static 404 page
</script>

<style scoped>
.not-found-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: #a0522d;
}
h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}
p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
}
a {
  color: #fff;
  background: #a0522d;
  padding: 0.5rem 1.5rem;
  border-radius: 24px;
  text-decoration: none;
  font-weight: bold;
  transition: background 0.2s;
}
a:hover {
  background: #7a3a1d;
}
</style>
