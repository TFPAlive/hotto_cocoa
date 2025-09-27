import { ref } from "vue"
import { auth } from "@/composables/useAuth"
import type { Product } from "@/types"

export function useAddCart(selectedProducts: Record<string, Product | undefined>) {
    const adding = ref(false)
    const error = ref<string | null>(null)

    async function addToCart() {
        adding.value = true
        error.value = null
        try {
            // transform selectedProducts into a compact array
            const products = Object.values(selectedProducts)
                .filter((p): p is Product => !!p)
                .map(p => ({
                    productId: p.id,       // adjust if your Product type uses a different key
                    quantity: 1,  // make sure Product has this field
                }))

            const res = await fetch('/api/user/addCart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ products, userid: auth.user?.userid }),
            })

            if (!res.ok) {
                throw new Error('Failed to add to cart')
            }
        } catch (err: any) {
            error.value = err.message || 'Unknown error'
        } finally {
            adding.value = false
        }
    }

    return { adding, error, addToCart }
}
