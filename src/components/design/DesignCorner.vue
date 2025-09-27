<script setup lang="ts">
import LeftPointIcon from '../icons/IconPointLeft.vue'
import RightPointIcon from '../icons/IconPointRight.vue'
import StarRating from './StarRating.vue'
import { computed, ref } from 'vue'
import { useProducts } from '@/composables/useProducts'
import { useAddCart } from '@/composables/useAddCart'

const { products } = useProducts()
const sweetness = ref(3.5)
const calories = ref(2)
const categories = ref([
  'Mugs & Cups',
  'Drink bases',
  'Choco bombs',
  'Dipped cookies',
  'Top-cream',
  'Marshmallows',
  'Sprinkles',
  'Spoons & Candy canes',
  'Straws',
  'Coasters',
  'Packing styles'
])
const selectedCategory = ref(categories.value[0])
const categoryButtonsRef = ref<HTMLElement | null>(null)
const selectedProducts = ref(
  categories.value.reduce((acc: Record<string, any>, cat) => {
    acc[cat.toLowerCase()] = null
    return acc
  }, {})
)

function scrollCategoryLeft() {
  if (categoryButtonsRef.value) {
    categoryButtonsRef.value.scrollBy({ left: -200, behavior: 'smooth' })
  }
}
function scrollCategoryRight() {
  if (categoryButtonsRef.value) {
    categoryButtonsRef.value.scrollBy({ left: 200, behavior: 'smooth' })
  }
}
function selectProduct(product: { category?: string; productid?: any; imageurl?: string }) {
  if (product.category) {
    selectedProducts.value[product.category.toLowerCase()] = product
  }
}
function addToCart() { 
  const { adding, error, addToCart } = useAddCart(selectedProducts.value)
  addToCart()
  if (error.value) {
    console.error('Failed to add to cart:', error.value)
  } else {
    console.log('Added to cart successfully')
  }
}
</script>

<template>
  <div class="design-corner-layout">
    <div class="design-corner-holder">
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
        <div class="price">
          <h2>Total Price</h2>
          <p>
            {{
              Object.values(selectedProducts).reduce((sum, prod) => {
                return sum + (prod?.price || 0)
              }, 0)
            }} 円
          </p>
        </div>
        <div class="button-holder">
          <button class="order-this">Order This</button>
          <button class="add-to-cart-btn" @click="addToCart">Add to Cart</button>
        </div>
      </div>
      <div class="design-corner-right">
        <div class="category">
          <div class="left-button" @click="scrollCategoryLeft"><LeftPointIcon /></div>
          <div class="category-buttons" ref="categoryButtonsRef">
            <button
              v-for="cat in categories"
              :key="cat"
              :class="{ active: selectedCategory === cat }"
              @click="selectedCategory = cat"
            >
              {{ cat }}
            </button>
          </div>
          <div class="right-button" @click="scrollCategoryRight"><RightPointIcon /></div>
        </div>
        <div class="options-placeholder">
          <div v-for="cat in categories" :key="cat" v-show="selectedCategory === cat">
            <div class="image-list">
              <div class="image-cell"
                v-for="product in products.filter(p => p.category && p.category.toLowerCase() === cat.toLowerCase())"
                :key="product.productid"
                :class="{ selected: selectedProducts[cat.toLowerCase()]?.productid === product.productid }"
                @click="selectProduct(product)"
              >
                <img v-if="product.imageurl" :src="product.imageurl" alt="Product Image" />
                <div v-else class="image-placeholder">No Image</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.design-corner-layout {
  gap: 32px;
  background: var(--main-bg-color);
  padding: 32px;
}
.design-corner-holder {
  display: flex;
  flex-direction: row;
  max-width: 1000px;
  margin: 0 auto;
}
.design-corner-left {
  width: 20%;
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
  width: 70%;
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
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
}
.category-buttons::-webkit-scrollbar {
  display: none;
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
  min-width: fit-content;
}
.category-buttons button.active {
  background: #a0522d;
  color: #fff;
}
.options-placeholder {
  background: #23281a;
  border-radius: 12px;
  min-height: 500px;
  max-height: 500px;
  padding: 24px;
  color: #fff;
  box-shadow: 0 1px 6px #e0c3a044;
  overflow-y: auto;
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
.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  margin-top: 16px;
}
.image-cell {
  flex: 0 0 20%;
  max-width: 20%;
  box-sizing: border-box;
  aspect-ratio: 1/1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  padding: 8px;
}
img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
  border-radius: 8px;
}
.image-cell.selected {
  border: 2px solid #ff8800;
  border-radius: 12px;
}
.order-this {
  background: #a0522d;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1.2rem;
  cursor: pointer;
  transition: background 0.2s;
}
.order-this:hover {
  background: #7a3a1d;
}
.add-to-cart-btn {
  background: #ff8800;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1.2rem;
  cursor: pointer;
  transition: background 0.2s;
}
.add-to-cart-btn:hover {
  background: #e67600;
}
.price {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 32px;
  width: 100%;
}
.price h2 {
  margin-right: 12px;
  font-size: 2rem;
}
.price p {
  font-size: 1.8rem;
  font-weight: bold;
  color: #ff8800;
}
.button-holder {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
}
.button-holder button {
  width: 40%;
  margin: 0 10px;
  font-size: 1rem;
}
</style>