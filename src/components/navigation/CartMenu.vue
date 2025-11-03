<script setup lang="ts">
    import CartIcon from '../icons/IconCart.vue'
    import CloseIcon from '../icons/IconClose.vue'
    import { useMyCart } from '@/composables/useMyCart'
    import { auth } from '@/composables/useAuth'
    import { formatPrice } from '@/utils/currency'
    import { ref, onMounted, computed } from 'vue'

    const { cartItems, totalPrice, fetchCartItems } = useMyCart()
    const drinkProducts = ref<any[]>([])
    const fetchDrinkProducts = async () => {
        try {
            const response = await fetch(`/api/user/products?action=drinkProducts`)
            if (!response.ok) throw new Error('Failed to fetch drink products')
            const data = await response.json()
            drinkProducts.value = data
            return data
        } catch (error) {
            console.error(error)
            return []
        }
    }
    const showCart = ref(false)
    const cartItemProducts = ref<Record<number, any[]>>({})
    const cartCount = computed(() =>
        cartItems.value.reduce((sum: number, item) => sum + item.quantity, 0)
    )

    function toggleCart() {
        showCart.value = !showCart.value
    }

    // Increment cart item quantity locally and persist via addCart endpoint
    async function incrementItem(item: any) {
        const previous = item.quantity
        // optimistic UI
        item.quantity = (item.quantity || 0) + 1
        try {
            const requestBody: any = { userid: auth.user?.userid }
            
            // Add appropriate ID based on item type
            if (item.item_type === 'drink' && item.drinkid) {
                requestBody.drinkid = item.drinkid
            } else if (item.item_type === 'product' && item.productid) {
                requestBody.productid = item.productid
                requestBody.quantity = 1 // Add one more
            }

            const res = await fetch('/api/user/cart?action=add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(requestBody),
            })
            if (!res.ok) throw new Error('Failed to increment cart item')
            // We don't re-fetch; back-end persisted. Optionally we could merge returned data.
        } catch (err) {
            // revert optimistic change
            item.quantity = previous
            console.error('Failed to increment cart item', err)
        }
    }

    // Decrement cart item quantity locally and persist via removeCartItem endpoint
    async function decrementItem(item: any) {
        const previous = item.quantity
        const cartitemid = item.cartitemid

        if (previous <= 1) {
            // optimistic remove from local list
            const idx = cartItems.value.findIndex((ci: any) => ci.cartitemid === cartitemid)
            let removed: any = null
            if (idx !== -1) removed = cartItems.value.splice(idx, 1)[0]
            try {
                    const res = await fetch('/api/user/cart?action=remove', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ cartitemid, userid: auth.user?.userid }),
                })
                if (!res.ok) throw new Error('Failed to remove cart item')
            } catch (err) {
                // revert removal
                if (removed) cartItems.value.splice(idx, 0, removed)
                console.error('Failed to remove cart item', err)
            }
        } else {
            // optimistic decrement
            item.quantity = previous - 1
            try {
                    const res = await fetch('/api/user/cart?action=remove', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ cartitemid, userid: auth.user?.userid }),
                })
                if (!res.ok) throw new Error('Failed to decrement cart item')
            } catch (err) {
                // revert optimistic change
                item.quantity = previous
                console.error('Failed to decrement cart item', err)
            }
        }
    }

    async function loadCartItemProducts() {
        // Only fetch drink-product mappings for drink items
        try {
            const drinkItems = cartItems.value.filter(item => item.item_type === 'drink' && item.drinkid)
            if (drinkItems.length === 0) return

            const allProducts = await fetchDrinkProducts()
            // allProducts expected to be an array with { drinkid, productid, ... }
            const map: Record<number, any[]> = {}
            for (const p of allProducts) {
                const id = Number(p.drinkid)
                if (!map[id]) map[id] = []
                map[id].push(p)
            }

            // Populate cartItemProducts for drink items that exist in the cart
            for (const item of drinkItems) {
                const id = Number(item.drinkid)
                cartItemProducts.value[id] = map[id] || []
            }
        } catch (err) {
            console.error('Failed to load drink products for cart items', err)
        }
    }

    onMounted(async () => { 
        await fetchCartItems()
        await loadCartItemProducts()
    })
