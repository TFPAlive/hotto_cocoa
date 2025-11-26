<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStoreItems } from '@/composables/useStoreItems'
import { useMyCart } from '@/composables/useMyCart'
import { auth } from '@/composables/useAuth'
import { formatPrice } from '@/utils/currency'
import StarRating from '@/components/design/StarRating.vue'

const router = useRouter()
const { 
  items, 
  loading, 
  error, 
  selectedFilters, 
  searchQuery, 
  sortBy, 
  activeFilterCount, 
  clearAllFilters,
  fetchStoreItems
} = useStoreItems()
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
    title: 'Item Type',
    key: 'itemType',
    options: ['products', 'drinks']
  },
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
const addingAsProduct = ref<number | null>(null)

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

// Add product directly to cart
async function addProductToCart(product: any) {
  if (!auth.isLoggedIn) {
    router.push('/auth/login')
    return
  }

  addingAsProduct.value = product.productid
  
  try {
    // Add product directly to cart
    const cartResponse = await fetch('/api/user/cart?action=add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        productid: product.productid,
        quantity: 1,
        userid: auth.user?.userid 
      })
    })

    if (!cartResponse.ok) throw new Error('Failed to add product to cart')
    
    // Refresh cart
    await fetchCartItems()
    
    alert('Product added to cart successfully!')
  } catch (error) {
    console.error('Error adding product to cart:', error)
    alert('Failed to add product to cart')
  } finally {
    addingAsProduct.value = null
  }
}

// Add drink to cart
async function addDrinkToCart(drink: any) {
  if (!auth.isLoggedIn) {
    router.push('/auth/login')
    return
  }

  addingToCart.value = drink.drinkid
  
  try {
    // Add drink directly to cart
    const cartResponse = await fetch('/api/user/cart?action=add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        drinkid: drink.drinkid,
        userid: auth.user?.userid 
      })
    })

    if (!cartResponse.ok) throw new Error('Failed to add drink to cart')
    
    // Refresh cart
    await fetchCartItems()
    
    alert('Drink added to cart successfully!')
  } catch (error) {
    console.error('Error adding drink to cart:', error)
    alert('Failed to add drink to cart')
  } finally {
    addingToCart.value = null
  }
}

onMounted(async () => {
  await fetchStoreItems()
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
            <span>{{ items.length }} items found</span>
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
            v-for="item in items" 
            :key="`${item.item_type}-${item.productid || item.drinkid}`"
            class="product-card"
          >
            <!-- Item Type Badge -->
            <div class="item-type-badge" :class="item.item_type">
              {{ item.item_type === 'drink' ? '🍹 Drink' : '🛒 Product' }}
            </div>

            <router-link 
              :to="item.item_type === 'drink' ? `/drinks/${item.drinkid}` : `/products/${item.productid}`" 
              class="product-image"
            >
              <img 
                v-if="item.imageurl" 
                :src="item.imageurl" 
                :alt="item.name"
                class="product-img"
              />
              <div v-else class="product-placeholder">
                <span>{{ item.item_type === 'drink' ? '🍹' : '📦' }}</span>
              </div>
            </router-link>
            
            <div class="product-info">
              <router-link 
                :to="item.item_type === 'drink' ? `/drinks/${item.drinkid}` : `/products/${item.productid}`" 
                class="product-link"
              >
                <h3 class="product-name">{{ item.name }}</h3>
              </router-link>
              
              <div class="product-details" v-if="item.item_type === 'product'">
                <span v-if="item.material" class="product-material">
                  Material: {{ item.material }}
                </span>
                <span v-if="item.category" class="product-category">
                  Category: {{ item.category }}
                </span>
              </div>
              
              <div class="product-rating">
                <StarRating :modelValue="4" />
                <span class="rating-text">({{ Math.floor(Math.random() * 50) + 10 }} reviews)</span>
              </div>
              
              <div class="product-footer">
                <span class="product-price">{{ formatPrice(item.price) }}</span>
                <div class="product-actions">
                  <router-link 
                    :to="item.item_type === 'drink' ? `/drinks/${item.drinkid}` : `/products/${item.productid}`" 
                    class="view-details-btn"
                  >
                    View Details
                  </router-link>
                  
                  <!-- Product Actions -->
                  <template v-if="item.item_type === 'product'">
                    <button 
                      @click="addProductToCart(item)"
                      :disabled="addingAsProduct === item.productid"
                      class="add-to-cart-btn primary"
                    >
                      <span v-if="addingAsProduct === item.productid">Adding...</span>
                      <span v-else>Buy Item</span>
                    </button>
                  </template>

                  <!-- Drink Actions -->
                  <template v-if="item.item_type === 'drink'">
                    <button 
                      @click="addDrinkToCart(item)"
                      :disabled="addingToCart === item.drinkid"
                      class="add-to-cart-btn primary"
                    >
                      <span v-if="addingToCart === item.drinkid">Adding...</span>
                      <span v-else>Add to Cart</span>
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && !error && items.length === 0" class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>No items found</h3>
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
  background: var(--main-bg-color);
  min-height: 100vh;
}

.store-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px 0;
}

