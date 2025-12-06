<script setup lang="ts">
import IconEmpty from '../icons/IconEmpty.vue'
import { ref, onMounted, computed } from 'vue'
import { formatPrice } from '@/utils/currency'
import { auth } from '@/composables/useAuth'

// Define the sections to display
const sections = [
    { title: 'Your current design', buttonLabel: 'Design More', link: '/design', type: 'drinks' },
    { title: 'Recommend from your browser', buttonLabel: 'Shop All', link: '/store', type: 'products' },
    { title: 'Popular drinks', buttonLabel: 'See All Drinks', link: '/store', type: 'drinks' },
]

// Data storage
const userDrinks = ref<any[]>([])
const products = ref<any[]>([])
const popularDrinks = ref<any[]>([])
const loading = ref(true)

// Dragging state
const isDragging = ref(false)
const startX = ref(0)
const scrollLeft = ref(0)
const activeSection = ref<number | null>(null)

// Computed data for each section
const sectionData = computed(() => [
    userDrinks.value.slice(0, 10),
    products.value.slice(0, 10),
    popularDrinks.value.slice(0, 10)
])

function startDrag(event: MouseEvent, sectionIdx: number) {
    isDragging.value = true
    activeSection.value = sectionIdx
    const row = (event.currentTarget as HTMLElement)
    startX.value = event.pageX - row.offsetLeft
    scrollLeft.value = row.scrollLeft
    row.style.cursor = 'grabbing'
}

function drag(event: MouseEvent) {
    if (!isDragging.value || activeSection.value === null) return
    event.preventDefault()
    const row = event.currentTarget as HTMLElement
    const x = event.pageX - row.offsetLeft
    const walk = (x - startX.value) * 2
    row.scrollLeft = scrollLeft.value - walk
}

function endDrag(event: MouseEvent) {
    isDragging.value = false
    activeSection.value = null
    const row = event.currentTarget as HTMLElement
    row.style.cursor = 'grab'
}

// Fetch user's drinks
async function fetchUserDrinks() {
    if (!auth.isLoggedIn) return []
    
    try {
        const response = await fetch(`/api/user/products?action=drinks&userid=${auth.user?.userid}`)
        if (!response.ok) return []
        const drinks = await response.json()
        return drinks.slice(0, 10) // Limit to 10 items
    } catch (error) {
        console.error('Error fetching user drinks:', error)
        return []
    }
}

// Fetch recommended products
async function fetchProducts() {
    try {
        const response = await fetch('/api/user/products?sortBy=featured')
        if (!response.ok) return []
        const data = await response.json()
        return data.slice(0, 10) // Limit to 10 items
    } catch (error) {
        console.error('Error fetching products:', error)
        return []
    }
}

// Fetch popular drinks
async function fetchPopularDrinks() {
    try {
        const response = await fetch('/api/user/products?action=drinks&sortBy=featured')
        if (!response.ok) return []
        const drinks = await response.json()
        return drinks.slice(0, 10) // Limit to 10 items
    } catch (error) {
        console.error('Error fetching popular drinks:', error)
        return []
    }
}

