<script setup lang="ts">
import Navbar from "../components/navigation/Navbar.vue";
import FooterMenu from "../components/navigation/FooterMenu.vue";
</script>

<template>
  <Navbar />
  <main>
    <RouterView />
  </main>
  <FooterMenu />
</template>
