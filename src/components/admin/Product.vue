<script setup lang="ts">
import { ref } from 'vue'
import { useProducts } from '@/composables/useProducts'
import { useManageProducts } from '@/composables/useManageProducts'
import type { Product } from '@/types'

const { products, fetchProducts } = useProducts()
const { addProduct, editProduct, deleteProduct, error } = useManageProducts(fetchProducts)
const form = ref<{ name: string; description?: string; price: number; material?: string; keyword?: string; category?: string; imageUrl?: string; file?: File }>({ name: '', price: 0, description: '', material: '', keyword: '', category: '', imageUrl: '' })
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const drawerOpen = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const filePreviewUrl = ref<string | undefined>(undefined)
const categories = ref([
    'mugs & cups',
    'drink bases',
    'choco bombs',
    'dipped cookies',
    'top-cream',
    'marshmallows',
    'sprinkles',
    'spoons & candy canes',
    'straw',
    'coasters',
    'packing styles'
  ])

function triggerFileInput() {
  fileInput.value?.click()
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    form.value.file = file
  if (filePreviewUrl.value) URL.revokeObjectURL(filePreviewUrl.value)
  filePreviewUrl.value = URL.createObjectURL(file) || undefined
  } else {
    form.value.file = undefined
  if (filePreviewUrl.value) URL.revokeObjectURL(filePreviewUrl.value)
  filePreviewUrl.value = undefined
  }
}

function openDrawerForAdd() {
  resetForm()
  filePreviewUrl.value = undefined
  drawerOpen.value = true
}

function openDrawerForEdit(product: Product) {
  // If the product's category is not in the categories list, set to '' (disabled option)
  let cat = product.category
  if (cat && !categories.value.includes(cat)) {
    cat = ''
  }
  form.value = {
    name: product.name,
    price: product.price,
    description: product.description,
    material: product.material,
    keyword: product.keyword,
    category: cat,
    imageUrl: product.imageUrl,
    file: undefined
  }
  isEditing.value = true
  editingId.value = product.id
  filePreviewUrl.value = undefined
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
  resetForm()
  if (filePreviewUrl.value) {
    URL.revokeObjectURL(filePreviewUrl.value)
    filePreviewUrl.value = undefined
  }
}

function resetForm() {
  form.value = { name: '', price: 0, description: '', material: '', keyword: '', category: '', imageUrl: '', file: undefined }
  isEditing.value = false
  editingId.value = null
}


async function onSubmit() {
  let success = false
  if (isEditing.value && editingId.value) {
    success = await editProduct(String(editingId.value), form.value)
  } else {
    success = await addProduct(form.value)
  }
  if (success) {
    closeDrawer()
  } else {
    alert(error.value || 'Error submitting product')
  }
}

async function onDeleteProduct(id: number) {
  const ok = await deleteProduct(String(id))
  if (ok) {
    if (editingId.value === id) resetForm()
  } else {
    alert(error.value || 'Error deleting product')
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
          <th>Image</th>
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
          <td>
            <div class="image-cell">
              <img v-if="product.imageUrl" :src="product.imageUrl" alt="Product Image" />
              <div v-else class="image-placeholder">No Image</div>
            </div>
          </td>
          <td>{{ product.name }}</td>
          <td>{{ product.price }}</td>
          <td>{{ product.description }}</td>
          <td>{{ product.material }}</td>
          <td>{{ product.keyword }}</td>
          <td>{{ product.category }}</td>
          <td>
            <button @click="openDrawerForEdit(product)">Edit</button>
            <button @click="onDeleteProduct(product.id)">Delete</button>
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
            <textarea v-model="form.description" rows="5" required></textarea>
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
            <select v-model="form.category" class="styled-select">
              <option value="" disabled>Select category</option>
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
          <div>
            <label>Image:</label>
            <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileChange" />
            <div class="image-cell clickable" style="margin-top:8px;" @click="triggerFileInput">
              <img v-if="form.file" :src="filePreviewUrl" alt="Preview" />
              <img v-else-if="form.imageUrl" :src="form.imageUrl" alt="Preview" />
              <div v-else class="image-placeholder">Click to add</div>
            </div>
            <input v-model="form.imageUrl" placeholder="https://..." style="margin-top:8px;" />
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
  right: -500px;
  width: 500px;
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
.image-cell.clickable:hover {
  border: 2px solid #a0522d;
}
.image-cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}
.image-placeholder {
  color: #bbb;
  font-size: 0.9rem;
  text-align: center;
}
/* Match select style to input/textarea */
.styled-select {
  width: 100%;
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  background: #fff;
  color: #23281a;
  font-size: 1rem;
  margin-top: 2px;
  margin-bottom: 2px;
  transition: border 0.2s;
}
.styled-select:focus {
  outline: none;
  border: 1.5px solid #a0522d;
}

</style>