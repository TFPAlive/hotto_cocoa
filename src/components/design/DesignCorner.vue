<script setup lang="ts">
import LeftPointIcon from '../icons/IconPointLeft.vue'
import RightPointIcon from '../icons/IconPointRight.vue'
import StarRating from './StarRating.vue'
import { ref, onMounted, nextTick } from 'vue'
import { useCreateDrink } from '@/composables/useCreateDrink'
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
const showTooltip = ref(false)
const tooltipPosition = ref({ x: 0, y: 0 })
const showDTooltip = ref(false)
const hoveredProduct = ref<any>(null)
const isDragging = ref(false)
const startX = ref(0)
const scrollLeft = ref(0)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const drinkName = ref('Your Custom Drink')

function scrollCategoryLeft() {
  if (categoryButtonsRef.value) {
    categoryButtonsRef.value.scrollBy({ left: -200, behavior: 'smooth' })
    setTimeout(updateScrollButtons, 300) // Wait for scroll animation to complete
  }
}
function scrollCategoryRight() {
  if (categoryButtonsRef.value) {
    categoryButtonsRef.value.scrollBy({ left: 200, behavior: 'smooth' })
    setTimeout(updateScrollButtons, 300) // Wait for scroll animation to complete
  }
}
function selectProduct(product: { category?: string; productid?: any; imageurl?: string }) {
  if (product.category) {
    selectedProducts.value[product.category.toLowerCase()] = product
  }
}
async function addToCart() {
  const { createDrink, error, drinkid } = useCreateDrink(
    selectedProducts.value,
    drinkName.value,
    Object.values(selectedProducts.value).reduce((sum, prod) => {
      return sum + (prod?.price || 0)
    }, 0)
  )

  await createDrink() // wait until drink is created

  if (error.value || !drinkid.value) {
    console.error('Failed to create drink:', error.value)
    return
  }

  const { error: cartError, addToCart } = useAddCart(drinkid.value)
  await addToCart()

  if (cartError.value) {
    console.error('Failed to add to cart:', cartError.value)
  } else {
    console.log('Added to cart successfully')
  }
}
function createDrink() {
  const { createDrink, error, drinkid } = useCreateDrink(selectedProducts.value, drinkName.value, 
    Object.values(selectedProducts.value).reduce((sum, prod) => {
      return sum + (prod?.price || 0)
    }, 0)
  )
  createDrink()
  if (error.value) {
    console.error('Failed to create drink:', error.value)
  } else {
    console.log('Drink created successfully')
  }
}
function showChoiceTooltip(event: MouseEvent) {
  showTooltip.value = true
  tooltipPosition.value = { x: event.clientX + 10, y: event.clientY + 10 }
}
function hideChoiceTooltip() {
  showTooltip.value = false
}
function updateTooltipPosition(event: MouseEvent) {
  if (showTooltip.value) {
    tooltipPosition.value = { x: event.clientX + 10, y: event.clientY + 10 }
  }
}
function resetSelections() {
  selectedProducts.value = categories.value.reduce((acc: Record<string, any>, cat) => {
    acc[cat.toLowerCase()] = null
    return acc
  }, {})
  drinkName.value = 'Your Custom Drink'
  sweetness.value = 3.5
  calories.value = 2
}
function showDetailsTooltip(event: MouseEvent, product: any) {
  showDTooltip.value = true
  hoveredProduct.value = product
}
function hideDetailsTooltip() {
  showDTooltip.value = false
  hoveredProduct.value = null
}
function startDrag(e: MouseEvent) {
  isDragging.value = true
  if (categoryButtonsRef.value) {
    startX.value = e.pageX - categoryButtonsRef.value.offsetLeft
    scrollLeft.value = categoryButtonsRef.value.scrollLeft
    categoryButtonsRef.value.style.cursor = 'grabbing'
  }
}
function drag(e: MouseEvent) {
  if (!isDragging.value || !categoryButtonsRef.value) return
  e.preventDefault()
  const x = e.pageX - categoryButtonsRef.value.offsetLeft
  const walk = (x - startX.value) * 2 // Multiply by 2 for faster scrolling
  categoryButtonsRef.value.scrollLeft = scrollLeft.value - walk
}
function endDrag() {
  isDragging.value = false
  if (categoryButtonsRef.value) {
    categoryButtonsRef.value.style.cursor = 'grab'
  }
  updateScrollButtons()
}
function updateScrollButtons() {
  if (!categoryButtonsRef.value) return
  
  const element = categoryButtonsRef.value
  canScrollLeft.value = element.scrollLeft > 0
  canScrollRight.value = element.scrollLeft < (element.scrollWidth - element.clientWidth)
}
onMounted(() => {
  nextTick(() => {
    updateScrollButtons()
  })
})
</script>

