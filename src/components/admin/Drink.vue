<script setup lang="ts">
    import { ref, computed } from 'vue'
    import { useDrinks } from '@/composables/useDrinks'
    import { useManageDrinks } from '@/composables/useManageDrinks'
    import { useProducts } from '@/composables/useProducts'
    import { formatPrice } from '@/utils/currency'
    import type { Drink, Product } from '@/types'

    const { drinks, fetchDrinks } = useDrinks()
    const { addDrink, editDrink, deleteDrink, error } = useManageDrinks(fetchDrinks)
    const { products } = useProducts()
    
    const form = ref<{ 
        name: string
        description?: string
        baseprice: number
        uniqueid: string
        productids: number[]
        imageurl?: string
        file?: File 
    }>({ 
        name: '', 
        baseprice: 0, 
        description: '', 
        uniqueid: '', 
        productids: [], 
        imageurl: '', 
        file: undefined 
    })
    
    const isEditing = ref(false)
    const editingId = ref<number | null>(null)
    const drawerOpen = ref(false)
    const fileInput = ref<HTMLInputElement | null>(null)
    const filePreviewUrl = ref<string | undefined>(undefined)
    const showProductSelector = ref(false)

    const totalPrice = computed(() => {
        const productCost = form.value.productids.reduce((sum, id) => {
            const product = products.value.find(p => p.productid === id)
            return sum + (product?.price || 0)
        }, 0)
        return form.value.baseprice + productCost
    })

    const selectedProducts = computed(() => {
        return form.value.productids.map(id => 
            products.value.find(p => p.productid === id)
        ).filter(Boolean) as Product[]
    })

    function triggerFileInput() {
        fileInput.value?.click()
    }

    function onImageCellDrop(e: DragEvent) {
        e.preventDefault()
        if (!e.dataTransfer) return
        const file = e.dataTransfer.files && e.dataTransfer.files[0]
        if (file && file.type.startsWith('image/')) {
            form.value.file = file
            if (filePreviewUrl.value) URL.revokeObjectURL(filePreviewUrl.value)
            filePreviewUrl.value = URL.createObjectURL(file) || undefined
        }
    }

    function onImageCellDragOver(e: DragEvent) {
        e.preventDefault()
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

    function openDrawerForEdit(drink: Drink) {
        form.value = { 
            name: drink.name, 
            baseprice: drink.baseprice, 
            description: drink.description, 
            uniqueid: drink.uniqueid,
            productids: [...drink.productids],
            imageurl: drink.imageurl, 
            file: undefined 
        }
        isEditing.value = true
        editingId.value = drink.drinkid
        filePreviewUrl.value = undefined
        drawerOpen.value = true
    }

    function closeDrawer() {
        drawerOpen.value = false
        showProductSelector.value = false
        resetForm()
        if (filePreviewUrl.value) {
            URL.revokeObjectURL(filePreviewUrl.value)
            filePreviewUrl.value = undefined
        }
    }

    function resetForm() {
        form.value = { 
            name: '', 
            baseprice: 0, 
            description: '', 
            uniqueid: '', 
            productids: [], 
            imageurl: '', 
            file: undefined 
        }
        isEditing.value = false
        editingId.value = null
    }

    function generateUniqueId() {
        let uniqueid = ''
        const selectedProducts = form.value.productids.map(id => 
            products.value.find(p => p.productid === id)
        ).filter(Boolean) as Product[]
        
        for (const p of selectedProducts) {
            uniqueid += String(p.productid).padStart(4, '0')
        }
        
        form.value.uniqueid = uniqueid || `DRINK_${Date.now()}`
    }

    function toggleProduct(productId: number) {
        const index = form.value.productids.indexOf(productId)
        if (index === -1) {
            form.value.productids.push(productId)
        } else {
            form.value.productids.splice(index, 1)
        }
    }

    function removeSelectedProduct(productId: number) {
        const index = form.value.productids.indexOf(productId)
        if (index !== -1) {
            form.value.productids.splice(index, 1)
        }
    }

    async function onSubmit() {
        if (!form.value.uniqueid) {
            generateUniqueId()
        }
        
        let success = false
        if (isEditing.value && editingId.value) {
            success = await editDrink(String(editingId.value), form.value)
        } else {
            success = await addDrink(form.value)
        }
        if (success) {
            closeDrawer()
        } else {
            alert(error.value || 'Error submitting drink')
        }
    }

    async function onDeleteDrink(id: number) {
        if (!confirm('Are you sure you want to delete this drink?')) return
        
        const ok = await deleteDrink(String(id))
        if (ok) {
            if (editingId.value === id) resetForm()
        } else {
            alert(error.value || 'Error deleting drink')
        }
    }

    function formatProductList(productids: number[] | undefined) {
        if (!productids || !Array.isArray(productids) || productids.length === 0) {
            return 'No products'
        }
        const names = productids.map(id => {
            const product = products.value.find(p => p.productid === id)
            return product?.name || `ID:${id}`
        })
        return names.join(', ')
    }
</script>

<template>
    <div class="admin-drink-page">
        <div v-if="drawerOpen" class="drawer-backdrop" @click="closeDrawer"></div>
        <h1>Admin Drink Management</h1>
        <button class="add-btn" @click="openDrawerForAdd">Add new Drink</button>
        <hr />
        <h2>Drink List</h2>
        <table>
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Base Price</th>
                    <th>Description</th>
                    <th>Unique ID</th>
                    <th>Products</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="drink in drinks" :key="drink.drinkid">
                    <td>
                        <div class="image-cell">
                            <img v-if="drink.imageurl" :src="drink.imageurl" alt="Drink Image" />
                            <div v-else class="image-placeholder">No Image</div>
                        </div>
                    </td>
                    <td>{{ drink.name }}</td>
                    <td>{{ formatPrice(drink.baseprice) }}</td>
                    <td>{{ drink.description }}</td>
                    <td class="uniqueid-cell">{{ drink.uniqueid }}</td>
                    <td class="products-cell">
                        {{ formatProductList(drink.productids) }}
                        <div v-if="(drink as any).product_composition && !drink.productids?.length" class="product-composition">
                            {{ (drink as any).product_composition }}
                        </div>
                    </td>
                    <td>
                        <button @click="openDrawerForEdit(drink)">Edit</button>
                        <button @click="onDeleteDrink(drink.drinkid)">Delete</button>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Drawer for Add/Edit Drink -->
        <div class="drawer" :class="{ open: drawerOpen }" @click.stop>
            <div class="drawer-content" @click.stop>
                <h2>{{ isEditing ? 'Edit Drink' : 'Add Drink' }}</h2>
                <form @submit.prevent="onSubmit">
                    <div>
                        <label>Name:</label>
                        <input v-model="form.name" required />
                    </div>
                    <div>
                        <label>Base Price:</label>
                        <input v-model.number="form.baseprice" type="number" min="0" step="0.01" required />
                    </div>
                    <div>
                        <label>Description:</label>
                        <textarea v-model="form.description" rows="3"></textarea>
                    </div>
                    <div>
                        <label>Unique ID:</label>
                        <div class="uniqueid-input">
                            <input v-model="form.uniqueid" placeholder="Auto-generated if empty" />
                            <button type="button" @click="generateUniqueId">Generate</button>
                        </div>
                    </div>
                    
                    <!-- Product Selection -->
                    <div>
                        <label>Select Products:</label>
                        <div class="product-section">
                            <button type="button" class="toggle-products" @click="showProductSelector = !showProductSelector">
                                {{ showProductSelector ? 'Hide' : 'Show' }} Product Selection
                            </button>
                            
                            <!-- Selected Products Display -->
                            <div v-if="selectedProducts.length > 0" class="selected-products">
                                <h4>Selected Products ({{ selectedProducts.length }}):</h4>
                                <div class="selected-products-list">
                                    <div v-for="product in selectedProducts" :key="product.productid" class="selected-product">
                                        <span>{{ product.name }} - {{ formatPrice(product.price) }}</span>
                                        <button type="button" @click="removeSelectedProduct(product.productid)">&times;</button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Product Selector -->
                            <div v-if="showProductSelector" class="product-selector">
                                <div class="products-grid">
                                    <div 
                                        v-for="product in products" 
                                        :key="product.productid"
                                        class="product-card"
                                        :class="{ selected: form.productids.includes(product.productid) }"
                                        @click="toggleProduct(product.productid)"
                                    >
                                        <img v-if="product.imageurl" :src="product.imageurl" :alt="product.name" />
                                        <div v-else class="product-placeholder">No Image</div>
                                        <div class="product-info">
                                            <h5>{{ product.name }}</h5>
                                            <p>{{ formatPrice(product.price) }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Price Calculation -->
                            <div class="price-calculation">
                                <div>Base Price: {{ formatPrice(form.baseprice) }}</div>
                                <div>Products Cost: {{ formatPrice(totalPrice - form.baseprice) }}</div>
                                <div class="total-price">Total Price: {{ formatPrice(totalPrice) }}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Image Upload -->
                    <div>
                        <label>Image:</label>
                        <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileChange" />
                        <div class="image-cell clickable" style="margin-top:8px;" @click="triggerFileInput" @drop="onImageCellDrop" @dragover="onImageCellDragOver">
                            <img v-if="form.file" :src="filePreviewUrl" alt="Preview" />
                            <img v-else-if="form.imageurl" :src="form.imageurl" alt="Preview" />
                            <div v-else class="image-placeholder">Click to add</div>
                        </div>
                    </div>
                    
                    <div class="drawer-actions">
                        <button type="submit">{{ isEditing ? 'Update' : 'Add' }} Drink</button>
                        <button type="button" @click="closeDrawer">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
    .admin-drink-page {
        max-width: 100%;
        margin: 0 auto;
        padding: 2rem;
        background: var(--main-bg-color);
        border-radius: 12px;
        box-shadow: 0 2px 12px var(--shadow-color);
    }

    h1, h2 {
        color: var(--header-color);
    }

    form > div {
        margin-bottom: 1rem;
    }

    input, textarea {
        width: 100%;
        padding: 0.5rem;
        border-radius: 6px;
        border: 1px solid var(--button-color);
    }

    button {
        background: var(--button-color);
        color: var(--header-color);
        border: none;
        border-radius: 6px;
        padding: 0.5rem 1.2rem;
        margin-right: 0.5rem;
        cursor: pointer;
        transition: background 0.2s;
    }

    button:hover {
        background: var(--hover-color);
        color: var(--hover-font-color);
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
    }

    th, td {
        border: 1px solid var(--sub-bg-color);
        padding: 0.5rem;
        text-align: left;
    }

    .uniqueid-cell {
        font-size: 0.9rem;
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .products-cell {
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .product-composition {
        font-size: 0.8rem;
        color: var(--font-color);
        font-style: italic;
    }

    /* Drawer styles */
    .drawer {
        position: fixed;
        top: 0;
        right: -600px;
        width: 600px;
        height: 100vh;
        background: var(--main-bg-color);
        box-shadow: -2px 0 16px var(--shadow-color);
        transition: right 0.3s cubic-bezier(.4, 0, .2, 1);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        padding: 0;
        overflow-y: auto;
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
        background: var(--button-color);
        color: var(--header-color);
        border: none;
        border-radius: 6px;
        padding: 0.5rem 1.2rem;
        margin-bottom: 1rem;
        cursor: pointer;
        transition: background 0.2s;
    }

    .add-btn:hover {
        background: var(--hover-color);
        color: var(--hover-font-color);
    }

    /* Drawer backdrop */
    .drawer-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.18);
        z-index: 999;
        backdrop-filter: blur(2px);
    }

    .image-cell {
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--sub-bg-color);
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        border: 2px dashed var(--button-color);
        transition: border 0.2s;
    }

    .image-cell.clickable:hover {
        border: 2px solid var(--header-color);
    }

    .image-cell img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 8px;
    }

    .image-placeholder, .product-placeholder {
        color: var(--font-color);
        font-size: 0.9rem;
        text-align: center;
    }

    .uniqueid-input {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .uniqueid-input input {
        flex: 1;
    }

    .product-section {
        border: 1px solid var(--sub-bg-color);
        border-radius: 8px;
        padding: 1rem;
        background: var(--main-bg-color);
    }

    .toggle-products {
        background: var(--font-color);
        margin-bottom: 1rem;
    }

    .toggle-products:hover {
        background: var(--hover-font-color);
    }

    .selected-products {
        margin-bottom: 1rem;
    }

    .selected-products h4 {
        color: var(--header-color);
        margin-bottom: 0.5rem;
    }

    .selected-products-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .selected-product {
        background: var(--sub-bg-color);
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .selected-product button {
        background: var(--header-color);
        color: var(--main-bg-color);
        border: none;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 12px;
        padding: 0;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .product-selector {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid var(--button-color);
        border-radius: 8px;
        padding: 1rem;
        background: var(--main-bg-color);
    }

    .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 1rem;
    }

    .product-card {
        border: 2px solid var(--sub-bg-color);
        border-radius: 8px;
        padding: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
    }

    .product-card:hover {
        border-color: var(--header-color);
    }

    .product-card.selected {
        border-color: var(--hover-font-color);
        background: var(--sub-bg-color);
    }

    .product-card img {
        width: 100%;
        height: 60px;
        object-fit: cover;
        border-radius: 4px;
    }

    .product-placeholder {
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--sub-bg-color);
        border-radius: 4px;
    }

    .product-info h5 {
        margin: 0.25rem 0;
        font-size: 0.9rem;
    }

    .product-info p {
        margin: 0;
        color: var(--font-color);
        font-size: 0.8rem;
    }

    .price-calculation {
        margin-top: 1rem;
        padding: 0.5rem;
        background: var(--main-bg-color);
        border-radius: 4px;
        font-size: 0.9rem;
    }

    .total-price {
        font-weight: bold;
        color: var(--header-color);
        font-size: 1.1rem;
    }

    @media (max-width: 768px) {
        .drawer {
            width: 100vw;
            right: -100vw;
        }
        
        .products-grid {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        }
    }
</style>