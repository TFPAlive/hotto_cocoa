<script setup lang="ts">
    import LeftPointIcon from '../icons/IconPointLeft.vue'
    import RightPointIcon from '../icons/IconPointRight.vue'
    import StarRating from './StarRating.vue'
    import { ref, onMounted, nextTick, watch } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import { useProducts } from '@/composables/useProducts'
    import { auth } from '@/composables/useAuth'
    import { formatPrice } from '@/utils/currency'
    import { useMyCart } from '@/composables/useMyCart'

    const { products } = useProducts()
    const { fetchCartItems } = useMyCart()
    const route = useRoute()
    const router = useRouter()
    const sweetness = ref(3)
    const calories = ref(2)
    const categories = ref(['Mugs & Cups', 'Drink bases', 'Choco bombs', 'Dipped cookies', 'Top-cream', 'Marshmallows', 'Sprinkles', 'Spoons & Candy canes', 'Straws', 'Coasters', 'Packing styles'])
    const selectedCategory = ref(categories.value[0])
    const categoryButtonsRef = ref < HTMLElement | null > (null)
    const selectedProducts = ref(categories.value.reduce((acc: Record < string, any > , cat) => {
        acc[cat.toLowerCase()] = null
        return acc
    }, {}))
    const showTooltip = ref(false)
    const tooltipPosition = ref({ x: 0, y: 0 })
    const showDTooltip = ref(false)
    const hoveredProduct = ref < any > (null)
    const isDragging = ref(false)
    const startX = ref(0)
    const scrollLeft = ref(0)
    const canScrollLeft = ref(false)
    const canScrollRight = ref(false)
    const drinkName = ref('Your Custom Drink')
    const shippingCost = ref(500) // Fixed shipping cost
    
    // Drink roulette handling
    async function handleRouletteData() {
        const query = route.query
        
        if (query.roulette === 'true') {
            // Clear existing selections first
            resetSelections()
            
            try {
                // Set drink name if provided
                if (query.drinkName) {
                    drinkName.value = query.drinkName as string
                }
                
                // Parse and apply pre-selected products
                if (query.products) {
                    const productList = JSON.parse(query.products as string)
                    
                    // Fetch full product details for each product
                    for (const prodInfo of productList) {
                        await applyRouletteProduct(prodInfo.productid, prodInfo.category)
                    }
                } else if (query.cupId) {
                    // Just apply the cup if no full product list
                    await applyRouletteProduct(parseInt(query.cupId as string), 'mugs & cups')
                }
                
                // Set random sweetness and calories for the roulette experience
                sweetness.value = Math.floor(Math.random() * 5) + 1
                calories.value = Math.floor(Math.random() * 5) + 1
                
                console.log('Applied drink roulette selections')
            } catch (error) {
                console.error('Error applying roulette data:', error)
            }
        }
    }
    
    // Apply a specific product from roulette selection
    async function applyRouletteProduct(productId: number, category: string) {
        try {
            // Find the product in the loaded products
            const foundProduct = products.value.find(p => p.productid === productId)
            
            if (foundProduct) {
                selectedProducts.value[category.toLowerCase()] = foundProduct
                console.log(`Applied ${category} product:`, foundProduct.name)
            } else {
                // If product not found in current products, fetch it specifically
                const response = await fetch(`/api/user/products?productid=${productId}`)
                if (response.ok) {
                    const data = await response.json()
                    if (data.product) {
                        selectedProducts.value[category.toLowerCase()] = data.product
                        console.log(`Fetched and applied ${category} product:`, data.product.name)
                    }
                }
            }
        } catch (error) {
            console.error(`Error applying ${category} product:`, error)
        }
    }

    function scrollCategoryLeft() {
        if (categoryButtonsRef.value) {
            categoryButtonsRef.value.scrollBy({
                left: -200,
                behavior: 'smooth'
            })
            setTimeout(updateScrollButtons, 300) // Wait for scroll animation to complete
        }
    }
    function scrollCategoryRight() {
        if (categoryButtonsRef.value) {
            categoryButtonsRef.value.scrollBy({
                left: 200,
                behavior: 'smooth'
            })
            setTimeout(updateScrollButtons, 300) // Wait for scroll animation to complete
        }
    }
    function selectProduct(product: {
        category ? : string;productid ? : any;imageurl ? : string
    }) {
        if (product.category) {
            selectedProducts.value[product.category.toLowerCase()] = product
        }
    }
    // Inlined createDrink + addToCart logic (previously useCreateDrink + useAddCart)
    const creating = ref(false)
    const createError = ref<string | null>(null)
    const drinkid = ref<number | null>(null)

    async function createDrink() {
        creating.value = true
        createError.value = null
        try {
            const products = Object.values(selectedProducts.value)
                .filter((p): p is any => !!p)
                .map(p => ({ productid: p.productid, quantity: 1 }))

            let uniqueid = ''
            for (const p of products) uniqueid += String(p.productid).padStart(4, '0')

            // Find the cup/mug image to use as the drink image
            const cupProduct = selectedProducts.value['mugs & cups']
            const drinkImageUrl = cupProduct?.imageurl || null

            const res = await fetch('/api/user/products?action=create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    drinkname: drinkName.value, 
                    products, 
                    price: Object.values(selectedProducts.value).reduce((sum, prod) => sum + (prod?.price || 0), 0), 
                    userid: auth.user?.userid, 
                    uniqueid,
                    imageurl: drinkImageUrl
                }),
            })

            if (!res.ok) {
                const errorData = await res.json()
                
                // Handle unauthorized error - redirect to login with return path
                if (errorData.error === 'Unauthorized: valid userid required') {
                    // Build return URL with all current selections
                    const returnParams = new URLSearchParams({
                        roulette: 'true',
                        drinkName: drinkName.value,
                        products: JSON.stringify(products)
                    })
                    
                    // Navigate to login with return path
                    await router.push(`/auth/login?returnTo=/design%23design-corner&${returnParams.toString()}`)
                    return
                }
                
                // Handle drink name validation error
                if (errorData.error === 'Drink name is required and must be a string') {
                    createError.value = 'Please enter a valid drink name'
                    return
                }
                
                throw new Error(errorData.error || 'Failed to create drink')
            }

            const output = await res.json()
            drinkid.value = output.drink?.drinkid || null
        } catch (err: any) {
            if (!createError.value) {
                createError.value = err.message || 'Failed to create drink'
            }
            console.error(err)
        } finally {
            creating.value = false
        }
    }

    const adding = ref(false)
    const addError = ref<string | null>(null)

    async function addToCart() {
        // ensure drink exists
        await createDrink()
        if (createError.value || !drinkid.value) return

        adding.value = true
        addError.value = null
        try {
            const res = await fetch('/api/user/cart?action=add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ drinkid: drinkid.value, userid: auth.user?.userid }),
            })
            if (!res.ok) throw new Error('Failed to add to cart')
            
            // Refresh cart items to update CartMenu
            await fetchCartItems()
        } catch (err: any) {
            addError.value = err.message || 'Unknown error'
            console.error('Failed to add to cart:', addError.value)
        } finally {
            adding.value = false
        }
    }
    // legacy wrapper removed; createDrink is implemented above (inlined)
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
        selectedProducts.value = categories.value.reduce((acc: Record < string, any > , cat) => {
            acc[cat.toLowerCase()] = null
            return acc
        }, {})
        drinkName.value = 'Your Custom Drink'
        sweetness.value = 0
        calories.value = 0
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
    
    function selectDrinkNameText(event: Event) {
        const input = event.target as HTMLInputElement
        if (input) {
            input.select()
        }
    }
    
    function updateScrollButtons() {
        if (!categoryButtonsRef.value) return
        const element = categoryButtonsRef.value
        canScrollLeft.value = element.scrollLeft > 0
        canScrollRight.value = element.scrollLeft < (element.scrollWidth - element.clientWidth)
    }

    // Watch for route changes to handle roulette data
    watch(() => route.query, (newQuery) => {
        if (newQuery.roulette === 'true') {
            handleRouletteData()
        }
    }, { immediate: true })

    onMounted(() => {
        nextTick(() => {
            updateScrollButtons()
            // Handle roulette data if present on initial load
            if (route.query.roulette === 'true') {
                handleRouletteData()
            }
        })
    })
