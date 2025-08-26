<script setup lang="ts">
import SideMenu from "@/components/layout/SideMenu.vue";
import FooterMenu from "@/components/layout/FooterMenu.vue";
</script>

<template>
  <SideMenu />
  <main>
    <RouterView />
  </main>
  <FooterMenu />
</template>
