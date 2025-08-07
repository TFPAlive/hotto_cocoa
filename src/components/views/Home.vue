<script setup lang="ts">
import Banner from '../home/Banner.vue'
import Welcome from '../home/Welcome.vue'
import OurStory from '../home/OurStory.vue'
import OurSharedStorage from '../home/OurSharedStorage.vue'
import ProductHolder from '../home/ProductHolder.vue'
import Video from '../home/Video.vue'
import { onMounted } from 'vue'

onMounted(() => {
  document.title = 'Home | Hotto Choco'
})
</script>

<template>
  <Welcome />
  <Banner />
  <Video />
  <OurStory />
  <OurSharedStorage />
  <Banner />
  <ProductHolder />
  <Banner />
</template>
