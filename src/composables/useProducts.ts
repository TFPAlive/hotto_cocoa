import { ref, onMounted } from "vue"
import type { Product } from "@/types"

interface ProductFilters {
	search?: string
	category?: string
	sortBy?: string
}

export function useProducts() {
	const products = ref<Product[]>([])
	const loading = ref(false)
	const error = ref<string | null>(null)

	const fetchProducts = async (filters?: ProductFilters) => {
		loading.value = true
		error.value = null
		try {
			// Build query string for filters
			const queryParams = new URLSearchParams()
			if (filters?.search) queryParams.append('search', filters.search)
			if (filters?.category) queryParams.append('category', filters.category)
			if (filters?.sortBy) queryParams.append('sortBy', filters.sortBy)
			
			const queryString = queryParams.toString()
			const url = `/api/user/products${queryString ? `?${queryString}` : ''}`
			
			const res = await fetch(url)

			if (!res.ok) throw new Error("Failed to fetch products")
			products.value = await res.json()

		} catch (err: any) {
			error.value = err.message || "Unknown error"
		} finally {
			loading.value = false
		}
	}

	onMounted(() => fetchProducts())

	return { products, loading, error, fetchProducts }
}