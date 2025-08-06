<script setup lang="ts">
import Banner from '../home/Banner.vue'
import Welcome from '../home/Welcome.vue'
import OurStory from '../home/OurStory.vue'
import OurSharedStorage from '../home/OurSharedStorage.vue'
import ProductHolder from '../home/ProductHolder.vue'
import { onMounted } from 'vue'

onMounted(() => {
  document.title = 'Design | Hotto Choco'
})
</script>

<template>
  <div class="banner-video-container">
    <div class="container">
      <video class="banner-video" src="/banner.mp4" autoplay loop muted playsinline></video>
    </div>
  </div>
  <div class="design-section">
    <div class="instruction-box-red">Instruction HERE</div>
    <div class="main-box-black">Making your own Hotto Choco</div>
  </div>
  <OurStory />
  <OurSharedStorage />
  <Banner />
  <ProductHolder />
  <Banner />
</template>

<style scoped>
.design-section {
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 60px auto 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
}
.main-box-black {
  background: var(--main-bg-color);
  color: #fff;
  font-size: 2rem;
  font-weight: bold;
  padding: 48px 32px 32px 32px;
  border-radius: 18px;
  width: 100%;
  text-align: center;
  position: relative;
  z-index: 1;
  box-shadow: 0 4px 24px #0002;
}
.instruction-box-red {
  background: #e53935;
  color: #fff;
  font-size: 1.2rem;
  font-weight: bold;
  padding: 18px 32px;
  border-radius: 12px;
  width: 80%;
  text-align: center;
  position: absolute;
  top: -28px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  box-shadow: 0 2px 12px #b71c1c44;
}

.banner-video-container {
  width: 100%;
  height: 300px;
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
