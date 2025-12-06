<script setup lang="ts">
import Store from '@/components/store/Store.vue'
import SideAdvertisement from '@/components/mypage/SideAdvertisement.vue'
</script>

<template>
    <Store />
</template>

<style scoped>
.ad-sidebar {
  width: 280px;
  flex-shrink: 0;
  background: var(--sub-bg-color);
  border: 2px solid var(--header-color);
  border-left: none;
  border-radius: 0 8px 8px 0;
  padding: 20px;
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  overflow-x: hidden;
}

.ad-sidebar::-webkit-scrollbar {
  width: 6px;
}

.ad-sidebar::-webkit-scrollbar-track {
  background: var(--main-bg-color);
  border-radius: 3px;
}

.ad-sidebar::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.ad-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--hover-color);
}

@media (max-width: 1024px) {
  .store-container {
    flex-direction: column;
  }

  .ad-sidebar {
    width: 100%;
    position: relative;
    top: 0;
    max-height: none;
    border-left: 2px solid var(--header-color);
    border-top: none;
    border-radius: 0 0 8px 8px;
    margin-top: 0;
  }
}
</style>