</script>
<template>
    <div class="cart-container">
        <button class="icon-btn" aria-label="Cart" @click="toggleCart">
            <CartIcon />
        </button>
        <span v-if="cartCount >= 0" class="cart-badge">{{ cartCount }}</span>
        <transition name="cart-drawer">
            <div v-if="showCart" class="cart-drawer" @click.self="toggleCart">
                <div class="cart-drawer-content">
                    <div class="cart-drawer-header">
                        <span>Cart List</span>
                        <button class="close-btn" @click="toggleCart">
                            <CloseIcon />
                        </button>
                    </div>
                    <div class="cart-drawer-body">
                        <div v-if="cartItems.length === 0">Your cart is empty.</div>
                        <div v-else>
                            <div v-for="item in cartItems" :key="item.cartitemid" class="cart-item">
                                <!-- Item Type Badge -->
                                <div class="item-type-badge" :class="item.item_type">
                                    {{ item.item_type === 'drink' ? '🍹 Custom Drink' : '🛒 Product' }}
                                </div>
                                
                                <div class="item-header">
                                    <div class="image-cell">
                                        <img v-if="item.imageurl" :src="item.imageurl" alt="Product Image" />
                                        <div v-else class="image-placeholder">No Image</div>
                                    </div>
                                    <div class="item-info">
                                        <h3>{{ item.name }}</h3>
                                        <p class="item-price">{{ formatPrice(item.price) }}</p>
                                    </div>
                                </div>
                                
                                <div class="qty-control">
                                    <button class="qty-btn" @click="decrementItem(item)" aria-label="Decrease">−</button>
                                    <span class="qty-value">{{ item.quantity }}</span>
                                    <button class="qty-btn" @click="incrementItem(item)" aria-label="Increase">+</button>
                                </div>
                                
                                <!-- Show ingredients for drinks -->
                                <div v-if="item.item_type === 'drink' && item.drinkid && cartItemProducts[item.drinkid]" class="product-list">
                                    <p><strong>Ingredients:</strong></p>
                                    <ul>
                                        <li v-for="product in cartItemProducts[item.drinkid]" :key="product.productid">
                                            {{ product.name }}
                                        </li>
                                    </ul>
                                </div>
                                
                                <!-- Show product details for individual products -->
                                <div v-if="item.item_type === 'product'" class="product-details">
                                    <p class="item-note">Individual product purchase</p>
                                </div>
                                
                                <div class="item-total">
                                    <strong>Subtotal: {{ formatPrice(item.price * item.quantity) }}</strong>
                                </div>
                            </div>
                        </div>
                        <div v-if="cartItems.length > 0" class="cart-total">
                            <hr />
                            <p>Total Price: {{ formatPrice(totalPrice) }}</p>
                            <div class="checkout-actions">
                                <router-link to="/checkout" class="checkout-btn" @click="showCart = false">Go To Payment</router-link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>
<style scoped>
    .cart-container {
        position: relative;
        display: inline-block;
    }

    .cart-drawer {
        position: fixed;
        top: 0;
        right: 0;
        width: 100vw;
        height: 100vh;
        background: var(--shadow-color);
        z-index: 1000;
        display: flex;
        justify-content: flex-end;
    }

    .cart-drawer-content {
        width: 350px;
        max-width: 90vw;
        height: 100vh;
        background: var(--main-bg-color);
        box-shadow: -2px 0 12px #c9b37c44;
        display: flex;
        flex-direction: column;
        animation: cart-slide-in 0.3s;
    }

    .cart-drawer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px 12px 24px;
        font-size: 1.3rem;
        font-weight: bold;
        color: var(--header-color);
        border-bottom: 1px solid var(--font-color);
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 2rem;
        color: var(--header-color);
        cursor: pointer;
        line-height: 1;
    }

    .cart-drawer-body {
        flex: 1;
        padding: 24px;
        color: var(--font-color);
        overflow: auto;
    }

    .cart-item {
        margin-bottom: 20px;
        padding: 15px;
        border-bottom: 1px solid #eee;
        background: #fafafa;
        border-radius: 8px;
    }

    .item-type-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        margin-bottom: 10px;
    }

    .item-type-badge.drink {
        background: #e3f2fd;
        color: #1976d2;
    }

    .item-type-badge.product {
        background: #fff3e0;
        color: #f57c00;
    }

    .item-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 10px;
    }

    .item-info {
        flex: 1;
    }

    .item-info h3 {
        margin: 0 0 4px 0;
        font-size: 1rem;
        color: #333;
    }

    .item-price {
        margin: 0;
        color: #666;
        font-size: 0.9rem;
    }

    .item-total {
        margin-top: 10px;
        text-align: right;
        color: #8B4513;
    }

    .product-details {
        margin: 10px 0;
        padding: 8px;
        background: rgba(245, 124, 0, 0.1);
        border-radius: 4px;
    }

    .item-note {
        margin: 0;
        font-size: 0.85rem;
        color: #f57c00;
        font-style: italic;
    }

    .product-list {
        margin: 10px 0;
        padding: 10px;
        background: rgba(25, 118, 210, 0.1);
        border-radius: 5px;
        border-left: 3px solid #1976d2;
    }

    .product-list ul {
        margin: 5px 0 0 0;
        padding-left: 20px;
    }

    .product-list li {
        margin: 2px 0;
        font-size: 0.9rem;
    }

    @keyframes cart-slide-in {
        from {
            transform: translateX(100%);
        }

        to {
            transform: translateX(0);
        }
    }

    .cart-drawer-enter-active, .cart-drawer-leave-active {
        transition: opacity 0.2s;
    }

    .cart-drawer-enter-from, .cart-drawer-leave-to {
        opacity: 0;
    }

    .icon-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        display: flex;
        align-items: center;
        color: var(--font-color);
        font-size: 1.2rem;
        transition: background 0.2s;
        border-radius: 50%;
    }

    .icon-btn:hover {
        background: #f3e9e1;
    }

    .cart-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: var(--font-color);
        color: #fff;
        border-radius: 50%;
        padding: 0.15em 0.55em;
        font-size: 0.85rem;
        font-weight: bold;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
        pointer-events: none;
    }
    
    .image-cell {
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        border: 2px dashed #ccc;
        transition: border 0.2s;
    }

    .image-cell img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 8px;
    }

    .qty-control {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin: 8px 0;
    }

    .qty-btn {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        border: 1px solid rgba(0,0,0,0.12);
        background: var(--main-bg-color);
        cursor: pointer;
        font-size: 1.1rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .qty-value {
        min-width: 28px;
        text-align: center;
        font-weight: 600;
    }

    .checkout-actions {
        margin-top: 12px;
        display: flex;
        justify-content: center;
    }

    .checkout-btn {
        background: #c9b37c;
        border: none;
        padding: 10px 16px;
        color: #fff;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
    }

    .checkout-btn:hover {
        filter: brightness(0.95);
    }
</style>