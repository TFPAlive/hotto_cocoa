import { ref, computed } from "vue"
import { auth } from "./useAuth"
import type { CartItem } from "@/types"

// ✅ module-scoped singletons (shared across all components)
const cartItems = ref<CartItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const totalPrice = computed(() =>
  cartItems.value.reduce((acc, item) => acc + item.price * item.quantity, 0)
)

const fetchCartItems = async () => {
  loading.value = true
  try {
  const response = await fetch(`/api/user/cart?userid=${auth.user?.userid}`)
    if (!response.ok) throw new Error("Failed to fetch cart items")
    cartItems.value = await response.json()
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

export function useMyCart() {
  return { cartItems, totalPrice, loading, error, fetchCartItems }
}
