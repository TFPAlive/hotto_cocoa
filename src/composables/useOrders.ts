import { ref, onMounted } from "vue"
import type { Order } from "@/types"

export function useOrders() {
	const orders = ref<Order[]>([])
	const loading = ref(false)
	const error = ref<string | null>(null)

	const fetchOrders = async () => {
		loading.value = true
		error.value = null
		try {
			const res = await fetch("/api/admin/orders", {
				credentials: 'include'
			})

			if (!res.ok) throw new Error("Failed to fetch orders")
			const data = await res.json()
			
			// Handle new API response format { orders: [...], pagination: {...} }
			if (data && Array.isArray(data.orders)) {
				// Transform API data to match interface expectations
				orders.value = data.orders.map((order: any) => ({
					orderid: order.orderid,
					userid: order.userid,
					status: order.status,
					total: order.totalamount || order.total || 0,
					created_at: order.createdat || order.created_at || '',
					updated_at: order.updatedat || order.updated_at || '',
					shipping_address: order.shipping_address || '',
					items: order.items || []
				}))
			} else if (Array.isArray(data)) {
				// Fallback for old format
				orders.value = data
			} else {
				orders.value = []
			}

		} catch (err: any) {
			error.value = err.message || "Unknown error"
			orders.value = [] // Ensure it's always an array
		} finally {
			loading.value = false
		}
	}

	onMounted(fetchOrders)

	return { orders, loading, error, fetchOrders }
}