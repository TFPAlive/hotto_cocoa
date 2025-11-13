<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const cupImages = ref<Array<{productid: number, name: string, imageurl: string}>>([])
const selectedCups = ref<Array<{productid: number, name: string, imageurl: string}>>([])
const loading = ref(false)

async function fetchCupImages() {
    loading.value = true
    try {
        const response = await fetch('/api/user/products?category=Mugs & Cups')
        if (!response.ok) throw new Error('Failed to fetch products')
        
        const products = await response.json()
        // Filter products that have images
        cupImages.value = products.filter((product: any) => product.imageurl && product.imageurl.trim())
        
        // Select 5 random cups
        selectRandomCups()
    } catch (error) {
        console.error('Error fetching cup images:', error)
        // Fallback to empty array if fetch fails
        cupImages.value = []
        selectedCups.value = []
    } finally {
        loading.value = false
    }
}

function selectRandomCups() {
    if (cupImages.value.length === 0) return
    
    const shuffled = [...cupImages.value].sort(() => Math.random() - 0.5)
    selectedCups.value = shuffled.slice(0, Math.min(5, shuffled.length))
}

// Get random drink recipe for a specific cup
async function getRandomDrinkForCup(cupId: number) {
    try {
        const response = await fetch(`/api/user/products?action=random-drink&cupId=${cupId}`)
        if (!response.ok) {
            throw new Error('Failed to fetch random drink')
        }
        return await response.json()
    } catch (err) {
        console.error('Error fetching random drink:', err)
        // Return basic fallback drink structure
        return {
            drinkid: null,
            products: [{ productid: cupId, category: 'mugs & cups' }]
        }
    }
}

// Handle cup click - implement drink roulette
async function handleCupClick(cupProduct: any) {
    try {
        // Get a random drink recipe that uses this cup
        const randomDrink = await getRandomDrinkForCup(cupProduct.productid)
        
        // Navigate to design corner with pre-populated data
        await router.push({
            path: '/design',
            hash: '#design-corner',
            query: {
                roulette: 'true',
                cupId: cupProduct.productid.toString(),
                drinkId: randomDrink.drinkid ? randomDrink.drinkid.toString() : '',
                drinkName: randomDrink.drinkname || `${cupProduct.name || 'Custom'} Special`,
                products: randomDrink.products ? JSON.stringify(randomDrink.products) : JSON.stringify([{ productid: cupProduct.productid, category: 'mugs & cups' }])
            }
        })
    } catch (err) {
        console.error('Error handling cup click:', err)
        // Fallback: just navigate to design corner with the cup
        await router.push({
            path: '/design',
            hash: '#design-corner',
            query: {
                roulette: 'true',
                cupId: cupProduct.productid.toString(),
                drinkName: `${cupProduct.name || 'Custom'} Special`
            }
        })
    }
}

onMounted(() => {
    fetchCupImages()
})
</script>
<template>
    <div class="welcome-container">
        <div class="welcome-left">
            <div class="welcome-title">Self-design bar</div>
            <div class="cup-icons">
                <!-- Loading state -->
                <div v-if="loading" class="loading-cups">
                    <div v-for="n in 5" :key="n" class="cup-placeholder"></div>
                </div>
                
                <!-- Actual cup images -->
                <div v-else-if="selectedCups.length > 0" class="cup-images">
                    <div 
                        v-for="cup in selectedCups" 
                        :key="cup.productid" 
                        class="cup-item"
                        :title="`${cup.name} - Click for drink roulette!`"
                        @click="handleCupClick(cup)"
                    >
                        <img :src="cup.imageurl" :alt="cup.name" class="cup-image" />
                        <div class="cup-roulette-overlay">
                            <span class="roulette-icon">🎲</span>
                        </div>
                    </div>
                </div>
                
                <!-- Fallback SVG icons if no images available -->
                <div v-else class="cup-svg-fallback">
                    <svg v-for="n in 5" :key="n" width="36" height="36" viewBox="0 0 24 24" fill="var(--hover-color)" xmlns="http://www.w3.org/2000/svg" class="cup-icon">
                        <rect x="7" y="8" width="10" height="10" rx="3" />
                        <rect x="9" y="4" width="6" height="4" rx="2" />
                        <rect x="10" y="18" width="4" height="2" rx="1" />
                    </svg>
                </div>
            </div>
        </div>
        <div class="welcome-right">
            <div class="welcome-desc"> Welcome to Hotto Choco, where we design our own chocolate cups to enjoy during your cozy holiday. Cocoa, coffee, matcha, anything. Whirl it up in your style! </div>
            <router-link to="/design" class="design-btn">Design Now</router-link>
        </div>
    </div>
</template>
<style scoped>
    .welcome-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 40px;
        padding: 40px 25px;
        margin: 0 auto;
        background-color: var(--main-bg-color);
    }

    .welcome-left {
        max-width: 500px;
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .welcome-title {
        font-size: 4rem;
        font-weight: bold;
        margin-bottom: 24px;
        color: var(--header-color);
    }

    .cup-icons {
        display: flex;
        gap: 12px;
        justify-content: center;
        align-items: center;
    }

    .cup-images, .cup-svg-fallback, .loading-cups {
        display: flex;
        gap: 12px;
        justify-content: center;
        align-items: center;
    }

    .cup-item {
        position: relative;
        cursor: pointer;
        transition: transform 0.2s ease;
    }

    .cup-item:hover {
        transform: translateY(-2px) scale(1.05);
    }

    .cup-image {
        width: 48px;
        height: 48px;
        object-fit: cover;
        border-radius: 8px;
        box-shadow: 0 2px 8px var(--shadow-color);
        transition: box-shadow 0.2s ease;
    }

    .cup-image:hover {
        box-shadow: 0 4px 12px var(--shadow-color);
    }

    .cup-roulette-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(229, 57, 53, 0.85);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .cup-item:hover .cup-roulette-overlay {
        opacity: 1;
    }

    .roulette-icon {
        font-size: 1.2rem;
        color: white;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    }

    .cup-placeholder {
        width: 48px;
        height: 48px;
        background: var(--sub-bg-color);
        border-radius: 8px;
        animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
        0%, 100% {
            opacity: 0.7;
        }
        50% {
            opacity: 1;
        }
    }

    .cup-icon {
        filter: drop-shadow(0 2px 4px var(--shadow-color));
    }

    .welcome-right {
        max-width: 500px;
        flex: 2;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 24px;
    }

    .welcome-desc {
        font-size: 1.1rem;
        color: var(--font-color);
        line-height: 1.6;
    }

    .design-btn {
        display: inline-block;
        background: var(--button-color);
        color: var(--header-color);
        font-weight: bold;
        padding: 12px 32px;
        border-radius: 24px;
        text-decoration: none;
        font-size: 1.1rem;
        box-shadow: 0 2px 8px var(--shadow-color);
        transition: background 0.2s, color 0.2s;
    }

    .design-btn:hover {
        background: var(--hover-color);
        color: var(--hover-font-color);
    }

    @media (max-width: 1024px) {
        .welcome-title {
            font-size: 2rem;
        }

        .welcome-container {
            flex-direction: column;
            gap: 24px;
            padding: 24px 0;
        }

        .welcome-left, .welcome-right {
            align-items: center;
            text-align: center;
        }

        .welcome-right {
            align-items: center;
        }
    }
</style>