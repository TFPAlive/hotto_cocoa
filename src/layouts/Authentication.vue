<script setup lang="ts">
import { RouterView } from "vue-router";
</script>

<template>
  <main>
    <div class="title"><h1><router-link to="/">Hotto Choco</router-link></h1></div>
    <RouterView />
  </main>
</template>

<style scoped>
.title {
  display: flex;
  justify-content: center;
}
.title h1 a {
  font-size: 2.5rem;
}
</style>