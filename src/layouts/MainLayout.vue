<script setup lang="ts">
import SideMenu from "../components/layout/SideMenu.vue";
import FooterMenu from "../components/layout/FooterMenu.vue";
</script>

<template>
  <main>
  <SideMenu />
    <RouterView />
  </main>
  <FooterMenu />
</template>
