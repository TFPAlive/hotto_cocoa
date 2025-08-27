<script setup lang="ts">
import Navbar from "../components/layout/Navbar.vue";
import FooterMenu from "../components/layout/FooterMenu.vue";
</script>

<template>
  <Navbar />
  <main>
    <RouterView />
  </main>
  <FooterMenu />
</template>
