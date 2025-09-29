import { ref } from "vue"
import type { CartItem, Product } from "@/types"

export function useCart() {
	const cartItems = ref<CartItem[]>([])
	const loading = ref(false)
	const error = ref<string | null>(null)
	const totalPrice = ref(0)

	const fetchCartItems = async (userId: string) => {
		loading.value = true
		error.value = null

		try {
			const response = await fetch(`/api/user/myCart?userId=${userId}`)
			if (!response.ok) {
				throw new Error("Failed to fetch cart items")
			}
			const data = await response.json()
			cartItems.value = data
		} catch (err: any) {
			error.value = err.message
		} finally {
			loading.value = false
		}
	}

	const calculateTotalPrice = () => {
		totalPrice.value = cartItems.value.reduce((acc, item) => {
		return acc + item.price * item.quantity
		}, 0)
	}

	return { cartItems, totalPrice, calculateTotalPrice, fetchCartItems }
}