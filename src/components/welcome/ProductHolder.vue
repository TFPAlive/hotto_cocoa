<script setup lang="ts">
import '../../assets/productholder.css'
import IconEmpty from '../icons/IconEmpty.vue'
import { ref } from 'vue'

const sections = [
  { title: 'Your current design', buttonLabel: 'Design More' },
  { title: 'Recommend from your browser', buttonLabel: 'Check History' },
  { title: 'See more related products', buttonLabel: 'Shop All' },
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
        <button class="section-btn">{{ section.buttonLabel }}</button>
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
