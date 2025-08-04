<script setup lang="ts">
import '../../assets/welcome.css'
</script>

<template>
  <div class="welcome-container">
    <div class="welcome-left">
      <div class="welcome-title">Self-design bar</div>
      <div class="cup-icons">
        <svg
          v-for="n in 5"
          :key="n"
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="#c69c6d"
          xmlns="http://www.w3.org/2000/svg"
          class="cup-icon"
        >
          <rect x="7" y="8" width="10" height="10" rx="3" />
          <rect x="9" y="4" width="6" height="4" rx="2" />
          <rect x="10" y="18" width="4" height="2" rx="1" />
        </svg>
      </div>
    </div>
    <div class="welcome-right">
      <div class="welcome-desc">
        Welcome to Hotto Choco, where we design our own chocolate cups to enjoy during your cozy
        holiday. Cocoa, coffee, matcha, anything. Whirl it up in your style!
      </div>
      <router-link to="/design" class="design-btn">Design Now</router-link>
    </div>
  </div>
</template>
