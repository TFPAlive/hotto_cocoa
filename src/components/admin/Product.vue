<script setup lang="ts">
import { ref } from 'vue'
import { useProducts } from '@/composables/useProducts'
import type { Product } from '@/composables/useProducts'

const { products, loading, error, fetchProducts } = useProducts()
const form = ref<{ name: string; description?: string; price: number; material?: string; keyword?: string; category?: string; imageUrl?: string }>({ name: '', price: 0, description: '', material: '', keyword: '', category: '', imageUrl: '' })

const isEditing = ref(false)
const editingId = ref<string | null>(null)
const drawerOpen = ref(false)

function openDrawerForAdd() {
  resetForm()
  drawerOpen.value = true
}

function openDrawerForEdit(product: Product) {
  form.value = { name: product.name, price: product.price, description: product.description, material: product.material, keyword: product.keyword, category: product.category, imageUrl: product.imageUrl }
  isEditing.value = true
  editingId.value = product.id
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
  resetForm()
}

function resetForm() {
  form.value = { name: '', price: 0, description: '', material: '', keyword: '', category: '', imageUrl: '' }
  isEditing.value = false
  editingId.value = null
}

async function onSubmit() {
  if (isEditing.value && editingId.value) {
    // ...existing code...
  }
}

async function deleteProduct(id: string) {
  try {
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete product')
    await fetchProducts()
    if (editingId.value === id) resetForm()
  } catch (err) {
    alert('Error deleting product')
  }
}
</script>

<template>
  <div class="admin-product-page">
    <div v-if="drawerOpen" class="drawer-backdrop" @click="closeDrawer"></div>
    <h1>Admin Product Management</h1>
    <button class="add-btn" @click="openDrawerForAdd">Add new Product</button>
    <hr />
    <h2>Product List</h2>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Price</th>
          <th>Description</th>
          <th>Material</th>
          <th>Keyword</th>
          <th>Category</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in products" :key="product.id">
          <td>{{ product.name }}</td>
          <td>{{ product.price }}</td>
          <td>{{ product.description }}</td>
          <td>{{ product.material }}</td>
          <td>{{ product.keyword }}</td>
          <td>{{ product.category }}</td>
          <td>
            <button @click="openDrawerForEdit(product)">Edit</button>
            <button @click="deleteProduct(product.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Drawer for Add/Edit Product -->
    <div class="drawer" :class="{ open: drawerOpen }" @click.stop>
      <div class="drawer-content" @click.stop>
        <h2>{{ isEditing ? 'Edit Product' : 'Add Product' }}</h2>
        <form @submit.prevent="onSubmit">
          <div>
            <label>Name:</label>
            <input v-model="form.name" required />
          </div>
          <div>
            <label>Price:</label>
            <input v-model.number="form.price" type="number" min="0" required />
          </div>
          <div>
            <label>Description:</label>
            <textarea v-model="form.description" required></textarea>
          </div>
          <div>
            <label>Material:</label>
            <input v-model="form.material" />
          </div>
          <div>
            <label>Keyword:</label>
            <input v-model="form.keyword" />
          </div>
          <div>
            <label>Category:</label>
            <input v-model="form.category" />
          </div>
          <div class="drawer-actions">
            <button type="submit">{{ isEditing ? 'Update' : 'Add' }} Product</button>
            <button type="button" @click="closeDrawer">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-product-page {
  max-width: 100%;
  margin: 0 auto;
  padding: 2rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px #a0522d22;
}
h1, h2 {
  color: #a0522d;
}
form > div {
  margin-bottom: 1rem;
}
input, textarea {
  width: 100%;
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #ccc;
}
button {
  background: #a0522d;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1.2rem;
  margin-right: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
}
button:hover {
  background: #7a3a1d;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}
th, td {
  border: 1px solid #eee;
  padding: 0.5rem;
  text-align: left;
}
/* Drawer styles */
.drawer {
  position: fixed;
  top: 0;
  right: -420px;
  width: 400px;
  height: 100vh;
  background: #fff;
  box-shadow: -2px 0 16px #a0522d22;
  transition: right 0.3s cubic-bezier(.4,0,.2,1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  padding: 0;
}
.drawer.open {
  right: 0;
}
.drawer-content {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.drawer-actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
}
.add-btn {
  background: #a0522d;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1.2rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.add-btn:hover {
  background: #7a3a1d;
}
/* Drawer backdrop and blur */
.drawer-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.18);
  z-index: 999;
  backdrop-filter: blur(2px);
}
.admin-product-page {
  transition: filter 0.3s;
}
.drawer.open ~ .admin-product-page {
  filter: blur(3px);
}
</style>