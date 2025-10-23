<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductDetail } from '@/composables/useProductDetail'
import { useMyCart } from '@/composables/useMyCart'
import { auth } from '@/composables/useAuth'
import { formatPrice } from '@/utils/currency'
import StarRating from '@/components/design/StarRating.vue'

const route = useRoute()
const router = useRouter()
const { fetchCartItems } = useMyCart()

const productId = computed(() => {
  const id = route.params.id
  return Array.isArray(id) ? parseInt(id[0]) : parseInt(String(id))
})

const { 
  product, 
  reviews, 
  loading, 
  error, 
  averageRating,
  totalReviews,
  fetchProduct,
  fetchReviews 
} = useProductDetail()

// Component state
const selectedImage = ref(0)
const quantity = ref(1)
const addingToCart = ref(false)
const reviewText = ref('')
const reviewRating = ref(5)
const submittingReview = ref(false)

// Product images (main + thumbnails)
const productImages = computed(() => {
  if (!product.value?.imageurl) return []
  // For now, use the same image. In a real app, you'd have multiple images
  return [
    product.value.imageurl,
    product.value.imageurl,
    product.value.imageurl,
    product.value.imageurl
  ]
})

// Watch for route changes
watch(productId, (newId) => {
  if (newId && !isNaN(newId)) {
    fetchProduct(newId)
    fetchReviews(newId)
  }
}, { immediate: true })

// Add to cart functionality
async function addToCart() {
  if (!auth.isLoggedIn) {
    router.push('/auth/login')
    return
  }

  if (!product.value) return

  addingToCart.value = true
  
  try {
    // Create a drink with this product
    const drinkData = {
      drinkname: `${product.value.name} - Store Item`,
      products: [{ productid: product.value.productid, quantity: quantity.value }],
      price: product.value.price * quantity.value,
      userid: auth.user?.userid,
      uniqueid: `store-${product.value.productid}-${Date.now()}`
    }

    // Create the drink first
    const createResponse = await fetch('/api/user/products?action=create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(drinkData)
    })

    if (!createResponse.ok) throw new Error('Failed to create drink')
    
    const { drink } = await createResponse.json()

    // Add to cart
    const cartResponse = await fetch('/api/user/cart?action=add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        drinkid: drink.drinkid, 
        userid: auth.user?.userid 
      })
    })

    if (!cartResponse.ok) throw new Error('Failed to add to cart')
    
    // Refresh cart
    await fetchCartItems()
    
    alert('Added to cart successfully!')
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

  if (!reviewText.value.trim() || !product.value) return

  submittingReview.value = true

  try {
    const response = await fetch('/api/user/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        productid: product.value.productid,
        userid: auth.user?.userid,
        rating: reviewRating.value,
        comment: reviewText.value.trim()
      })
    })

    if (!response.ok) throw new Error('Failed to submit review')

    // Reset form and refresh reviews
    reviewText.value = ''
    reviewRating.value = 5
    await fetchReviews(productId.value)
    
    alert('Review submitted successfully!')
  } catch (error) {
    console.error('Error submitting review:', error)
    alert('Failed to submit review')
  } finally {
    submittingReview.value = false
  }
}

// Utility functions
function incrementQuantity() {
  quantity.value++
}

function decrementQuantity() {
  if (quantity.value > 1) {
    quantity.value--
  }
}

onMounted(() => {
  // Additional initialization if needed
})
</script>

