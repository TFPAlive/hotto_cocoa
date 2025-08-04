<script setup lang="ts">
import Banner from './welcome/Banner.vue'
import Welcome from './welcome/Welcome.vue'
</script>

<template>
  <Welcome />
  <Banner />
  <div class="banner-video-container">
    <video class="banner-video" src="/banner.mp4" autoplay loop muted playsinline></video>
  </div>
</template>

<style scoped>
.banner-video-container {
  width: 100%;
  height: 500px;
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
