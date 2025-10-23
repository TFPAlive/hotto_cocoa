<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/composables/useStore'
import { useMyCart } from '@/composables/useMyCart'
import { auth } from '@/composables/useAuth'
import { formatPrice } from '@/utils/currency'
import StarRating from '@/components/design/StarRating.vue'

const router = useRouter()
const { 
  products, 
  loading, 
  error, 
  selectedFilters, 
  searchQuery, 
  sortBy, 
  activeFilterCount, 
  clearAllFilters 
} = useStore()
const { fetchCartItems } = useMyCart()

// Sort options
const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name' }
]

// Filter categories with predefined options
const filterCategories = [
  {
    title: 'Ingredients',
    key: 'ingredients',
    options: ['chocolate', 'vanilla', 'strawberry', 'matcha', 'coffee', 'caramel']
  },
  {
    title: 'Drink bases',
    key: 'drinkBase', 
    options: ['hot chocolate', 'coffee', 'tea', 'matcha', 'chai']
  },
  {
    title: 'Choco bombs',
    key: 'chocoBombs',
    options: ['milk chocolate', 'dark chocolate', 'white chocolate', 'marshmallow filled']
  },
  {
    title: 'Dipped cookies',
    key: 'dippedCookies',
    options: ['chocolate chip', 'sugar', 'oatmeal', 'gingerbread']
  },
  {
    title: 'Marshmallows',
    key: 'marshmallows',
    options: ['mini', 'regular', 'flavored', 'colored']
  },
  {
    title: 'Sprinkles',
    key: 'sprinkles',
    options: ['rainbow', 'chocolate', 'holiday', 'gold']
  },
  {
    title: 'Top-cream',
    key: 'topCream',
    options: ['whipped', 'flavored', 'colored']
  },
  {
    title: 'Scoops',
    key: 'scoops',
    options: ['vanilla', 'chocolate', 'strawberry']
  },
  {
    title: 'Mugs & cups',
    key: 'mugsOrCups',
    options: ['ceramic', 'glass', 'paper', 'travel']
  },
  {
    title: 'Costum service',
    key: 'costumService',
    options: ['gift wrap', 'custom message', 'express delivery']
  }
]

// Add to cart functionality
const addingToCart = ref<number | null>(null)

async function addToCart(product: any) {
  if (!auth.isLoggedIn) {
    router.push('/auth/login')
    return
  }

  addingToCart.value = product.productid
  
  try {
    // Create a simple drink with just this product
    const drinkData = {
      drinkname: `${product.name} - Store Item`,
      products: [{ productid: product.productid, quantity: 1 }],
      price: product.price,
      userid: auth.user?.userid,
      uniqueid: `store-${product.productid}-${Date.now()}`
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
    addingToCart.value = null
  }
}

onMounted(() => {
  // Additional initialization if needed
})
</script>

<template>
  <div class="store-container">
    <!-- Header -->
    <div class="store-header">
      <div class="store-title">
        <h1>Hot Chocolate Bar</h1>
        <p>Discover our premium collection of hot chocolate ingredients and accessories</p>
      </div>
      
      <!-- Search Bar -->
      <div class="search-section">
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search products..."
          class="search-input"
        />
        <button class="search-btn">🔍</button>
      </div>
    </div>

    <div class="store-content">
      <!-- Sidebar Filters -->
      <aside class="filter-sidebar">
        <div class="filter-header">
          <h3>Browse here</h3>
          <button @click="clearAllFilters" class="clear-filters">Clear all</button>
        </div>

        <!-- Filter Categories -->
        <div v-for="category in filterCategories" :key="category.key" class="filter-category">
          <div class="filter-title">
            <span>{{ category.title }}</span>
            <span class="filter-arrow">▼</span>
          </div>
          
          <div class="filter-options">
            <label 
              v-for="option in category.options" 
              :key="option"
              class="filter-option"
            >
              <input 
                type="checkbox"
                :value="option"
                v-model="(selectedFilters as any)[category.key]"
              />
              <span class="checkmark"></span>
              {{ option }}
            </label>
          </div>
        </div>

        <!-- Additional Filters -->
        <div class="additional-filters">
          <div class="filter-category">
            <div class="filter-title">Tools</div>
          </div>
          
          <div class="filter-category">
            <div class="filter-title">Mug is a rapper</div>
          </div>
          
          <div class="filter-category">
            <div class="filter-title">Free shipping to more experience</div>
          </div>
          
          <div class="filter-category">
            <div class="filter-title">Scarce</div>
          </div>
          
          <div class="filter-category">
            <div class="filter-title">Costum service</div>
          </div>
          
          <div class="filter-category">
            <div class="filter-title">Color</div>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="products-main">
        <!-- Sort and Results Header -->
        <div class="products-header">
          <div class="results-info">
            <span>{{ products.length }} products found</span>
          </div>
          
          <div class="sort-controls">
            <label for="sort">Sort:</label>
            <select id="sort" v-model="sortBy" class="sort-select">
              <option 
                v-for="option in sortOptions" 
                :key="option.value" 
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading products...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-state">
          <p>Error loading products: {{ error }}</p>
        </div>

        <!-- Products Grid -->
        <div class="products-grid">
          <div 
            v-for="product in products" 
            :key="product.productid"
            class="product-card"
          >
            <router-link :to="`/product/${product.productid}`" class="product-image">
              <img 
                v-if="product.imageurl" 
                :src="product.imageurl" 
                :alt="product.name"
                class="product-img"
              />
              <div v-else class="product-placeholder">
                <span>No Image</span>
              </div>
            </router-link>
            
            <div class="product-info">
              <router-link :to="`/product/${product.productid}`" class="product-link">
                <h3 class="product-name">{{ product.name }}</h3>
              </router-link>
              <p class="product-description">{{ product.description || 'No description available' }}</p>
              
              <div class="product-details">
                <span v-if="product.material" class="product-material">
                  Material: {{ product.material }}
                </span>
                <span v-if="product.category" class="product-category">
                  Category: {{ product.category }}
                </span>
              </div>
              
              <div class="product-rating">
                <StarRating :modelValue="4" />
                <span class="rating-text">({{ Math.floor(Math.random() * 50) + 10 }} reviews)</span>
              </div>
              
              <div class="product-footer">
                <span class="product-price">{{ formatPrice(product.price) }}</span>
                <div class="product-actions">
                  <router-link :to="`/product/${product.productid}`" class="view-details-btn">
                    View Details
                  </router-link>
                  <button 
                    @click="addToCart(product)"
                    :disabled="addingToCart === product.productid"
                    class="add-to-cart-btn"
                  >
                    <span v-if="addingToCart === product.productid">Adding...</span>
                    <span v-else>Add to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && !error && products.length === 0" class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>No products found</h3>
          <p>Try adjusting your filters or search terms</p>
          <button @click="clearAllFilters" class="clear-filters-btn">Clear all filters</button>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.store-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  background: #faf8f5;
  min-height: 100vh;
}