.store-title h1 {
  font-size: 2.5rem;
  color: var(--header-color);
  margin-bottom: 10px;
  font-weight: bold;
}

.store-title p {
  color: var(--font-color);
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
  border: 2px solid var(--button-color);
  border-radius: 25px;
  font-size: 1rem;
  width: 400px;
  max-width: 100%;
}

.search-input:focus {
  outline: none;
  border-color: var(--header-color);
}

.search-btn {
  padding: 12px 20px;
  background: var(--button-color);
  color: var(--header-color);
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
  background: var(--main-bg-color);
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px var(--shadow-color);
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
  border-bottom: 2px solid var(--sub-bg-color);
}

.filter-header h3 {
  color: var(--header-color);
  margin: 0;
  font-size: 1.2rem;
}

.clear-filters {
  background: none;
  border: 1px solid var(--header-color);
  color: var(--header-color);
  padding: 5px 12px;
  border-radius: 15px;
  cursor: pointer;
  font-size: 0.9rem;
}

.clear-filters:hover {
  background: var(--header-color);
  color: var(--main-bg-color);
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
  color: var(--font-color);
  cursor: pointer;
  border-bottom: 1px solid var(--sub-bg-color);
}

.filter-arrow {
  font-size: 0.8rem;
  color: var(--font-color);
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
  border: 2px solid var(--shadow-color);
  border-radius: 3px;
  position: relative;
}

.filter-option input[type="checkbox"]:checked + .checkmark {
  background: var(--header-color);
  border-color: var(--header-color);
}

.filter-option input[type="checkbox"]:checked + .checkmark::after {
  content: '✓';
  position: absolute;
  top: -2px;
  left: 1px;
  color: var(--main-bg-color);
  font-size: 12px;
  font-weight: bold;
}

.additional-filters .filter-title {
  font-size: 0.9rem;
  color: var(--font-color);
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
  border-bottom: 2px solid var(--sub-bg-color);
}

.results-info {
  font-weight: 600;
  color: var(--header-color);
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sort-select {
  padding: 8px 15px;
  border: 1px solid var(--shadow-color);
  border-radius: 5px;
  font-size: 0.95rem;
}

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--font-color);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--sub-bg-color);
  border-top: 4px solid var(--header-color);
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
  background: var(--header-color);
  color: var(--main-bg-color);
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 15px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
}

.product-card {
  background: var(--sub-bg-color);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
  border: 1px solid var(--shadow-color);
  position: relative;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.item-type-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 1;
}

.item-type-badge.drink {
  background: #e3f2fd;
  color: #1976d2;
}

.item-type-badge.product {
  background: #fff3e0;
  color: #f57c00;
}

.product-image {
  height: 200px;
  overflow: hidden;
  background: var(--main-bg-color);
  display: block;
  text-decoration: none;
}

.product-link {
  text-decoration: none;
  color: inherit;
}

.product-link:hover .product-name {
  color: var(--header-color);
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
  background: var(--sub-bg-color);
  color: var(--font-color);
  font-size: 0.9rem;
}

.product-info {
  padding: 20px;
}

.product-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--header-color);
  line-height: 1.4;
}

.product-description {
  color: var(--font-color);
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
  color: var(--font-color);
}

.product-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
}

.rating-text {
  font-size: 0.85rem;
  color: var(--font-color);
}

.product-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-price {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--header-color);
  text-align: center;
}

.product-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.view-details-btn {
  flex: 1;
  background: transparent;
  color: var(--header-color);
  border: 2px solid var(--header-color);
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
  background: var(--header-color);
  color: var(--main-bg-color);
}

.add-to-cart-btn {
  flex: 1;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: background 0.3s;
}

.add-to-cart-btn.primary {
  background: var(--header-color);
  color: var(--main-bg-color);
}

.add-to-cart-btn.primary:hover:not(:disabled) {
  background: var(--hover-font-color);
}

.add-to-cart-btn.secondary {
  background: #2196f3;
  color: var(--main-bg-color);
}

.add-to-cart-btn.secondary:hover:not(:disabled) {
  background: #1976d2;
}

.add-to-cart-btn:hover:not(:disabled) {
  background: var(--hover-font-color);
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
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
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
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
}
</style>