onMounted(async () => {
    loading.value = true
    try {
        const [userDrinksData, productsData, popularDrinksData] = await Promise.all([
            fetchUserDrinks(),
            fetchProducts(),
            fetchPopularDrinks()
        ])
        
        userDrinks.value = userDrinksData
        products.value = productsData
        popularDrinks.value = popularDrinksData
    } catch (error) {
        console.error('Error loading data:', error)
    } finally {
        loading.value = false
    }
})
</script>
<template>
    <div class="product-holder-wrapper">
        <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading recommendations...</p>
        </div>

        <div v-else v-for="(section, idx) in sections" :key="section.title" class="product-section">
            <div class="section-header">
                <span class="section-title">{{ section.title }}</span>
                <router-link :to="section.link" class="section-btn">{{ section.buttonLabel }}</router-link>
            </div>
            
            <div class="products-row-wrapper">
                <div 
                    class="products-row" 
                    @mousedown="(e) => startDrag(e, idx)"
                    @mousemove="drag"
                    @mouseup="endDrag"
                    @mouseleave="endDrag"
                >
                    <!-- Show actual items if available -->
                    <div 
                        v-if="sectionData[idx].length > 0"
                        v-for="item in sectionData[idx]" 
                        :key="`${section.type}-${item.productid || item.drinkid}`" 
                        class="product-slot"
                    >
                        <div class="product-card">
                            <!-- Item Type Badge -->
                            <div class="item-type-badge" :class="section.type === 'drinks' ? 'drink' : 'product'">
                                {{ section.type === 'drinks' ? '🍹' : '🛒' }}
                            </div>
                            
                            <!-- Product Image -->
                            <router-link 
                                :to="section.type === 'drinks' ? `/drinks/${item.drinkid}` : `/products/${item.productid}`"
                                class="product-image"
                                draggable="false"
                            >
                                <img 
                                    v-if="item.imageurl" 
                                    :src="item.imageurl" 
                                    :alt="item.name || item.drinkname"
                                    class="product-img"
                                    draggable="false"
                                />
                                <div v-else class="product-placeholder">
                                    {{ section.type === 'drinks' ? '🍹' : '📦' }}
                                </div>
                            </router-link>
                            
                            <!-- Product Info -->
                            <div class="product-info">
                                <h4 class="product-name">{{ item.name || item.drinkname }}</h4>
                                <p class="product-price">{{ formatPrice(item.price || item.baseprice || 0) }}</p>
                                <div class="product-actions">
                                    <router-link 
                                        :to="section.type === 'drinks' ? `/drinks/${item.drinkid}` : `/products/${item.productid}`"
                                        class="view-btn"
                                        draggable="false"
                                    >
                                        View
                                    </router-link>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Show empty slots if no items -->
                    <div v-else v-for="i in 10" :key="`empty-${i}`" class="product-slot">
                        <div class="product-card empty-card">
                            <div class="icon-empty-wrap">
                                <svg viewBox="0 0 32 32" width="48" height="48">
                                    <IconEmpty />
                                </svg>
                                <div class="empty-text">
                                    {{ section.title === 'Your current design' && !auth.isLoggedIn 
                                        ? 'Sign in to see your designs' 
                                        : `No ${section.type} available right now.` }}
                                </div>
                            </div>
                        </div>
                    </div>
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

    .loading-state {
        text-align: center;
        padding: 60px 20px;
        color: var(--header-color);
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

    .product-section {
        margin: 0 auto;
        max-width: 95%;
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
        box-shadow: 0 2px 8px var(--shadow-color);
        transition: background 0.2s, color 0.2s;
        text-decoration: none;
    }

    .section-btn:hover {
        background: var(--hover-color);
        color: var(--hover-font-color);
    }

    .products-row-wrapper {
        width: 95%;
        margin: 0 auto;
        overflow: hidden;
    }

    .products-row {
        display: flex;
        gap: 24px;
        width: 100%;
        overflow-x: auto;
        scrollbar-width: none;
        cursor: grab;
        user-select: none;
        padding: 10px 0;
    }

    .products-row::-webkit-scrollbar {
        display: none;
    }

    .products-row:active {
        cursor: grabbing;
    }

    .product-slot {
        flex: 0 0 200px;
        width: 200px;
        min-width: 200px;
        max-width: 200px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
    }

    .product-card {
        width: 100%;
        height: 220px;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s, box-shadow 0.2s;
        position: relative;
        display: flex;
        flex-direction: column;
    }

    .product-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
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
        background: var(--sub-bg-color);
        color: var(--header-color);
    }

    .item-type-badge.product {
        background: var(--hover-color);
        color: var(--font-color);
    }

    .product-image {
        display: block;
        width: 100%;
        height: 120px;
        overflow: hidden;
        text-decoration: none;
    }

    .product-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .product-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--sub-bg-color);
        color: var(--font-color);
        font-size: 2rem;
    }

    .product-info {
        padding: 12px;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    .product-name {
        margin: 0 0 6px 0;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--header-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .product-price {
        margin: 0 0 8px 0;
        color: var(--button-color);
        font-weight: bold;
        font-size: 0.85rem;
    }

    .product-actions {
        display: flex;
        justify-content: center;
    }

    .view-btn {
        background: var(--button-color);
        color: var(--header-color);
        border: none;
        border-radius: 15px;
        padding: 4px 12px;
        font-size: 0.8rem;
        cursor: pointer;
        text-decoration: none;
        transition: background 0.2s;
    }

    .view-btn:hover {
        background: var(--hover-color);
        color: var(--hover-font-color);
    }

    .icon-empty-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    }

    .empty-card {
        background: var(--main-bg-color);
        border: 2px dashed var(--button-color);
    }

    .empty-text {
        margin-top: 10px;
        font-size: 0.85rem;
        color: var(--hover-font-color);
        text-align: center;
        line-height: 1.3;
    }

    @media (max-width: 1024px) {
        .product-holder-wrapper {
            padding: 24px 0;
            max-width: 100%;
        }

        .product-section {
            padding: 18px 8px 16px 8px;
        }

        .products-row-wrapper {
            width: 95%;
        }

        .products-row {
            gap: 10px;
        }

        .product-slot {
            flex: 0 0 140px;
            width: 140px;
            min-width: 140px;
            max-width: 140px;
        }

        .product-card {
            height: 200px;
        }

        .product-image {
            height: 100px;
        }

        .product-name {
            font-size: 0.8rem;
        }

        .product-price {
            font-size: 0.75rem;
        }
    }
</style>