import { ref } from 'vue'
import type { Product } from '@/types'

export function useManageProducts(fetchProducts: () => Promise<void>) {
	const loading = ref(false)
	const error = ref<string | null>(null)

	// Add product
	async function addProduct(product: Omit<Product, 'id'> & { file?: File }) {
		loading.value = true
		error.value = null
		try {
			let imageUrl = product.imageUrl
			if (product.file) {
				// Get signed URL from backend
				const uploadRes = await fetch(`/api/admin/products/genURL?fileName=${encodeURIComponent(product.file.name)}&fileType=${encodeURIComponent(product.file.type)}`)
				if (!uploadRes.ok) throw new Error('Failed to get upload URL')
				const { uploadUrl, publicUrl } = await uploadRes.json()
				// Upload file to GCS
				const putRes = await fetch(uploadUrl, {
					method: 'PUT',
					headers: { 'Content-Type': product.file.type },
					body: product.file
				})
				if (!putRes.ok) throw new Error('Failed to upload file')
				imageUrl = publicUrl
			}
			// Send product data to API
			const res = await fetch('/api/admin/products', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...product, imageUrl })
			})
			if (!res.ok) throw new Error('Failed to add product')
			await fetchProducts()
			return true
		} catch (err: any) {
			error.value = err.message || 'Error adding product'
			return false
		} finally {
			loading.value = false
		}
	}

	// Edit product
	async function editProduct(id: string, product: Omit<Product, 'id'> & { file?: File }) {
		loading.value = true
		error.value = null
		try {
            let imageUrl = product.imageUrl
			if (product.file) {
				// Get signed URL from backend
				const uploadRes = await fetch(`/api/admin/products/genURL?fileName=${encodeURIComponent(product.file.name)}&fileType=${encodeURIComponent(product.file.type)}`)
				if (!uploadRes.ok) throw new Error('Failed to get upload URL')
				const { uploadUrl, publicUrl } = await uploadRes.json()
				// Upload file to GCS
				const putRes = await fetch(uploadUrl, {
					method: 'PUT',
					headers: { 'Content-Type': product.file.type },
					body: product.file
				})
				if (!putRes.ok) throw new Error('Failed to upload file')
				if (product.imageUrl) {
					const deleteRes = await fetch(`/api/admin/products/deleteFiles?fileName=${encodeURIComponent(product.imageUrl?.split('/').pop() || '')}`, { method: 'DELETE' })
					if (!deleteRes.ok) console.warn('Failed to delete old image')
				}
				imageUrl = publicUrl
			}
			// Send product data to API
			const res = await fetch(`/api/admin/products/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...product, imageUrl })
			})
			if (!res.ok) throw new Error('Failed to update product')
			await fetchProducts()
			return true
		} catch (err: any) {
			error.value = err.message || 'Error updating product'
			return false
		} finally {
			loading.value = false
		}
	}

	// Delete product
	async function deleteProduct(id: string) {
		loading.value = true
		error.value = null
		try {
			const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
			if (!res.ok) throw new Error('Failed to delete product')
			await fetchProducts()
			return true
		} catch (err: any) {
			error.value = err.message || 'Error deleting product'
			return false
		} finally {
			loading.value = false
		}
	}

	return {
		addProduct,
		editProduct,
		deleteProduct,
		loading,
		error
	}
}
