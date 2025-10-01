import { ref, onMounted } from "vue"
import type { CartItem } from "@/types"

export function useCart() {
    const cartItems = ref<CartItem[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    const fetchCartItems = async () => {
        loading.value = true
        error.value = null

        try {
            const response = await fetch('/api/admin/carts')
            if (!response.ok) throw new Error('Failed to fetch cart items')
            const data = await response.json()
            cartItems.value = data
        } catch (err: any) {
            error.value = err.message
        } finally {
            loading.value = false
        }
    }

    onMounted(fetchCartItems)

    return {
        cartItems,
        loading,
        error,
        fetchCartItems
    }
}