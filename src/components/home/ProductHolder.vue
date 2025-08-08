<script setup lang="ts">
import IconEmpty from '../icons/IconEmpty.vue'
import { ref } from 'vue'

const sections = [
  { title: 'Your current design', buttonLabel: 'Design More', link: '/design' },
  { title: 'Recommend from your browser', buttonLabel: 'Check History', link: '/history' },
  { title: 'See more related products', buttonLabel: 'Shop All', link: '/shop' },
]

// Each section gets its own scroll index
const productCount = 10
const visibleCount = 5
const scrollIndexes = ref([0, 0, 0])

function scrollLeft(sectionIdx: number) {
  if (scrollIndexes.value[sectionIdx] > 0) {
    scrollIndexes.value[sectionIdx]--
  }
}
function scrollRight(sectionIdx: number) {
  if (scrollIndexes.value[sectionIdx] < productCount - visibleCount) {
    scrollIndexes.value[sectionIdx]++
  }
}
</script>

<template>
  <div class="product-holder-wrapper">
    <div v-for="(section, idx) in sections" :key="section.title" class="product-section">
      <div class="section-header">
        <span class="section-title">{{ section.title }}</span>
        <router-link :to="section.link" class="section-btn">{{ section.buttonLabel }}</router-link>
      </div>
      <div class="products-row-wrapper">
        <div class="products-row-bg">
          <button
            class="scroll-btn left"
            @click="scrollLeft(idx)"
            :disabled="scrollIndexes[idx] === 0"
          >
            &#8592;
          </button>
        </div>
        <div
          class="products-row"
          :style="{
            transform: `translateX(-${(scrollIndexes[idx] * 200) / productCount}%)`,
            width: `${(productCount / visibleCount) * 100}%`,
          }"
        >
          <div v-for="i in productCount" :key="i" class="product-slot">
            <div class="icon-empty-wrap">
              <svg viewBox="0 0 32 32" width="48" height="48">
                <IconEmpty />
              </svg>
              <div class="empty-text">We don’t have any products to show right now.</div>
            </div>
          </div>
        </div>
        <div class="products-row-bg">
          <button
            class="scroll-btn right"
            @click="scrollRight(idx)"
            :disabled="scrollIndexes[idx] === productCount - visibleCount"
          >
            &#8594;
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-holder-wrapper {
  display: flex;
  flex-direction: column;
  gap: 40px;
  width: 100%;
  padding: 40px 0;
  background-color: var(--button-color);
}
.product-section {
  margin: 0 auto;
  max-width: 1200px;
  background: var(--main-bg-color);
  border-radius: 18px;
  box-shadow: 0 2px 8px #e0c3a033;
  padding: 32px 24px 24px 24px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}
.section-title {
  font-size: 1.3rem;
  font-weight: bold;
  color: var(--header-color);
}
.section-btn {
  background: var(--button-color);
  color: var(--header-color);
  font-weight: bold;
  border: none;
  border-radius: 18px;
  padding: 8px 24px;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 8px #e0c3a0;
  transition:
    background 0.2s,
    color 0.2s;
}
.section-btn:hover {
  background: var(--hover-color);
  color: var(--hover-font-color);
}
.products-row {
  display: flex;
  gap: 24px;
  justify-content: stretch;
  align-items: flex-end;
  width: 100%;
  transition: transform 0.4s cubic-bezier(0.4, 0.2, 0.2, 1);
  will-change: transform;
}
.product-slot {
  flex: 1 1 0;
  min-width: calc(20% - 24px);
  max-width: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}
.icon-empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
}
.empty-text {
  margin-top: 10px;
  font-size: 0.98rem;
  color: var(--hover-font-color);
  text-align: center;
}
.products-row-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  overflow: hidden;
}
.scroll-btn {
  background: var(--button-color);
  color: var(--header-color);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px #e0c3a0;
  transition:
    background 0.2s,
    color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}
.scroll-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.products-row-bg {
  display: flex;
  align-items: center;
  background: var(--main-bg-color);
  border-radius: 12px;
  height: 100%;
  z-index: 1;
}
@media (max-width: 1024px) {
  .product-holder-wrapper {
    padding: 24px 0;
    max-width: 100%;
  }
  .product-section {
    padding: 18px 8px 16px 8px;
  }
  .products-row {
    gap: 10px;
  }
  .product-slot {
    max-width: 120px;
  }
}
</style>