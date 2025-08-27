<script setup lang="ts">
import IconCampaign from '../icons/IconCampaign.vue'
import { ref } from 'vue'

const repeatCount = ref(7)
</script>

<template>
  <div class="banner">
    <div class="banner-track banner-track-1">
      <div class="banner-track-inner">
        <template v-for="n in repeatCount" :key="'a' + n">
          <span class="banner-text">Summer Campaign</span>
          <span class="banner-icon" aria-label="sun">
            <IconCampaign />
          </span>
        </template>
      </div>
    </div>
    <div class="banner-track banner-track-2">
      <div class="banner-track-inner">
        <template v-for="n in repeatCount" :key="'b' + n">
          <span class="banner-text">Summer Campaign</span>
          <span class="banner-icon" aria-label="sun">
            <IconCampaign />
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.banner {
  width: 100vw;
  height: 50px;
  overflow: hidden;
  background: var(--main-bg-color);
  display: flex;
  align-items: center;
  position: relative;
  border-top: 1px solid var(--font-color);
  border-bottom: 1px solid var(--font-color);
}
/* Two tracks for seamless looping */
.banner-track {
  width: auto;
  height: 50px;
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
}
.banner-track-1 {
  animation: banner-scroll-1 20s linear infinite;
  z-index: 1;
}
.banner-track-2 {
  animation: banner-scroll-2 20s linear infinite;
  z-index: 2;
}
.banner-track-inner {
  display: flex;
  align-items: center;
  white-space: nowrap;
  will-change: transform;
  height: 100%;
}
.banner-text {
  display: inline-block;
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--font-color);
  margin-right: 0;
  letter-spacing: 1px;
  padding: 0 30px 0 20px;
}
.banner-icon {
  display: inline-flex;
  align-items: center;
  margin-right: 20px;
}
@keyframes banner-scroll-1 {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(1952.12px);
  }
}
@keyframes banner-scroll-2 {
  0% {
    transform: translateX(-1952.12px);
  }
  100% {
    transform: translateX(0);
  }
}
</style>