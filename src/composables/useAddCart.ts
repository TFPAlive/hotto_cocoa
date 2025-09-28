import { ref } from "vue"
import { auth } from "@/composables/useAuth"
import type { Product } from "@/types"

export function useAddCart(drinkid: any) {
    const adding = ref(false)
    const error = ref<string | null>(null)

    async function addToCart() {
        adding.value = true
        error.value = null
        try {
            
            const res = await fetch('/api/user/addCart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ drinkid, userid: auth.user?.userid }),
            })

            if (!res.ok) throw new Error('Failed to add to cart')
        } catch (err: any) {
            error.value = err.message || 'Unknown error'
        } finally {
            adding.value = false
        }
    }

    return { adding, error, addToCart }
}
