<script setup lang="ts">
    import { onMounted, ref } from 'vue'

    const stats = ref({
        orders: 0,
        products: 0,
        users: 0,
        revenue: 0
    });
    const recentOrders = ref<any[]>([]);
    const loading = ref(true)
    const error = ref<string | null>(null)

    onMounted(async () => {
        try {
            loading.value = true
            const res = await fetch('/api/admin/dashboard')
            if (!res.ok) throw new Error('Failed to load dashboard')
            const body = await res.json()
            stats.value = body.stats || stats.value
            recentOrders.value = body.recentOrders || []
        } catch (err: any) {
            console.error('Failed to fetch dashboard', err)
            error.value = err?.message || String(err)
        } finally {
            loading.value = false
        }
    })
</script>

<template>
    <div class="admin-dashboard">
        <h1>Admin Dashboard</h1>
        <div class="stats">
            <div class="stat-card">
                <h2>{{ stats.orders }}</h2>
                <p>Orders</p>
            </div>
            <div class="stat-card">
                <h2>{{ stats.products }}</h2>
                <p>Products</p>
            </div>
            <div class="stat-card">
                <h2>{{ stats.users }}</h2>
                <p>Users</p>
            </div>
            <div class="stat-card">
                <h2>${{ stats.revenue }}</h2>
                <p>Revenue</p>
            </div>
        </div>
        <div class="recent-orders">
            <h2>Recent Orders</h2>
            <table>
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>User</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="order in recentOrders" :key="order.orderid">
                        <td>{{ order.orderid }}</td>
                        <td>{{ order.username || '—' }}</td>
                        <td>${{ order.totalamount }}</td>
                        <td>{{ order.status }}</td>
                        <td>{{ order.date }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
<style scoped>
    .admin-dashboard {
        padding: 2rem;
        font-family: Arial, sans-serif;
    }
    .stats {
        display: flex;
        gap: 2rem;
        margin-bottom: 2rem;
    }
    .stat-card {
        background: #f5f5f5;
        padding: 1.5rem;
        border-radius: 8px;
        text-align: center;
        flex: 1;
    }
    .stat-card h2 {
        margin: 0;
        font-size: 2rem;
        color: #333;
    }
    .stat-card p {
        margin: 0.5rem 0 0 0;
        color: #777;
    }
    .recent-orders {
        margin-top: 2rem;
    }
    .recent-orders table {
        width: 100%;
        border-collapse: collapse;
    }
    .recent-orders th, .recent-orders td {
        padding: 0.75rem;
        border-bottom: 1px solid #ddd;
        text-align: left;
    }
    .recent-orders th {
    background: #f0f0f0;
}
</style>