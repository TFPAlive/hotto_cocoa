<script setup lang="ts">
import Banner from '../home/Banner.vue'
import Welcome from '../design/Welcome.vue'
import ChatBox from '../design/ChatBox.vue'
import DesignCorner from '../design/DesignCorner.vue';
import { onMounted } from 'vue'

onMounted(() => {
  document.title = 'Design | Hotto Choco'
})
</script>

<template>
  <Welcome />
  <Banner />
  <ChatBox />
  <DesignCorner />
</template>
