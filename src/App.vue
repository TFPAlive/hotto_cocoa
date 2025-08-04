<script setup lang="ts">
import Welcome from './components/Welcome.vue'
import SideMenu from './components/layout/SideMenu.vue'
import FooterMenu from './components/layout/FooterMenu.vue'
import { onMounted } from 'vue'
onMounted(() => {
  document.title = 'Home | Hotto Choco'
})
</script>

<template>
  <SideMenu />

  <main>
    <Welcome />
  </main>

  <FooterMenu />
</template>
