<template>
  <div class="admin-product-page">
    <h1>Admin Product Management</h1>
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
        <button type="submit">{{ isEditing ? 'Update' : 'Add' }} Product</button>
        <button v-if="isEditing" type="button" @click="resetForm">Cancel</button>
      </div>
    </form>
    <hr />
    <h2>Product List</h2>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Price</th>
          <th>Description</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in products" :key="product.id">
          <td>{{ product.name }}</td>
          <td>{{ product.price }}</td>
          <td>{{ product.description }}</td>
          <td>
            <button @click="editProduct(product)">Edit</button>
            <button @click="deleteProduct(product.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Product {
  id: number
  name: string
  price: number
  description: string
}

const products = ref<Product[]>([])
const form = ref({ name: '', price: 0, description: '' })
const isEditing = ref(false)
const editingId = ref<number | null>(null)

function resetForm() {
  form.value = { name: '', price: 0, description: '' }
  isEditing.value = false
  editingId.value = null
}

function onSubmit() {
  if (isEditing.value && editingId.value !== null) {
    // Update product
    const idx = products.value.findIndex(p => p.id === editingId.value)
    if (idx !== -1) {
      products.value[idx] = { id: editingId.value, ...form.value }
    }
  } else {
    // Add product
    const newId = products.value.length ? Math.max(...products.value.map(p => p.id)) + 1 : 1
    products.value.push({ id: newId, ...form.value })
  }
  resetForm()
}

function editProduct(product: Product) {
  form.value = { name: product.name, price: product.price, description: product.description }
  isEditing.value = true
  editingId.value = product.id
}

function deleteProduct(id: number) {
  products.value = products.value.filter(p => p.id !== id)
  if (editingId.value === id) resetForm()
}
</script>

<style scoped>
.admin-product-page {
  max-width: 700px;
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
</style>
