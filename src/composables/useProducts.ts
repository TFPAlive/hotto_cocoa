import { ref, onMounted } from "vue"
import type { Product } from "@/types"

export function useProducts() {
	const products = ref<Product[]>([])
	const loading = ref(false)
	const error = ref<string | null>(null)

	const fetchProducts = async () => {
		loading.value = true
		error.value = null
		try {
			const res = await fetch("/api/user/products")

			if (!res.ok) throw new Error("Failed to fetch products")
			products.value = await res.json()

		} catch (err: any) {
			error.value = err.message || "Unknown error"
		} finally {
			loading.value = false
		}
	}

	onMounted(fetchProducts)

	return {
		products,
		loading,
		error,
		fetchProducts,
  }
}