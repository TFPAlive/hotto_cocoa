<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const cups = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// Fetch cup products from database
async function fetchCupImages() {
    try {
        loading.value = true
        const response = await fetch('/api/user/products?category=mugs & cups')
        
        if (!response.ok) {
            throw new Error('Failed to fetch cup products')
        }
        
        const data = await response.json()
        
        if (Array.isArray(data)) {
            // Select 4-6 random cups from available products
            const availableCups = data.filter((p: any) => p.imageurl)
            cups.value = selectRandomCups(availableCups, Math.min(6, availableCups.length))
        }
    } catch (err) {
        console.error('Error fetching cup images:', err)
        error.value = 'Failed to load cup images'
        // Set fallback empty array
        cups.value = []
    } finally {
        loading.value = false
    }
}

// Select random cups for display
function selectRandomCups(cupArray: any[], count: number): any[] {
    const shuffled = [...cupArray].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
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
    <div class="design-section">
        <div class="instruction-box-red">Click a cup to start your drink roulette!</div>
        <div class="main-box-black">Making your own <br />Hotto Choco </div>
        
        <!-- Cup Gallery for Drink Roulette -->
        <div class="cups-gallery">
            <div v-if="loading" class="loading-state">
                <div class="spinner"></div>
                <p>Loading magical cups...</p>
            </div>
            
            <div v-else-if="error" class="error-state">
                <p>{{ error }}</p>
            </div>
            
            <div v-else class="cups-grid">
                <div 
                    v-for="cup in cups" 
                    :key="cup.productid"
                    class="cup-item"
                    @click="handleCupClick(cup)"
                    :title="`Click to create a drink with ${cup.name || 'this cup'}`"
                >
                    <div class="cup-image-container">
                        <img 
                            :src="cup.imageurl" 
                            :alt="cup.name || 'Cup'" 
                            class="cup-image"
                            loading="lazy"
                        />
                        <div class="cup-overlay">
                            <span class="cup-name">{{ cup.name || 'Mystery Cup' }}</span>
                            <span class="roulette-text">🎲 Try Me!</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="banner-video-container">
        <div class="container">
            <video class="banner-video" src="/banner.mp4" autoplay loop muted playsinline></video>
        </div>
    </div>
</template>
<style scoped>
    .design-section {
        position: relative;
        width: 100%;
        max-width: 500px;
        margin: 60px auto 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 1;
        transform: translateX(-90%) translateY(40%);
    }

    .main-box-black {
        background: var(--main-bg-color);
        color: var(--font-color);
        font-size: 2rem;
        font-weight: bold;
        padding: 48px 32px 32px 32px;
        border-radius: 18px;
        width: 100%;
        text-align: center;
        position: relative;
        z-index: 1;
        box-shadow: 0 4px 24px #0002;
    }

    .instruction-box-red {
        background: #e53935;
        color: var(--main-bg-color);
        font-size: 1.2rem;
        font-weight: bold;
        padding: 18px 32px;
        border-radius: 12px;
        width: 80%;
        text-align: center;
        position: absolute;
        top: -28px;
        left: 50%;
        transform: translateX(-50%) translateY(275%);
        z-index: 2;
        box-shadow: 0 2px 12px var(--shadow-color);
    }

    /* Cups Gallery Styles */
    .cups-gallery {
        margin-top: 40px;
        width: 100%;
        max-width: 600px;
    }

    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px 20px;
        color: var(--font-color);
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid var(--border-color);
        border-left: 4px solid #e53935;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .error-state {
        text-align: center;
        padding: 40px 20px;
        color: #e53935;
        background: var(--main-bg-color);
        border-radius: 12px;
        border: 2px solid #e53935;
    }

    .cups-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 20px;
        padding: 20px;
    }

    .cup-item {
        cursor: pointer;
        transition: all 0.3s ease;
        border-radius: 16px;
        overflow: hidden;
        background: var(--main-bg-color);
        box-shadow: 0 4px 12px var(--shadow-color);
    }

    .cup-item:hover {
        transform: translateY(-8px) scale(1.05);
        box-shadow: 0 8px 25px var(--shadow-color);
    }

    .cup-image-container {
        position: relative;
        width: 100%;
        height: 140px;
        overflow: hidden;
    }

    .cup-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
    }

    .cup-item:hover .cup-image {
        transform: scale(1.1);
    }

    .cup-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
        color: white;
        padding: 16px 12px 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .cup-item:hover .cup-overlay {
        opacity: 1;
    }

    .cup-name {
        font-weight: 600;
        font-size: 0.9rem;
        margin-bottom: 4px;
        text-align: center;
    }

    .roulette-text {
        font-size: 0.8rem;
        font-weight: 500;
        color: #ffd700;
    }

    .banner-video-container {
        width: 100%;
        height: 300px;
        position: relative;
        overflow: hidden;
        background: transparent;
    }

    .banner-video {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: -1;
        object-fit: cover;
        display: block;
        pointer-events: none;
        background-size: cover;
        background-position: center;
    }

    @media (max-width: 1024px) {
        .design-section {
            margin-top: 40px;
            transform: translateX(0%) translateY(20%);
        }
    }
</style>