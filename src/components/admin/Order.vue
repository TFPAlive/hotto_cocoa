<script setup lang="ts">
    import { ref, computed } from 'vue'
    import { useOrders } from '@/composables/useOrders'
    import { useManageOrders } from '@/composables/useManageOrders'
    import { formatPrice } from '@/utils/currency'
    import type { Order } from '@/types'

    const { orders, fetchOrders, loading: ordersLoading } = useOrders()
    const { updateOrderStatus, updateOrder, deleteOrder, bulkUpdateOrderStatus, loading: updateLoading, error } = useManageOrders(fetchOrders)
    
    const selectedOrder = ref<Order | null>(null)
    const showOrderModal = ref(false)
    const statusFilter = ref<string>('all')
    const searchQuery = ref('')
    const selectedOrders = ref<number[]>([])
    const bulkAction = ref<Order['status'] | ''>('')
    
    const statusOptions: Array<{value: Order['status'], label: string, color: string}> = [
        { value: 'pending', label: 'Pending', color: '#ff9800' },
        { value: 'processing', label: 'Processing', color: '#2196f3' },
        { value: 'shipped', label: 'Shipped', color: '#9c27b0' },
        { value: 'delivered', label: 'Delivered', color: '#4caf50' },
        { value: 'cancelled', label: 'Cancelled', color: '#f44336' }
    ]

    const filteredOrders = computed(() => {
        if (!Array.isArray(orders.value)) {
            return []
        }
        
        let result = orders.value
        
        // Filter by status
        if (statusFilter.value !== 'all') {
            result = result.filter(order => order.status === statusFilter.value)
        }
        
        // Filter by search query
        if (searchQuery.value) {
            const query = searchQuery.value.toLowerCase()
            result = result.filter(order => 
                order.orderid.toString().includes(query) ||
                (order.shipping_address || '').toLowerCase().includes(query)
            )
        }
        
        // Sort by creation date (newest first)
        return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    })

    const orderStats = computed(() => {
        const stats = {
            total: Array.isArray(orders.value) ? orders.value.length : 0,
            pending: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0,
            revenue: 0
        }
        
        if (Array.isArray(orders.value)) {
            orders.value.forEach(order => {
                stats[order.status]++
                if (order.status === 'delivered') {
                    stats.revenue += order.total
                }
            })
        }
        
        return stats
    })

    function getStatusColor(status: Order['status']) {
        const statusOption = statusOptions.find(option => option.value === status)
        return statusOption?.color || '#666'
    }

    function getStatusLabel(status: Order['status']) {
        const statusOption = statusOptions.find(option => option.value === status)
        return statusOption?.label || status
    }

    function openOrderModal(order: Order) {
        selectedOrder.value = order
        showOrderModal.value = true
    }

    function closeOrderModal() {
        selectedOrder.value = null
        showOrderModal.value = false
    }

    async function changeOrderStatus(orderId: number, newStatus: Order['status']) {
        const success = await updateOrderStatus(orderId, newStatus)
        if (!success) {
            alert(error.value || 'Failed to update order status')
        }
    }

    async function handleDeleteOrder(orderId: number) {
        if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) return
        
        const success = await deleteOrder(orderId)
        if (!success) {
            alert(error.value || 'Failed to delete order')
        } else {
            closeOrderModal()
        }
    }

    function toggleOrderSelection(orderId: number) {
        const index = selectedOrders.value.indexOf(orderId)
        if (index === -1) {
            selectedOrders.value.push(orderId)
        } else {
            selectedOrders.value.splice(index, 1)
        }
    }

    function selectAllOrders() {
        if (selectedOrders.value.length === filteredOrders.value.length) {
            selectedOrders.value = []
        } else {
            selectedOrders.value = filteredOrders.value.map(order => order.orderid)
        }
    }

    async function executeBulkAction() {
        if (!bulkAction.value || selectedOrders.value.length === 0) return
        
        const success = await bulkUpdateOrderStatus(selectedOrders.value, bulkAction.value)
        if (success) {
            selectedOrders.value = []
            bulkAction.value = ''
        } else {
            alert(error.value || 'Failed to update order statuses')
        }
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString()
    }

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'JPY'
        }).format(amount)
    }
</script>

