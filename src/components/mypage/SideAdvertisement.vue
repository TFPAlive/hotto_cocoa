<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const featuredDrink = ref<any>(null)
const loading = ref(true)

// Format price helper
function formatPrice(price: number): string {
    if (!price) return '$0.00'
    return `$${price.toFixed(2)}`
}

// Fetch a random featured drink
async function fetchFeaturedDrink() {
    try {
        const response = await fetch('/api/user/products?action=drinks&sortBy=recent')
        if (!response.ok) throw new Error('Failed to fetch drinks')
        
        const drinks = await response.json()
        if (Array.isArray(drinks) && drinks.length > 0) {
            // Select a random drink from the first 10
            const featuredDrinks = drinks.slice(0, 10)
            featuredDrink.value = featuredDrinks[Math.floor(Math.random() * featuredDrinks.length)]
        }
    } catch (error) {
        console.error('Error fetching featured drink:', error)
    } finally {
        loading.value = false
    }
}

function navigateToDesign() {
    router.push('/design')
}

function navigateToDrink() {
    if (featuredDrink.value?.drinkid) {
        router.push(`/drinks/${featuredDrink.value.drinkid}`)
    }
}

onMounted(() => {
    fetchFeaturedDrink()
})
</script>

<template>
    <div class="container">
        <!-- Featured Drink Ad -->
        <div v-if="!loading && featuredDrink" class="card featured-drink" @click="navigateToDrink">
            <div class="badge">Featured</div>
            <div class="image-container">
                <img 
                    v-if="featuredDrink.imageurl" 
                    :src="featuredDrink.imageurl" 
                    :alt="featuredDrink.drinkname || 'Featured Drink'" 
                    class="image"
                />
                <div v-else class="placeholder">
                    <span>🍫</span>
                </div>
            </div>
            <div class="content">
                <h3 class="title">{{ featuredDrink.drinkname || 'Mystery Drink' }}</h3>
                <p class="description">{{ featuredDrink.description || 'Try this delicious creation!' }}</p>
                <div class="price">{{ formatPrice(featuredDrink.price) }}</div>
                <button class="button">View Details</button>
            </div>
        </div>

        <!-- Create Your Own Ad -->
        <div class="card create-own" @click="navigateToDesign">
            <div class="icon">🎨</div>
            <h3 class="title">Create Your Own</h3>
            <p class="description">Design a custom drink with your favorite ingredients!</p>
            <button class="button-secondary">Start Designing</button>
        </div>

        <!-- Special Offer Ad -->
        <div class="card special-offer">
            <div class="badge special">Limited Time</div>
            <div class="icon-large">🎁</div>
            <h3 class="title">Holiday Special</h3>
            <p class="description">Get 20% off on seasonal drinks this week!</p>
            <div class="code">Code: HOLIDAY20</div>
        </div>

        <!-- Roulette Promo -->
        <div class="card roulette-promo" @click="router.push('/')">
            <div class="icon-large">🎲</div>
            <h3 class="title">Try Drink Roulette!</h3>
            <p class="description">Click a cup and let fate decide your perfect drink.</p>
            <button class="button-accent">Try Now</button>
        </div>
    </div>
</template>

<style scoped>
.container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
}

.card {
    background: var(--main-bg-color);
    border: 2px solid var(--border-color);
    border-radius: 12px;
    padding: 20px;
    transition: all 0.3s ease;
    cursor: pointer;
    box-shadow: 0 2px 8px var(--shadow-color);
    position: relative;
    overflow: hidden;
}

.card:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 20px var(--shadow-color);
    border-color: var(--hover-color);
}

.badge {
    position: absolute;
    top: 12px;
    right: 12px;
    background: var(--hover-color);
    color: white;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    z-index: 1;
}

.badge.special {
    background: #e53935;
    animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
}

.image-container {
    width: 100%;
    height: 160px;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 16px;
    background: var(--sub-bg-color);
}

.image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.card:hover .image {
    transform: scale(1.1);
}

.placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 4rem;
    background: linear-gradient(135deg, var(--sub-bg-color), var(--border-color));
}

.content {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.title {
    color: var(--header-color);
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0;
    line-height: 1.3;
}

.description {
    color: var(--font-color);
    font-size: 0.9rem;
    line-height: 1.4;
    margin: 0;
}

.price {
    color: var(--hover-color);
    font-size: 1.5rem;
    font-weight: 700;
    margin: 8px 0;
}

.button {
    background: var(--button-color);
    color: var(--header-color);
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.95rem;
}

.button:hover {
    background: var(--hover-color);
    color: var(--hover-font-color);
    transform: scale(1.02);
}

.button-secondary {
    background: transparent;
    color: var(--hover-color);
    border: 2px solid var(--hover-color);
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.95rem;
}

.button-secondary:hover {
    background: var(--hover-color);
    color: white;
}

.button-accent {
    background: #e53935;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.95rem;
}

.button-accent:hover {
    background: #c62828;
    transform: scale(1.02);
}

.icon {
    font-size: 2.5rem;
    margin-bottom: 12px;
    display: block;
}

.icon-large {
    font-size: 3.5rem;
    margin: 16px 0;
    display: block;
    text-align: center;
}

.code {
    background: var(--sub-bg-color);
    color: var(--header-color);
    padding: 8px 16px;
    border-radius: 6px;
    font-family: 'Courier New', monospace;
    font-weight: 700;
    text-align: center;
    margin-top: 8px;
    border: 2px dashed var(--border-color);
}

/* Specific card styles */
.featured-drink {
    background: linear-gradient(135deg, var(--main-bg-color), var(--sub-bg-color));
}

.create-own {
    text-align: center;
    background: var(--main-bg-color);
}

.special-offer {
    text-align: center;
    background: linear-gradient(135deg, #fff3e0, var(--main-bg-color));
}

.roulette-promo {
    text-align: center;
    background: linear-gradient(135deg, var(--main-bg-color), #f3e5f5);
}

/* Responsive adjustments */
@media (max-width: 1024px) {
    .container {
        flex-direction: row;
        flex-wrap: wrap;
    }

    .card {
        flex: 1 1 calc(50% - 10px);
        min-width: 250px;
    }
}

@media (max-width: 768px) {
    .container {
        flex-direction: column;
    }

    .card {
        flex: 1 1 100%;
    }
}
</style>
