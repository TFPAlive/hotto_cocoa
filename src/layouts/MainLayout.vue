<script setup lang="ts">
import Navigation from "../components/layout/Navigation.vue";
import FooterMenu from "../components/layout/FooterMenu.vue";
</script>

<template>
  <Navigation />
  <main>
    <RouterView />
  </main>
  <FooterMenu />
</template>