<template>
  <div class="product-detail-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading product...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <h2>Product Not Found</h2>
      <p>{{ error }}</p>
      <button @click="router.push('/store')" class="back-btn">
        ← Back to Store
      </button>
    </div>

    <!-- Product Detail -->
    <div v-else-if="product" class="product-detail">
      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <div class="breadcrumb-path">
          <router-link to="/">Home</router-link>
          <span>/</span>
          <router-link to="/store">Store</router-link>
          <span>/</span>
          <span>{{ product.name }}</span>
        </div>
        <button @click="router.push('/store')" class="back-to-store-btn">
          ← Back to Store
        </button>
      </nav>

      <div class="product-content">
        <!-- Product Images -->
        <div class="product-images">
          <div class="main-image">
            <img 
              :src="productImages[selectedImage] || '/placeholder-image.jpg'" 
              :alt="product.name"
              class="main-product-image"
            />
          </div>
          
          <div class="thumbnail-images" v-if="productImages.length > 1">
            <img 
              v-for="(image, index) in productImages.slice(0, 4)"
              :key="index"
              :src="image"
              :alt="`${product.name} view ${index + 1}`"
              :class="['thumbnail', { active: selectedImage === index }]"
              @click="selectedImage = index"
            />
          </div>
        </div>

        <!-- Product Info -->
        <div class="product-info">
          <h1 class="product-title">{{ product.name }}</h1>
          
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
            <span class="current-price">{{ formatPrice(product.price) }}</span>
            <span class="price-note">after applying coupon code to ¥3,872</span>
            <div class="discount-tag">Est. ¥672</div>
          </div>

          <!-- Product Details -->
          <div class="product-details">
            <div class="detail-item" v-if="product.category">
              <strong>Category:</strong> {{ product.category }}
            </div>
            <div class="detail-item" v-if="product.material">
              <strong>Material:</strong> {{ product.material }}
            </div>
            <div class="detail-item" v-if="product.keyword">
              <strong>Keywords:</strong> {{ product.keyword }}
            </div>
          </div>

          <!-- Description -->
          <div class="description-section">
            <h3>Description</h3>
            <p>{{ product.description || 'No description available for this product.' }}</p>
          </div>

          <!-- Quantity and Add to Cart -->
          <div class="purchase-section">
            <div class="quantity-selector">
              <label>Qty</label>
              <div class="quantity-controls">
                <button @click="decrementQuantity" :disabled="quantity <= 1">-</button>
                <input type="number" v-model.number="quantity" min="1" max="99" />
                <button @click="incrementQuantity">+</button>
              </div>
            </div>

            <button 
              @click="addToCart"
              :disabled="addingToCart"
              class="add-to-cart-btn"
            >
              <span v-if="addingToCart">Adding to Cart...</span>
              <span v-else>Add to cart</span>
            </button>

            <button class="buy-now-btn">
              Buy it now
            </button>
          </div>

          <!-- Additional Info -->
          <div class="additional-info">
            <div class="info-item">
              <span class="icon">✓</span>
              <span>Safe payments - Secure privacy?</span>
            </div>
            <div class="info-item">
              <span class="icon">✓</span>
              <span>Order guarantee</span>
            </div>
            <div class="payment-badges">
              <span class="badge">Guaranteed</span>
              <span class="badge">Real product warranty</span>
              <span class="badge">Free Credit Card</span>
              <span class="badge">Speedy item verification</span>
              <span class="badge">Quality Assurance testing</span>
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
          
          <div class="verified-badge">
            <span class="checkmark">✓</span>
            <span>99 reviews from verified purchases</span>
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
            placeholder="Share your experience with this product..."
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
            <p>No reviews yet. Be the first to review this product!</p>
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
            <div class="review-helpful">
              <span>Helpful?</span>
              <button class="helpful-btn">👍</button>
              <button class="helpful-btn">👎</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Related Products -->
      <div class="related-products">
        <h2>Related Products</h2>
        <div class="related-grid">
          <!-- Related products would be loaded here -->
          <div class="related-placeholder">
            <p>Related products coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-detail-container {
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
  border-top: 4px solid #8B4513;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.back-btn {
  background: #8B4513;
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
  background: #8B4513;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
}

.breadcrumb a {
  color: #8B4513;
  text-decoration: none;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.breadcrumb span {
  margin: 0 8px;
}

.product-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-bottom: 40px;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.product-images {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.main-image {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
}

.main-product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-images {
  display: flex;
  gap: 10px;
}

.thumbnail {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.3s;
}

.thumbnail:hover,
.thumbnail.active {
  border-color: #8B4513;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.product-title {
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
  color: #8B4513;
}

.price-note {
  font-size: 0.9rem;
  color: #666;
}

.discount-tag {
  background: #ff4444;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  width: fit-content;
}

.product-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  font-size: 0.95rem;
  color: #555;
}

.description-section h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.description-section p {
  color: #666;
  line-height: 1.6;
  margin: 0;
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
  background: #8B4513;
  color: white;
}

.add-to-cart-btn:hover:not(:disabled) {
  background: #6B3410;
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
  color: #28a745;
  font-weight: bold;
}

.payment-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.badge {
  background: #e8f4f8;
  color: #0066cc;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  border: 1px solid #b3d9ff;
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

.verified-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #28a745;
  font-size: 0.9rem;
}

.checkmark {
  background: #28a745;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
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
  font-family: inherit;
  font-size: 0.95rem;
  margin-bottom: 15px;
  resize: vertical;
}

.submit-review-btn {
  background: #8B4513;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
}

.submit-review-btn:hover:not(:disabled) {
  background: #6B3410;
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
  margin: 0 0 15px 0;
}

.review-helpful {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  color: #666;
}

.helpful-btn {
  background: none;
  border: 1px solid #ddd;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.helpful-btn:hover {
  background: #f5f5f5;
}

.related-products {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.related-products h2 {
  margin: 0 0 20px 0;
  color: #333;
}

.related-placeholder {
  text-align: center;
  padding: 40px;
  color: #666;
  background: #f8f9fa;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .product-content {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 20px;
  }
  
  .product-detail-container {
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