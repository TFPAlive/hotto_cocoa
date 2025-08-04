<script setup lang="ts">
import IconHamburger from '../icons/IconHamburger.vue'
import IconClose from '../icons/IconClose.vue'
import { ref, onMounted, onUnmounted } from 'vue'
const showNav = ref(window.innerWidth >= 1024)
function toggleNav() {
  showNav.value = !showNav.value
}
function handleResize() {
  if (window.innerWidth < 1024) {
    showNav.value = false
  } else {
    showNav.value = true
  }
}
onMounted(() => {
  window.addEventListener('resize', handleResize)
  handleResize()
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <button class="menu-toggle" @click="toggleNav" aria-label="Toggle navigation">
    <transition name="icon-fade" mode="out-in">
      <span v-if="!showNav" key="hamburger">
        <IconHamburger />
      </span>
      <span v-else key="close">
        <IconClose />
      </span>
    </transition>
  </button>

  <div class="navbar-center" :class="{ collapsed: !showNav }">
    <router-link to="/" class="nav-btn">Story</router-link>
    <router-link to="/store" class="nav-btn">Store</router-link>
    <router-link to="/design" class="nav-btn">Design</router-link>
    <router-link to="/contact" class="nav-btn">Contact</router-link>
  </div>
</template>

<style scoped>
.icon-fade-enter-active,
.icon-fade-leave-active {
  transition: opacity 0.2s;
}
.icon-fade-enter-from,
.icon-fade-leave-to {
  opacity: 0;
}
</style>