.store-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px 0;
}

.store-title h1 {
  font-size: 2.5rem;
  color: #8B4513;
  margin-bottom: 10px;
  font-weight: bold;
}

.store-title p {
  color: #666;
  font-size: 1.1rem;
}

.search-section {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.search-input {
  padding: 12px 20px;
  border: 2px solid #ddd;
  border-radius: 25px;
  font-size: 1rem;
  width: 400px;
  max-width: 100%;
}

.search-input:focus {
  outline: none;
  border-color: #8B4513;
}

.search-btn {
  padding: 12px 20px;
  background: #8B4513;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
}

.store-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 30px;
  align-items: start;
}

.filter-sidebar {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.filter-header h3 {
  color: #8B4513;
  margin: 0;
  font-size: 1.2rem;
}

.clear-filters {
  background: none;
  border: 1px solid #8B4513;
  color: #8B4513;
  padding: 5px 12px;
  border-radius: 15px;
  cursor: pointer;
  font-size: 0.9rem;
}

.clear-filters:hover {
  background: #8B4513;
  color: white;
}

.filter-category {
  margin-bottom: 20px;
}

.filter-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.filter-arrow {
  font-size: 0.8rem;
  color: #666;
}

.filter-options {
  padding: 10px 0;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
  cursor: pointer;
  font-size: 0.95rem;
}

.filter-option input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 16px;
  height: 16px;
  border: 2px solid #ddd;
  border-radius: 3px;
  position: relative;
}

.filter-option input[type="checkbox"]:checked + .checkmark {
  background: #8B4513;
  border-color: #8B4513;
}

.filter-option input[type="checkbox"]:checked + .checkmark::after {
  content: '✓';
  position: absolute;
  top: -2px;
  left: 1px;
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.additional-filters .filter-title {
  font-size: 0.9rem;
  color: #666;
  padding: 8px 0;
}

.products-main {
  background: white;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.products-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.results-info {
  font-weight: 600;
  color: #333;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sort-select {
  padding: 8px 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.95rem;
}

.loading-state, .error-state, .empty-state {
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

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.clear-filters-btn {
  background: #8B4513;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 15px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
}

.product-card {
  background: #fafafa;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
  border: 1px solid #eee;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.product-image {
  height: 200px;
  overflow: hidden;
  background: white;
  display: block;
  text-decoration: none;
}

.product-link {
  text-decoration: none;
  color: inherit;
}

.product-link:hover .product-name {
  color: #8B4513;
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #999;
  font-size: 0.9rem;
}

.product-info {
  padding: 20px;
}

.product-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
  line-height: 1.4;
}

.product-description {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 12px;
}

.product-material, .product-category {
  font-size: 0.85rem;
  color: #777;
}

.product-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
}

.rating-text {
  font-size: 0.85rem;
  color: #666;
}

.product-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-price {
  font-size: 1.2rem;
  font-weight: bold;
  color: #8B4513;
  text-align: center;
}

.product-actions {
  display: flex;
  gap: 8px;
}

.view-details-btn {
  flex: 1;
  background: transparent;
  color: #8B4513;
  border: 2px solid #8B4513;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: none;
  text-align: center;
  transition: all 0.3s;
}

.view-details-btn:hover {
  background: #8B4513;
  color: white;
}

.add-to-cart-btn {
  flex: 1;
  background: #8B4513;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: background 0.3s;
}

.add-to-cart-btn:hover:not(:disabled) {
  background: #6B3410;
}

.add-to-cart-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 1024px) {
  .store-content {
    grid-template-columns: 1fr;
  }
  
  .filter-sidebar {
    position: static;
    max-height: none;
  }
  
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .store-container {
    padding: 15px;
  }
  
  .search-input {
    width: 300px;
  }
  
  .products-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
  }
}
</style>