<template>
    <div class="admin-order-page">
        <h1>Admin Order Management</h1>
        
        <!-- Stats Dashboard -->
        <div class="stats-section">
            <div class="stat-card">
                <h3>{{ orderStats.total }}</h3>
                <p>Total Orders</p>
            </div>
            <div class="stat-card">
                <h3>{{ orderStats.pending }}</h3>
                <p>Pending</p>
            </div>
            <div class="stat-card">
                <h3>{{ orderStats.processing }}</h3>
                <p>Processing</p>
            </div>
            <div class="stat-card">
                <h3>{{ orderStats.shipped }}</h3>
                <p>Shipped</p>
            </div>
            <div class="stat-card">
                <h3>{{ orderStats.delivered }}</h3>
                <p>Delivered</p>
            </div>
            <div class="stat-card revenue">
                <h3>{{ formatCurrency(orderStats.revenue) }}</h3>
                <p>Revenue</p>
            </div>
        </div>
        
        <!-- Filters and Search -->
        <div class="controls-section">
            <div class="filters">
                <select v-model="statusFilter">
                    <option value="all">All Status</option>
                    <option v-for="status in statusOptions" :key="status.value" :value="status.value">
                        {{ status.label }}
                    </option>
                </select>
                <input 
                    v-model="searchQuery" 
                    type="text" 
                    placeholder="Search by Order ID or Address..."
                    class="search-input"
                />
            </div>
            
            <!-- Bulk Actions -->
            <div v-if="selectedOrders.length > 0" class="bulk-actions">
                <span>{{ selectedOrders.length }} selected</span>
                <select v-model="bulkAction">
                    <option value="">Select Action</option>
                    <option v-for="status in statusOptions" :key="status.value" :value="status.value">
                        Set to {{ status.label }}
                    </option>
                </select>
                <button @click="executeBulkAction" :disabled="!bulkAction">Apply</button>
            </div>
        </div>
        
        <hr />
        
        <!-- Loading State -->
        <div v-if="ordersLoading" class="loading-state">
            <p>Loading orders...</p>
        </div>
        
        <!-- Orders Table -->
        <div v-else class="orders-section">
            <h2>Orders ({{ filteredOrders.length }})</h2>
            <table>
                <thead>
                    <tr>
                        <th>
                            <input 
                                type="checkbox" 
                                :checked="selectedOrders.length === filteredOrders.length && filteredOrders.length > 0"
                                :indeterminate="selectedOrders.length > 0 && selectedOrders.length < filteredOrders.length"
                                @change="selectAllOrders"
                            />
                        </th>
                        <th>Order ID</th>
                        <th>User ID</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Updated</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="order in filteredOrders" :key="order.orderid">
                        <td>
                            <input 
                                type="checkbox"
                                :checked="selectedOrders.includes(order.orderid)"
                                @change="toggleOrderSelection(order.orderid)"
                            />
                        </td>
                        <td class="order-id">#{{ order.orderid }}</td>
                        <td>{{ order.userid }}</td>
                        <td class="total-amount">{{ formatCurrency(order.total) }}</td>
                        <td>
                            <select 
                                :value="order.status" 
                                @change="changeOrderStatus(order.orderid, ($event.target as HTMLSelectElement).value as Order['status'])"
                                class="status-select"
                                :style="{ borderColor: getStatusColor(order.status) }"
                            >
                                <option v-for="status in statusOptions" :key="status.value" :value="status.value">
                                    {{ status.label }}
                                </option>
                            </select>
                        </td>
                        <td>{{ formatDate(order.created_at) }}</td>
                        <td>{{ formatDate(order.updated_at) }}</td>
                        <td>
                            <button @click="openOrderModal(order)" class="view-btn">View</button>
                            <button @click="handleDeleteOrder(order.orderid)" class="delete-btn">Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <div v-if="filteredOrders.length === 0" class="empty-state">
                <p>No orders found matching your criteria.</p>
            </div>
        </div>

        <!-- Order Details Modal -->
        <div v-if="showOrderModal && selectedOrder" class="modal-backdrop" @click="closeOrderModal">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h2>Order #{{ selectedOrder.orderid }}</h2>
                    <button class="close-btn" @click="closeOrderModal">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="order-info">
                        <div class="info-section">
                            <h3>Order Information</h3>
                            <div class="info-grid">
                                <div><strong>Order ID:</strong> #{{ selectedOrder.orderid }}</div>
                                <div><strong>User ID:</strong> {{ selectedOrder.userid }}</div>
                                <div><strong>Status:</strong> 
                                    <span 
                                        class="status-badge" 
                                        :style="{ backgroundColor: getStatusColor(selectedOrder.status) }"
                                    >
                                        {{ getStatusLabel(selectedOrder.status) }}
                                    </span>
                                </div>
                                <div><strong>Total:</strong> {{ formatCurrency(selectedOrder.total) }}</div>
                                <div><strong>Created:</strong> {{ formatDate(selectedOrder.created_at) }}</div>
                                <div><strong>Updated:</strong> {{ formatDate(selectedOrder.updated_at) }}</div>
                            </div>
                        </div>
                        
                        <div class="info-section">
                            <h3>Shipping Address</h3>
                            <p>{{ selectedOrder.shipping_address }}</p>
                        </div>
                        
                        <div class="info-section">
                            <h3>Order Items ({{ selectedOrder.items.length }})</h3>
                            <div class="items-list">
                                <div v-for="item in selectedOrder.items" :key="item.orderitemid" class="item-card">
                                    <img v-if="item.imageurl" :src="item.imageurl" :alt="item.name" />
                                    <div v-else class="item-placeholder">No Image</div>
                                    <div class="item-details">
                                        <h4>{{ item.name }}</h4>
                                        <p>Quantity: {{ item.quantity }}</p>
                                        <p>Price: {{ formatCurrency(item.price) }}</p>
                                        <p>Total: {{ formatCurrency(item.price * item.quantity) }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <div class="status-actions">
                        <label>Change Status:</label>
                        <select 
                            :value="selectedOrder.status" 
                            @change="changeOrderStatus(selectedOrder.orderid, ($event.target as HTMLSelectElement).value as Order['status'])"
                        >
                            <option v-for="status in statusOptions" :key="status.value" :value="status.value">
                                {{ status.label }}
                            </option>
                        </select>
                    </div>
                    <button @click="handleDeleteOrder(selectedOrder.orderid)" class="delete-btn">Delete Order</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
    .admin-order-page {
        max-width: 100%;
        margin: 0 auto;
        padding: 2rem;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 2px 12px #a0522d22;
    }

    h1, h2, h3 {
        color: #a0522d;
    }

    .stats-section {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .stat-card {
        background: #f8f9fa;
        padding: 1.5rem;
        border-radius: 8px;
        text-align: center;
        border: 2px solid #e9ecef;
    }

    .stat-card.revenue {
        background: #e8f5e9;
        border-color: #4caf50;
    }

    .stat-card h3 {
        margin: 0;
        font-size: 2rem;
        color: #2c3e50;
    }

    .stat-card.revenue h3 {
        color: #2e7d32;
    }

    .stat-card p {
        margin: 0.5rem 0 0 0;
        color: #666;
        font-size: 0.9rem;
    }

    .controls-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .filters {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .search-input {
        padding: 0.5rem;
        border-radius: 6px;
        border: 1px solid #ccc;
        min-width: 200px;
    }

    .bulk-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        background: #e3f2fd;
        padding: 0.5rem 1rem;
        border-radius: 6px;
    }

    .loading-state {
        text-align: center;
        padding: 2rem;
        color: #666;
    }

    select, .search-input {
        padding: 0.5rem;
        border-radius: 6px;
        border: 1px solid #ccc;
    }

    button {
        background: #a0522d;
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 0.5rem 1rem;
        cursor: pointer;
        transition: background 0.2s;
    }

    button:hover:not(:disabled) {
        background: #7a3a1d;
    }

    button:disabled {
        background: #ccc;
        cursor: not-allowed;
    }

    .view-btn {
        background: #2196f3;
        margin-right: 0.5rem;
    }

    .view-btn:hover {
        background: #1976d2;
    }

    .delete-btn {
        background: #f44336;
    }

    .delete-btn:hover {
        background: #d32f2f;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
    }

    th, td {
        border: 1px solid #eee;
        padding: 0.75rem 0.5rem;
        text-align: left;
    }

    th {
        background: #f8f9fa;
        font-weight: 600;
    }

    .order-id {
        font-weight: 600;
        color: #a0522d;
    }

    .total-amount {
        font-weight: 600;
        color: #2e7d32;
    }

    .status-select {
        border: 2px solid;
        font-weight: 500;
    }

    .empty-state {
        text-align: center;
        padding: 2rem;
        color: #666;
    }

    /* Modal Styles */
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-content {
        background: white;
        border-radius: 12px;
        max-width: 800px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h2 {
        margin: 0;
    }

    .close-btn {
        background: none;
        color: #666;
        font-size: 1.5rem;
        padding: 0.25rem;
        width: 2rem;
        height: 2rem;
    }

    .modal-body {
        padding: 1.5rem;
    }

    .info-section {
        margin-bottom: 2rem;
    }

    .info-section h3 {
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #e0e0e0;
    }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }

    .status-badge {
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
    }

    .items-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .item-card {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e0e0e0;
    }

    .item-card img {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 6px;
    }

    .item-placeholder {
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #e0e0e0;
        border-radius: 6px;
        font-size: 0.8rem;
        color: #666;
    }

    .item-details h4 {
        margin: 0 0 0.5rem 0;
        color: #2c3e50;
    }

    .item-details p {
        margin: 0.25rem 0;
        font-size: 0.9rem;
        color: #666;
    }

    .modal-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-top: 1px solid #e0e0e0;
        background: #f8f9fa;
    }

    .status-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    @media (max-width: 768px) {
        .controls-section {
            flex-direction: column;
            align-items: stretch;
        }
        
        .filters {
            flex-direction: column;
        }
        
        .search-input {
            min-width: unset;
        }
        
        .info-grid {
            grid-template-columns: 1fr;
        }
        
        .item-card {
            flex-direction: column;
            text-align: center;
        }
        
        .modal-footer {
            flex-direction: column;
            gap: 1rem;
        }
    }
</style>