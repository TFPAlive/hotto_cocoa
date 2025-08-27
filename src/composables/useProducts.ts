import { ref, onMounted } from "vue"

export interface Product {
  id: string
  name: string
  price: number
  description?: string
  imageUrl?: string
}

export function useProducts() {
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchProducts = async () => {
    loading.value = true
    error.value = null
    try {
      const res = await fetch("backend/user/products")
      if (!res.ok) throw new Error("Failed to fetch products")
      products.value = await res.json()
    } catch (err: any) {
      console.log(err)
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