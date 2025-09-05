<script setup lang="ts">
  import LeftPointIcon from '../icons/IconPointLeft.vue'
  import RightPointIcon from '../icons/IconPointRight.vue'
  import StarRating from './StarRating.vue'
  import { ref } from 'vue'

  const sweetness = ref(3.5)
  const calories = ref(2)
  const categories = ref([
    'Cups & Mugs',
    'Drink bases',
    'Choco bombs',
    'Dipped cookies',
    'Top-cream',
    'Marshmallows',
    'Sprinkles',
    'Spoons & Candy canes',
    'Straw',
    'Coasters',
    'Packing styles'
  ])
  const selectedCategory = ref('Cups & Mugs')
</script>

<template>
  <div class="design-corner-layout">
    <div class="design-corner-left">
      <div class="cup-image-placeholder">
        <!-- Cup image goes here -->
      </div>
      <div class="rating-bars">
        <div class="rating-row">
          <span>Sweetness level</span>
          <StarRating v-model="sweetness" />
        </div>
        <div class="rating-row">
          <span>Calories level</span>
          <StarRating v-model="calories" />
        </div>
      </div>
    </div>
    <div class="design-corner-right">
      <div class="category">
        <div class="left-button"> <LeftPointIcon /></div>
        <div class="category-buttons">
        <button
          v-for="cat in categories"
          :key="cat"
          :class="{ active: selectedCategory === cat }"
          @click="selectedCategory = cat"
        >
          {{ cat }}
        </button>
        </div>
        <div class="right-button"> <RightPointIcon /></div>
      </div>
      <div class="options-placeholder">
        <!-- Product options go here -->
      </div>
    </div>
  </div>
</template>

<style scoped>
.design-corner-layout {
  display: flex;
  gap: 32px;
  background: var(--sub-bg-color);
  padding: 32px;
}
.design-corner-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cup-image-placeholder {
  width: 220px;
  height: 220px;
  background: #333;
  border-radius: 50%;
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rating-bars {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.rating-row {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #ffe680;
  font-size: 1.1rem;
}
.design-corner-right {
  width: 80%;
  flex: 2;
  display: flex;
  flex-direction: column;
}
.category {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}
.category-buttons {
  display: flex;
  gap: 18px;
  width: max-content;
}
.category-buttons button {
  background: #fff;
  color: #23281a;
  border: none;
  border-radius: 24px;
  padding: 10px 28px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  width: max-content;
}
.category-buttons button.active {
  background: #a0522d;
  color: #fff;
}
.options-placeholder {
  background: #23281a;
  border-radius: 12px;
  min-height: 220px;
  padding: 24px;
  color: #fff;
  box-shadow: 0 1px 6px #e0c3a044;
}
/* Star rating styles */
.star-rating {
  display: flex;
  gap: 4px;
  cursor: pointer;
}
.star {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

</style>