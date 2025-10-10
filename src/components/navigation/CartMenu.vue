<script setup lang="ts">
    import CartIcon from '../icons/IconCart.vue'
    import CloseIcon from '../icons/IconClose.vue'
    import { useMyCart } from '@/composables/useMyCart'
    import { useDrinkProducts } from '@/composables/useDrinkProducts'
    import { ref, onMounted, computed } from 'vue'

    const { cartItems, totalPrice, fetchCartItems } = useMyCart()
    const { fetchDrinkProducts } = useDrinkProducts()
    const showCart = ref(false)
    const cartItemProducts = ref<Record<number, any[]>>({})
    const cartCount = computed(() =>
        cartItems.value.reduce((sum: number, item) => sum + item.quantity, 0)
    )

    function toggleCart() {
        showCart.value = !showCart.value
    }

    async function loadCartItemProducts() {
        for (const item of cartItems.value) {
            if (item.drinkid && !cartItemProducts.value[item.drinkid]) {
                const products = await fetchDrinkProducts()
                cartItemProducts.value[item.drinkid] = products
            }
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
                                <div class="item-header">
                                    <div class="image-cell">
                                        <img v-if="item.imageurl" :src="item.imageurl" alt="Product Image" />
                                        <div v-else class="image-placeholder">No Image</div>
                                    </div>
                                    <h3>{{ item.name }}</h3>
                                </div>
                                <p>Quantity: {{ item.quantity }}</p>
                                <div v-if="cartItemProducts[item.drinkid]" class="product-list">
                                    <p><strong>Products used:</strong></p>
                                    <ul>
                                        <li v-for="product in cartItemProducts[item.drinkid]" :key="product.productid">
                                            {{ product.name }} (ID: {{ product.productid }})
                                        </li>
                                    </ul>
                                </div>
                                <p>Base Price: ${{ item.price }}</p>
                            </div>
                        </div>
                        <div v-if="cartItems.length > 0" class="cart-total">
                            <hr />
                            <p>Total Price: ${{ totalPrice }}</p>
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
        padding-bottom: 15px;
        border-bottom: 1px solid #eee;
    }

    .product-list {
        margin: 10px 0;
        padding: 10px;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 5px;
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
</style>