</script>
<template>
    <div id="design-corner" class="design-corner-layout">
        <div class="design-corner-holder">
            <div class="design-corner-left">
                <div class="cup-image-placeholder" @mouseenter="showChoiceTooltip" @mouseleave="hideChoiceTooltip" @mousemove="updateTooltipPosition">
                    <img v-if="selectedProducts[selectedCategory.toLowerCase()] && selectedProducts[selectedCategory.toLowerCase()].imageurl" :src="selectedProducts[selectedCategory.toLowerCase()].imageurl" :alt="selectedProducts[selectedCategory.toLowerCase()].name || 'Product Image'" class="preview-image" />
                    <div v-else class="placeholder-text">
                        <!-- Cup image goes here -->
                    </div>
                </div>
                <div class="drink-name-holder">
                    <input 
                        v-model="drinkName" 
                        type="text" 
                        class="drink-name-input" 
                        placeholder="Enter drink name..." 
                        maxlength="50" 
                        @click="selectDrinkNameText"
                        @focus="selectDrinkNameText"
                    />
                    <div v-if="createError" class="error-message">{{ createError }}</div>
                </div>
                <div class="button-holder">
                    <button class="create-drink" @click="createDrink">Create Drink</button>
                    <button class="add-to-cart-btn" @click="addToCart">Add to Cart</button>
                    <button class="reset-btn" @click="resetSelections">Reset</button>
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
                    <div class="price-row">
                        <h3>Drink Price</h3>
                        <p>
                            {{
                              formatPrice(Object.values(selectedProducts).reduce((sum, prod) => {
                                return sum + (prod?.price || 0)
                              }, 0))
                            }}
                        </p>
                    </div>
                    <div class="price-row">
                        <h3>Shipping Cost</h3>
                        <p>{{ formatPrice(shippingCost) }}</p>
                    </div>
                    <div class="price-row total">
                        <h2>Total Price</h2>
                        <p>
                            {{
                              formatPrice(Object.values(selectedProducts).reduce((sum, prod) => {
                                return sum + (prod?.price || 0)
                              }, 0) + shippingCost)
                            }}
                        </p>
                    </div>
                </div>
            </div>
            <div class="design-corner-right">
                <div class="category">
                    <div class="left-button" @click="scrollCategoryLeft" v-show="canScrollLeft">
                        <LeftPointIcon />
                    </div>
                    <div class="category-buttons" ref="categoryButtonsRef" @mousedown="startDrag" @mousemove="drag" @mouseup="endDrag" @mouseleave="endDrag" @scroll="updateScrollButtons">
                        <button v-for="cat in categories" :key="cat" :class="{ active: selectedCategory === cat }" @click="selectedCategory = cat">
                            {{ cat }}
                        </button>
                    </div>
                    <div class="right-button" @click="scrollCategoryRight" v-show="canScrollRight">
                        <RightPointIcon />
                    </div>
                </div>
                <div class="options-placeholder">
                    <div v-for="cat in categories" :key="cat" v-show="selectedCategory === cat">
                        <div class="image-list">
                            <div class="image-cell" v-for="product in products.filter(p => p.category && p.category.toLowerCase() === cat.toLowerCase())" :key="product.productid" :class="{ selected: selectedProducts[cat.toLowerCase()]?.productid === product.productid }" @click="selectProduct(product)" @mouseenter="(event) => showDetailsTooltip(event, product)" @mouseleave="hideDetailsTooltip">
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
                                    <span class="price">Price: {{ formatPrice(hoveredProduct.price || 0) }}</span>
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
                        <td v-if="product">{{ formatPrice(product.price || 0) }}</td>
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
        width: 50%;
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .cup-image-placeholder {
        width: 100%;
        aspect-ratio: 1 / 1;
        margin-bottom: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        transition: all 0.3s ease;
    }

    .preview-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .placeholder-text {
        color: var(--main-bg-color);
        font-size: 1.2rem;
        font-weight: bold;
        text-align: center;
    }

    .drink-name-holder {
        width: 100%;
        margin-bottom: 24px;
    }

    .drink-name-input {
        width: 100%;
        background: transparent;
        border: none;
        border-bottom: 2px solid var(--header-color);
        color: var(--hover-color);
        font-size: 1.5rem;
        font-weight: bold;
        text-align: center;
        padding: 8px 0;
        outline: none;
        transition: border-color 0.2s, color 0.2s;
    }

    .drink-name-input:focus {
        border-bottom-color: var(--hover-color);
        color: var(--hover-font-color);
    }

    .drink-name-input::placeholder {
        color: var(--font-color);
        font-weight: normal;
    }

    .error-message {
        color: #ff4444;
        font-size: 0.9rem;
        margin-top: 8px;
        text-align: center;
        font-weight: 500;
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
        color: var(--hover-color);
        font-size: 1.1rem;
    }

    .design-corner-right {
        width: 50%;
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
        background: var(--main-bg-color);
        color: var(--font-color);
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
        background: var(--header-color);
        color: var(--main-bg-color);
    }

    .category-buttons button:hover {
        background: var(--hover-font-color);
    }

    .product-list {
        background: var(--sub-bg-color);
        border-radius: 12px;
        min-height: 500px;
        padding: 24px;
        color: var(--main-bg-color);
        box-shadow: 0 1px 6px var(--shadow-color);
        overflow-y: auto;
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
        border: 2px solid var(--hover-color);
        border-radius: 12px;
    }

    .create-drink {
        background: var(--button-color);
        color: var(--header-color);
        border: none;
        border-radius: 6px;
        padding: 0.5rem 1.2rem;
        cursor: pointer;
        transition: background 0.2s;
    }

    .create-drink:hover {
        background: var(--hover-color);
        color: var(--hover-font-color);
    }

    .add-to-cart-btn {
        background: var(--button-color);
        color: var(--header-color);
        border: none;
        border-radius: 6px;
        padding: 0.5rem 1.2rem;
        cursor: pointer;
        transition: background 0.2s;
    }

    .add-to-cart-btn:hover {
        background: var(--hover-color);
        color: var(--hover-font-color);
    }

    .price {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 12px;
        border-top: 2px solid var(--border-color);
        padding-top: 20px;
        margin-top: 20px;
    }

    .price-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
    }

    .price-row h3 {
        margin: 0;
        font-size: 1.2rem;
        color: var(--font-color);
        font-weight: 500;
    }

    .price-row p {
        margin: 0;
        font-size: 1.3rem;
        font-weight: 600;
        color: var(--font-color);
    }

    .price-row.total {
        border-top: 2px solid var(--hover-color);
        padding-top: 12px;
        margin-top: 8px;
    }

    .price-row.total h2 {
        margin: 0;
        font-size: 1.6rem;
        color: var(--header-color);
    }

    .price-row.total p {
        font-size: 1.8rem;
        font-weight: bold;
        color: var(--hover-color);
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
        background: var(--font-color);
        border: 1px solid var(--header-color);
        border-radius: 8px;
        padding: 12px;
        z-index: 1000;
        box-shadow: 0 4px 12px var(--shadow-color);
        backdrop-filter: blur(4px);
        pointer-events: none;
    }

    .choice-tooltip table {
        border-collapse: collapse;
        color: var(--main-bg-color);
        font-size: 0.9rem;
    }

    .choice-tooltip th, .choice-tooltip td {
        padding: 6px 12px;
        text-align: left;
        border-bottom: 1px solid var(--font-color);
    }

    .choice-tooltip th {
        background: var(--header-color);
        font-weight: bold;
        color: var(--main-bg-color);
    }

    .choice-tooltip tr:last-child td {
        border-bottom: none;
    }

    /* Description tooltip styles */
    .description-tooltip {
        background: var(--font-color);
        border: 1px solid var(--header-color);
        border-radius: 8px;
        padding: 16px;
        margin-top: 16px;
        max-width: 100%;
        color: var(--main-bg-color);
        backdrop-filter: blur(2px);
    }

    .product-details h4 {
        margin: 0 0 8px 0;
        color: var(--hover-color);
        font-size: 1.1rem;
    }

    .product-description {
        margin: 0 0 12px 0;
        font-size: 0.9rem;
        line-height: 1.4;
        color: var(--main-bg-color);
    }

    .product-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .product-info span {
        font-size: 0.8rem;
        color: var(--sub-bg-color);
    }

    .product-info .price {
        color: var(--hover-color);
        font-weight: bold;
    }

    .reset-btn {
        background: var(--font-color);
        color: var(--main-bg-color);
        border: none;
        border-radius: 6px;
        padding: 0.5rem 1.2rem;
        cursor: pointer;
        transition: background 0.2s;
    }
</style>