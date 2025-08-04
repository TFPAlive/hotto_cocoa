<script setup lang="ts">
import '../../assets/sidemenu.css'
import '../../assets/cartmenu.css'
import CartIcon from '../icons/IconCart.vue'
import Navigation from './Navigation.vue'
import IconClose from '../icons/IconClose.vue'
import { ref } from 'vue'
const showCart = ref(false)
function toggleCart() {
  showCart.value = !showCart.value
}
const cartCount = 3
</script>

<template>
  <header class="navbar">
    <div class="navbar-left">
      <img src="/icon.png" alt="Hotto Choco Icon" class="site-icon" />
      <span class="site-name">Hotto Choco</span>
    </div>
    <Navigation />
    <div class="navbar-right">
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
                  <IconClose />
                </button>
              </div>
              <div class="cart-drawer-body">
                <p>Your cart is empty.</p>
              </div>
            </div>
          </div>
        </transition>
      </div>
      <button class="login-btn">Login</button>
    </div>
  </header>
</template>
