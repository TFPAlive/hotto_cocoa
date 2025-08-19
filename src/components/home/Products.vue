<script setup lang="ts">
import { useProducts } from "@/composables/useProducts"

const { products, loading, error } = useProducts()
</script>

<template>
  <div class="products">
    <h1>Products</h1>

    <!-- Loading state -->
    <div v-if="loading">Loading products...</div>

    <!-- Error state -->
    <div v-if="error" class="error">
      {{ error }}
    </div>

    <!-- Products list -->
    <ul v-else>
      <li v-for="p in products" :key="p.id">
        {{ p.name }} - ${{ p.price }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.products {
  padding: 20px;
}

.product-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.product-card {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 8px;
  width: 200px;
}

.product-image {
  width: 100%;
  height: auto;
  margin-top: 10px;
}
</style>
