<script setup lang="ts">
import SideMenu from './components/layout/SideMenu.vue'
import FooterMenu from './components/layout/FooterMenu.vue'
import { SpeedInsights } from "@vercel/speed-insights/vue"
</script>

<template>
  <RouterView />
  <SpeedInsights />
</template>
