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
    <router-link to="#footer" class="nav-btn">Contact</router-link>
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
.nav-btn {
  background: none;
  border: none;
  font-size: 1rem;
  color: var(--font-color);
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.2s;
}
.nav-btn:hover {
  background: var(--hover-color);
}
.navbar-center {
  display: flex;
  gap: 1.5rem;
  transition:
    max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 1;
  transform: translateY(0);
  max-height: 500px;
  overflow: hidden;
}
.menu-toggle {
  display: none;
  background: none;
  border: none;
  font-size: 2rem;
  margin: 0 1rem 0 0;
  cursor: pointer;
}
@media (max-width: 1024px) {
  .menu-toggle {
    display: block;
  }
  .navbar-center {
    position: absolute;
    left: 0;
    top: 66px;
    width: 100vw;
    background: var(--main-bg-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    flex-direction: column;
    align-items: flex-start;
    padding: 1rem 2rem;
    z-index: 1001;
    opacity: 1;
    transform: translateY(0);
    max-height: 500px;
    overflow: hidden;
  }
  .navbar-center.collapsed {
    opacity: 0;
    transform: translateY(-30px);
    max-height: 0;
    pointer-events: none;
    transition:
      max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
}
</style>
