<script setup lang="ts">
import Banner from '../home/Banner.vue'
import Welcome from '../design/Welcome.vue'
import ChatBot from '../design/ChatBot.vue'
import { onMounted } from 'vue'

onMounted(() => {
  document.title = 'Design | Hotto Choco'
})
</script>

<template>
  <Welcome />
  <Banner />
  <ChatBot />
</template>
