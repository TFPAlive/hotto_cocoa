import { ref } from "vue"
import type { CartItem, Product } from "@/types"

export function useCart() {
  const cartItems = ref<CartItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalPrice = ref(0)

  const calculateTotalPrice = () => {
    totalPrice.value = cartItems.value.reduce((acc, item) => {
      return acc + item.price * item.quantity
    }, 0)
  }

  return {
    cartItems,
    loading,
    error,
    totalPrice,
    calculateTotalPrice
  }
}