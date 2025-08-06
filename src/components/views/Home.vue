<script setup lang="ts">
import Banner from '../home/Banner.vue'
import Welcome from '../home/Welcome.vue'
import OurStory from '../home/OurStory.vue'
import OurSharedStorage from '../home/OurSharedStorage.vue'
import ProductHolder from '../home/ProductHolder.vue'
import { onMounted } from 'vue'

onMounted(() => {
  document.title = 'Home | Hotto Choco'
})
</script>

<template>
  <Welcome />
  <Banner />
  <div class="banner-video-container">
    <div class="container">
      <video class="banner-video" src="/banner.mp4" autoplay loop muted playsinline></video>
    </div>
  </div>
  <OurStory />
  <OurSharedStorage />
  <Banner />
  <ProductHolder />
  <Banner />
</template>

<style scoped>
.banner-video-container {
  width: 100%;
  height: 800px;
  position: relative;
  overflow: hidden;
  background: transparent;
}
.banner-video {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  object-fit: cover;
  display: block;
  pointer-events: none;
  background-size: cover;
  background-position: center;
}
</style>