<template>
  <div class="design-corner-layout">
    <div class="design-corner-holder">
      <div class="design-corner-left">
        <div class="cup-image-placeholder" 
          @mouseenter="showChoiceTooltip"
          @mouseleave="hideChoiceTooltip"
          @mousemove="updateTooltipPosition"
        >
          <!-- Cup image goes here -->
        </div>
        <div class="drink-name-holder">
          <input 
            v-model="drinkName" 
            type="text" 
            class="drink-name-input"
            placeholder="Enter drink name..."
            maxlength="50"
          />
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
          <button class="create-drink" @click="createDrink">Create Drink</button>
          <button class="add-to-cart-btn" @click="addToCart">Add to Cart</button>
          <button class="reset-btn" @click="resetSelections">Reset</button>
        </div>
      </div>
      <div class="design-corner-right">
        <div class="category">
            <div class="left-button" @click="scrollCategoryLeft" v-show="canScrollLeft"><LeftPointIcon /></div>
          <div class="category-buttons" ref="categoryButtonsRef"
            @mousedown="startDrag"
            @mousemove="drag"
            @mouseup="endDrag"
            @mouseleave="endDrag"
            @scroll="updateScrollButtons"
          >
            <button
              v-for="cat in categories"
              :key="cat"
              :class="{ active: selectedCategory === cat }"
              @click="selectedCategory = cat"
            >
              {{ cat }}
            </button>
          </div>
          <div class="right-button" @click="scrollCategoryRight" v-show="canScrollRight"><RightPointIcon /></div>
        </div>
        <div class="options-placeholder">
          <div v-for="cat in categories" :key="cat" v-show="selectedCategory === cat">
            <div class="image-list">
              <div class="image-cell"
                v-for="product in products.filter(p => p.category && p.category.toLowerCase() === cat.toLowerCase())"
                :key="product.productid"
                :class="{ selected: selectedProducts[cat.toLowerCase()]?.productid === product.productid }"
                @click="selectProduct(product)"
                @mouseenter="(event) => showDetailsTooltip(event, product)"
                @mouseleave="hideDetailsTooltip"
              >
                <img v-if="product.imageurl" :src="product.imageurl" alt="Product Image" />
                <div v-else class="image-placeholder">No Image</div>
              </div>
            </div>
          </div>
          <div class="description">
            <div v-if="showDTooltip" class="description-tooltip">
              <div v-if="hoveredProduct" class="product-details">
                <h4>{{ hoveredProduct.name || 'Unknown Product' }}</h4>
                <p class="product-description">{{ hoveredProduct.description || 'No description available' }}</p>
                <div class="product-info">
                  <span class="price">Price: {{ hoveredProduct.price || 0 }} 円</span>
                  <span class="category">Category: {{ hoveredProduct.category || 'Unknown' }}</span>
                  <span v-if="hoveredProduct.material" class="material">Material: {{ hoveredProduct.material }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Tooltip table for selected choices -->
    <div v-if="showTooltip" class="choice-tooltip" :style="{ left: tooltipPosition.x + 'px', top: tooltipPosition.y + 'px' }">
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Product</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(product, category) in selectedProducts" :key="category">
            <td v-if="product">{{ category.charAt(0).toUpperCase() + category.slice(1) }}</td>
            <td v-if="product">{{ product.name || 'Unknown' }}</td>
            <td v-if="product">{{ product.price || 0 }} 円</td>
          </tr>
        </tbody>
      </table>
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
  max-width: 1100px;
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

.drink-name-holder {
  width: 100%;
  margin-bottom: 24px;
}

.drink-name-input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 2px solid #a0522d;
  color: #ffe680;
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  padding: 8px 0;
  outline: none;
  transition: border-color 0.2s, color 0.2s;
}

.drink-name-input:focus {
  border-bottom-color: #ff8800;
  color: #fff;
}

.drink-name-input::placeholder {
  color: #888;
  font-weight: normal;
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
  cursor: grab;
  user-select: none;
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
.create-drink {
  background: #a0522d;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1.2rem;
  cursor: pointer;
  transition: background 0.2s;
}
.create-drink:hover {
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
  flex-direction: column;
  align-items: center;
  width: 100%;
}
.button-holder button {
  width: 70%;
  margin: 10px 10px;
  font-size: 1rem;
}

/* Tooltip styles */
.choice-tooltip {
  position: fixed;
  background: rgba(35, 40, 26, 0.95);
  border: 1px solid #a0522d;
  border-radius: 8px;
  padding: 12px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  pointer-events: none;
}

.choice-tooltip table {
  border-collapse: collapse;
  color: #fff;
  font-size: 0.9rem;
}

.choice-tooltip th,
.choice-tooltip td {
  padding: 6px 12px;
  text-align: left;
  border-bottom: 1px solid #666;
}

.choice-tooltip th {
  background: #a0522d;
  font-weight: bold;
  color: #fff;
}

.choice-tooltip tr:last-child td {
  border-bottom: none;
}

/* Description tooltip styles */
.description-tooltip {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #a0522d;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
  max-width: 100%;
  color: #fff;
  backdrop-filter: blur(2px);
}

.product-details h4 {
  margin: 0 0 8px 0;
  color: #ff8800;
  font-size: 1.1rem;
}

.product-description {
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  line-height: 1.4;
  color: #e0e0e0;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-info span {
  font-size: 0.8rem;
  color: #ccc;
}

.product-info .price {
  color: #ff8800;
  font-weight: bold;
}
.reset-btn {
  background: #555;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1.2rem;
  cursor: pointer;
  transition: background 0.2s;
}
</style>