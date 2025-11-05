<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMyCart } from '@/composables/useMyCart'
import { auth } from '@/composables/useAuth'
import { formatPrice } from '@/utils/currency'
import StarRating from '@/components/design/StarRating.vue'

const route = useRoute()
const router = useRouter()
const { fetchCartItems } = useMyCart()

const drinkId = computed(() => {
  const id = route.params.id
  return Array.isArray(id) ? parseInt(id[0]) : parseInt(String(id))
})

// Component state
const drink = ref<any>(null)
const ingredients = ref<any[]>([])
const reviews = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const addingToCart = ref(false)
const quantity = ref(1)

// Review form state
const reviewText = ref('')
const reviewRating = ref(5)
const submittingReview = ref(false)

// Computed properties
const averageRating = computed(() => {
  if (reviews.value.length === 0) return 0
  const sum = reviews.value.reduce((acc, review) => acc + review.rating, 0)
  return sum / reviews.value.length
})

const totalReviews = computed(() => reviews.value.length)

const totalPrice = computed(() => {
  if (!ingredients.value.length) return drink.value?.price || 0
  return ingredients.value.reduce((sum, ingredient) => sum + (ingredient.price * ingredient.quantity), 0)
})

// Watch for route changes
watch(drinkId, (newId) => {
  if (newId && !isNaN(newId)) {
    fetchDrink(newId)
    fetchIngredients(newId)
    fetchReviews(newId)
  }
}, { immediate: true })

// Fetch drink details
async function fetchDrink(id: number) {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch(`/api/user/products?action=drinks`)
    if (!response.ok) throw new Error('Failed to fetch drinks')
    
    const drinks = await response.json()
    const foundDrink = drinks.find((d: any) => d.drinkid === id)
    
    if (!foundDrink) {
      throw new Error('Drink not found')
    }
    
    drink.value = foundDrink
  } catch (err: any) {
    error.value = err.message
    console.error('Error fetching drink:', err)
  } finally {
    loading.value = false
  }
}

// Fetch drink ingredients
async function fetchIngredients(drinkId: number) {
  try {
    const response = await fetch(`/api/user/products?action=drinkProducts`)
    if (!response.ok) throw new Error('Failed to fetch ingredients')
    
    const allIngredients = await response.json()
    ingredients.value = allIngredients.filter((ingredient: any) => ingredient.drinkid === drinkId)
  } catch (err: any) {
    console.error('Error fetching ingredients:', err)
  }
}

// Fetch reviews (placeholder - you might need to create a specific API for drink reviews)
async function fetchReviews(drinkId: number) {
  try {
    // This is a placeholder - you might need to modify your review API to handle drinks
    const response = await fetch(`/api/user/reviews?drinkid=${drinkId}`)
    if (response.ok) {
      reviews.value = await response.json()
    }
  } catch (err: any) {
    console.error('Error fetching reviews:', err)
  }
}

// Add drink to cart
async function addToCart() {
  if (!auth.isLoggedIn) {
    router.push('/auth/login')
    return
  }

  if (!drink.value) return

  addingToCart.value = true
  
  try {
    const cartResponse = await fetch('/api/user/cart?action=add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        drinkid: drink.value.drinkid,
        userid: auth.user?.userid 
      })
    })

    if (!cartResponse.ok) throw new Error('Failed to add to cart')
    
    // Refresh cart
    await fetchCartItems()
    
    alert('Drink added to cart successfully!')
  } catch (error) {
    console.error('Error adding to cart:', error)
    alert('Failed to add to cart')
  } finally {
    addingToCart.value = false
  }
}

// Submit review
async function submitReview() {
  if (!auth.isLoggedIn) {
    router.push('/auth/login')
    return
  }

  if (!reviewText.value.trim() || !drink.value) return

  submittingReview.value = true

  try {
    const response = await fetch('/api/user/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        drinkid: drink.value.drinkid,
        userid: auth.user?.userid,
        rating: reviewRating.value,
        comment: reviewText.value.trim()
      })
    })

    if (!response.ok) throw new Error('Failed to submit review')

    // Reset form and refresh reviews
    reviewText.value = ''
    reviewRating.value = 5
    await fetchReviews(drinkId.value)
    
    alert('Review submitted successfully!')
  } catch (error) {
    console.error('Error submitting review:', error)
    alert('Failed to submit review')
  } finally {
    submittingReview.value = false
  }
}

onMounted(() => {
  // Additional initialization if needed
})
</script>

