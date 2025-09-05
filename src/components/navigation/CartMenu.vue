<script setup lang="ts">
import CartIcon from '../icons/IconCart.vue'
import CloseIcon from '../icons/IconClose.vue'
import { ref } from 'vue'

const showCart = ref(false)
const cartCount = ref(0)
function toggleCart() {
  showCart.value = !showCart.value
}
</script>

<template>
	<div class="cart-container">
		<button class="icon-btn" aria-label="Cart" @click="toggleCart">
			<CartIcon />
		</button>
		<span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
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
						<p>Your cart is empty.</p>
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
}
@keyframes cart-slide-in {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
.cart-drawer-enter-active,
.cart-drawer-leave-active {
  transition: opacity 0.2s;
}
.cart-drawer-enter-from,
.cart-drawer-leave-to {
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
</style>