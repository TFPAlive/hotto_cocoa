import { ref } from 'vue'
import type { Order } from '@/types'

export function useManageOrders(fetchOrders: () => Promise<void>) {
	const loading = ref(false)
	const error = ref<string | null>(null)

	// Update order status
	async function updateOrderStatus(orderId: number, status: Order['status']) {
		loading.value = true
		error.value = null
		
		try {
			const res = await fetch(`/api/admin/orders/${orderId}/status`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ status })
			})

			if (!res.ok) throw new Error('Failed to update order status')
			await fetchOrders()
			return true
		} catch (err: any) {
			error.value = err.message || 'Error updating order status'
			return false
		} finally {
			loading.value = false
		}
	}

	// Update order details
	async function updateOrder(orderId: number, updates: Partial<Order>) {
		loading.value = true
		error.value = null
		
		try {
			const res = await fetch(`/api/admin/orders/${orderId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(updates)
			})

			if (!res.ok) throw new Error('Failed to update order')
			await fetchOrders()
			return true
		} catch (err: any) {
			error.value = err.message || 'Error updating order'
			return false
		} finally {
			loading.value = false
		}
	}

	// Delete order (admin only - for test/invalid orders)
	async function deleteOrder(orderId: number) {
		loading.value = true
		error.value = null
		
		try {
			const res = await fetch(`/api/admin/orders/${orderId}`, { 
				method: 'DELETE',
				credentials: 'include'
			})
			if (!res.ok) throw new Error('Failed to delete order')
			await fetchOrders()
			return true
		} catch (err: any) {
			error.value = err.message || 'Error deleting order'
			return false
		} finally {
			loading.value = false
		}
	}

	// Bulk update order statuses
	async function bulkUpdateOrderStatus(orderIds: number[], status: Order['status']) {
		loading.value = true
		error.value = null
		
		try {
			const res = await fetch('/api/admin/orders/bulk-status', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ orderIds, status })
			})

			if (!res.ok) throw new Error('Failed to bulk update order statuses')
			await fetchOrders()
			return true
		} catch (err: any) {
			error.value = err.message || 'Error updating order statuses'
			return false
		} finally {
			loading.value = false
		}
	}

	return { 
		updateOrderStatus, 
		updateOrder, 
		deleteOrder, 
		bulkUpdateOrderStatus, 
		loading, 
		error 
	}
}