<template>
  <div class="drink-detail-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading drink...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <h2>Drink Not Found</h2>
      <p>{{ error }}</p>
      <button @click="router.push('/store')" class="back-btn">
        ← Back to Store
      </button>
    </div>

    <!-- Drink Detail -->
    <div v-else-if="drink" class="drink-detail">
      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <div class="breadcrumb-path">
          <router-link to="/">Home</router-link>
          <span>/</span>
          <router-link to="/store">Store</router-link>
          <span>/</span>
          <span>{{ drink.name || drink.drinkname }}</span>
        </div>
        <button @click="router.push('/store')" class="back-to-store-btn">
          ← Back to Store
        </button>
      </nav>

      <div class="drink-content">
        <!-- Drink Image -->
        <div class="drink-images">
          <div class="main-image">
            <img 
              :src="drink.imageurl || '/placeholder-drink.jpg'" 
              :alt="drink.name || drink.drinkname"
              class="main-drink-image"
            />
          </div>
          <div class="drink-type-badge">
            🍹 Custom Drink
          </div>
        </div>

        <!-- Drink Info -->
        <div class="drink-info">
          <h1 class="drink-title">{{ drink.name || drink.drinkname }}</h1>
          
          <!-- Rating and Reviews -->
          <div class="rating-section">
            <div class="rating-display">
              <StarRating :modelValue="averageRating" />
              <span class="rating-text">{{ averageRating.toFixed(1) }}</span>
            </div>
            <span class="review-count">{{ totalReviews }} reviews</span>
          </div>

          <!-- Price -->
          <div class="price-section">
            <span class="current-price">{{ formatPrice(drink.price || totalPrice) }}</span>
            <span class="price-note">Custom drink recipe</span>
          </div>

          <!-- Description -->
          <div class="description-section">
            <h3>Description</h3>
            <p>{{ drink.description || 'This is a custom drink recipe made with carefully selected ingredients.' }}</p>
          </div>

          <!-- Ingredients Section -->
          <div class="ingredients-section">
            <h3>Ingredients</h3>
            <div v-if="ingredients.length === 0" class="no-ingredients">
              <p>Loading ingredients...</p>
            </div>
            <div v-else class="ingredients-list">
              <div 
                v-for="ingredient in ingredients" 
                :key="ingredient.productid"
                class="ingredient-item"
              >
                <div class="ingredient-image">
                  <img 
                    v-if="ingredient.imageurl" 
                    :src="ingredient.imageurl" 
                    :alt="ingredient.name"
                    class="ingredient-img"
                  />
                  <div v-else class="ingredient-placeholder">📦</div>
                </div>
                <div class="ingredient-info">
                  <h4>{{ ingredient.name }}</h4>
                  <p class="ingredient-description">{{ ingredient.description || 'Premium ingredient' }}</p>
                  <div class="ingredient-details">
                    <span class="ingredient-quantity">Qty: {{ ingredient.quantity }}</span>
                    <span class="ingredient-price">{{ formatPrice(ingredient.price) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Add to Cart Section -->
          <div class="purchase-section">
            <div class="quantity-selector">
              <label>Qty</label>
              <div class="quantity-controls">
                <button @click="quantity = Math.max(1, quantity - 1)" :disabled="quantity <= 1">-</button>
                <input type="number" v-model.number="quantity" min="1" max="99" />
                <button @click="quantity++">+</button>
              </div>
            </div>

            <button 
              @click="addToCart"
              :disabled="addingToCart"
              class="add-to-cart-btn"
            >
              <span v-if="addingToCart">Adding to Cart...</span>
              <span v-else>Add Drink to Cart</span>
            </button>

            <button class="buy-now-btn">
              Order Now
            </button>
          </div>

          <!-- Additional Info -->
          <div class="additional-info">
            <div class="info-item">
              <span class="icon">✓</span>
              <span>Freshly prepared with premium ingredients</span>
            </div>
            <div class="info-item">
              <span class="icon">✓</span>
              <span>Custom recipe crafted for your taste</span>
            </div>
            <div class="info-item">
              <span class="icon">✓</span>
              <span>Made to order quality guarantee</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Reviews Section -->
      <div class="reviews-section">
        <h2>Reviews ({{ totalReviews }})</h2>
        
        <!-- Review Summary -->
        <div class="review-summary">
          <div class="average-rating">
            <span class="rating-number">{{ averageRating.toFixed(1) }}</span>
            <StarRating :modelValue="averageRating" />
            <span class="total-reviews">{{ totalReviews }} reviews</span>
          </div>
        </div>

        <!-- Review Form -->
        <div v-if="auth.isLoggedIn" class="review-form">
          <h3>Write a Review</h3>
          <div class="rating-input">
            <label>Your Rating:</label>
            <StarRating v-model="reviewRating" />
          </div>
          <textarea 
            v-model="reviewText"
            placeholder="Share your experience with this drink..."
            class="review-textarea"
            rows="4"
          ></textarea>
          <button 
            @click="submitReview"
            :disabled="!reviewText.trim() || submittingReview"
            class="submit-review-btn"
          >
            <span v-if="submittingReview">Submitting...</span>
            <span v-else>Submit Review</span>
          </button>
        </div>

        <!-- Reviews List -->
        <div class="reviews-list">
          <div v-if="reviews.length === 0" class="no-reviews">
            <p>No reviews yet. Be the first to review this drink!</p>
          </div>
          
          <div 
            v-for="review in reviews" 
            :key="review.reviewid"
            class="review-item"
          >
            <div class="review-header">
              <div class="reviewer-info">
                <span class="reviewer-name">{{ review.username || 'Anonymous' }}</span>
                <span class="review-date">{{ new Date(review.createdat).toLocaleDateString() }}</span>
              </div>
              <StarRating :modelValue="review.rating" />
            </div>
            <p class="review-comment">{{ review.comment }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drink-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: #faf8f5;
  min-height: 100vh;
}

.loading-state, .error-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.back-btn {
  background: #1976d2;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 20px;
}

.breadcrumb {
  margin-bottom: 20px;
  font-size: 0.9rem;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.breadcrumb-path {
  display: flex;
  align-items: center;
}

.back-to-store-btn {
  background: #1976d2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
}

.breadcrumb a {
  color: #1976d2;
  text-decoration: none;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.breadcrumb span {
  margin: 0 8px;
}

.drink-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-bottom: 40px;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.drink-images {
  display: flex;
  flex-direction: column;
  gap: 15px;
  position: relative;
}

.main-image {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
}

.main-drink-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.drink-type-badge {
  position: absolute;
  top: 15px;
  left: 15px;
  background: #e3f2fd;
  color: #1976d2;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.drink-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.drink-title {
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.rating-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-text {
  font-weight: 600;
  color: #333;
}

.review-count {
  color: #666;
  font-size: 0.9rem;
}

.price-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.current-price {
  font-size: 1.8rem;
  font-weight: bold;
  color: #1976d2;
}

.price-note {
  font-size: 0.9rem;
  color: #666;
}

.description-section h3,
.ingredients-section h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.description-section p {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.ingredients-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #1976d2;
}

.ingredients-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.ingredient-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.ingredient-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ingredient-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ingredient-placeholder {
  font-size: 1.5rem;
}

.ingredient-info {
  flex: 1;
}

.ingredient-info h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1rem;
}

.ingredient-description {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 0.9rem;
}

.ingredient-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ingredient-quantity {
  color: #666;
  font-size: 0.9rem;
}

.ingredient-price {
  color: #1976d2;
  font-weight: 600;
}

.purchase-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.quantity-selector {
  display: flex;
  align-items: center;
  gap: 15px;
}

.quantity-controls {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
}

.quantity-controls button {
  width: 40px;
  height: 40px;
  border: none;
  background: #f5f5f5;
  cursor: pointer;
  font-size: 1.2rem;
  color: #666;
}

.quantity-controls button:hover:not(:disabled) {
  background: #e5e5e5;
}

.quantity-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-controls input {
  width: 60px;
  height: 40px;
  border: none;
  text-align: center;
  font-size: 1rem;
}

.add-to-cart-btn,
.buy-now-btn {
  padding: 15px 30px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-to-cart-btn {
  background: #1976d2;
  color: white;
}

.add-to-cart-btn:hover:not(:disabled) {
  background: #1565c0;
}

.add-to-cart-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.buy-now-btn {
  background: #ff6600;
  color: white;
}

.buy-now-btn:hover {
  background: #e55a00;
}

.additional-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #666;
}

.icon {
  color: #1976d2;
  font-weight: bold;
}

.reviews-section {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.reviews-section h2 {
  margin: 0 0 20px 0;
  color: #333;
}

.review-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.average-rating {
  display: flex;
  align-items: center;
  gap: 15px;
}

.rating-number {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
}

.review-form {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.review-form h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.rating-input {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.review-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  margin-bottom: 15px;
  resize: vertical;
}

.submit-review-btn {
  background: #1976d2;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
}

.submit-review-btn:hover:not(:disabled) {
  background: #1565c0;
}

.submit-review-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.no-reviews {
  text-align: center;
  padding: 40px;
  color: #666;
}

.review-item {
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fafafa;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.reviewer-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reviewer-name {
  font-weight: 600;
  color: #333;
}

.review-date {
  font-size: 0.85rem;
  color: #666;
}

.review-comment {
  color: #555;
  line-height: 1.6;
  margin: 0;
}

@media (max-width: 768px) {
  .drink-content {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 20px;
  }
  
  .drink-detail-container {
    padding: 15px;
  }
  
  .purchase-section {
    gap: 12px;
  }
  
  .quantity-selector {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .review-summary {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
}
</style>