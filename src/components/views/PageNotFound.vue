<script setup lang="ts">
function goBack() {
  window.history.back();
}
</script>

<template>
  <div class="not-found-page">
    <p>The page you are looking for does not exist.</p>
    <a href="#" @click.prevent="goBack()">Go Back</a>
  </div>
</template>

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
