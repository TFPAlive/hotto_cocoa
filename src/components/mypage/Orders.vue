<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { auth } from '@/composables/useAuth'
import type { Order, OrderItem } from '@/types'

const loading = ref(false)
const error = ref<string | null>(null)
const orders = ref<Order[]>([])
const selectedOrder = ref<Order | null>(null)
const showOrderModal = ref(false)
const statusFilter = ref<string>('all')

const statusOptions = [
  { value: 'all', label: 'すべて', color: '#666' },
  { value: 'pending', label: '注文確認中', color: '#ff9800' },
  { value: 'processing', label: '準備中', color: '#2196f3' },
  { value: 'shipped', label: '配送中', color: '#9c27b0' },
  { value: 'delivered', label: '配送完了', color: '#4caf50' },
  { value: 'cancelled', label: 'キャンセル', color: '#f44336' }
]

const filteredOrders = computed(() => {
  if (statusFilter.value === 'all') {
    return orders.value
  }
  return orders.value.filter(order => order.status === statusFilter.value)
})

onMounted(() => {
  fetchOrders()
})

async function fetchOrders() {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch('/api/user/orders', {
      credentials: 'include'
    })
    
    if (!response.ok) throw new Error('Failed to fetch orders')
    
    const data = await response.json()
    orders.value = data
  } catch (err: any) {
    error.value = err.message || '注文履歴の取得に失敗しました'
  } finally {
    loading.value = false
  }
}

function getStatusColor(status: string) {
  const option = statusOptions.find(opt => opt.value === status)
  return option?.color || '#666'
}

function getStatusLabel(status: string) {
  const option = statusOptions.find(opt => opt.value === status)
  return option?.label || status
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  }).format(price)
}

function viewOrderDetails(order: Order) {
  selectedOrder.value = order
  showOrderModal.value = true
}

function closeOrderModal() {
  showOrderModal.value = false
  selectedOrder.value = null
}

async function reorder(order: Order) {
  try {
    const response = await fetch('/api/user/orders/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ orderid: order.orderid })
    })
    
    if (!response.ok) throw new Error('Failed to reorder')
    
    // Show success message or redirect to cart
    alert('商品をカートに追加しました')
  } catch (err: any) {
    alert(err.message || '再注文に失敗しました')
  }
}

async function cancelOrder(order: Order) {
  if (!confirm('この注文をキャンセルしますか？')) return
  
  try {
    const response = await fetch(`/api/user/orders/${order.orderid}/cancel`, {
      method: 'POST',
      credentials: 'include'
    })
    
    if (!response.ok) throw new Error('Failed to cancel order')
    
    // Update local state
    const index = orders.value.findIndex(o => o.orderid === order.orderid)
    if (index !== -1) {
      orders.value[index].status = 'cancelled'
    }
  } catch (err: any) {
    alert(err.message || '注文のキャンセルに失敗しました')
  }
}

function canCancelOrder(order: Order): boolean {
  return order.status === 'pending' || order.status === 'processing'
}

function canReorder(order: Order): boolean {
  return order.status === 'delivered' || order.status === 'cancelled'
}
</script>

<template>
  <div class="orders-container">
    <div class="orders-header">
      <h2>注文履歴</h2>
      <p>過去の注文を確認・管理できます</p>
    </div>

    <!-- Status Filter -->
    <div class="filter-section">
      <div class="filter-buttons">
        <button
          v-for="option in statusOptions"
          :key="option.value"
          class="filter-btn"
          :class="{ active: statusFilter === option.value }"
          @click="statusFilter = option.value"
        >
          {{ option.label }}
          <span v-if="option.value !== 'all'" class="count">
            ({{ orders.filter(o => o.status === option.value).length }})
          </span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>注文履歴を読み込み中...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary" @click="fetchOrders">再試行</button>
    </div>

    <div v-else-if="filteredOrders.length === 0" class="empty-state">
      <div class="empty-icon">📦</div>
      <h3>注文がありません</h3>
      <p v-if="statusFilter === 'all'">まだ注文履歴がありません</p>
      <p v-else>{{ getStatusLabel(statusFilter) }}の注文がありません</p>
      <router-link to="/" class="btn-primary">商品を見る</router-link>
    </div>

    <div v-else class="orders-list">
      <div
        v-for="order in filteredOrders"
        :key="order.orderid"
        class="order-card"
      >
        <div class="order-header">
          <div class="order-info">
            <h3>注文番号: #{{ order.orderid.toString().padStart(6, '0') }}</h3>
            <p class="order-date">{{ formatDate(order.created_at) }}</p>
          </div>
          <div class="order-status">
            <span 
              class="status-badge" 
              :style="{ backgroundColor: getStatusColor(order.status) }"
            >
              {{ getStatusLabel(order.status) }}
            </span>
          </div>
        </div>

        <div class="order-items">
          <div
            v-for="item in order.items.slice(0, 3)"
            :key="item.orderitemid"
            class="order-item"
          >
            <div class="item-image">
              <img v-if="item.imageurl" :src="item.imageurl" :alt="item.name" />
              <div v-else class="image-placeholder">📷</div>
            </div>
            <div class="item-details">
              <h4>{{ item.name }}</h4>
              <p>数量: {{ item.quantity }} × {{ formatPrice(item.price) }}</p>
            </div>
          </div>
          <div v-if="order.items.length > 3" class="more-items">
            他{{ order.items.length - 3 }}件
          </div>
        </div>

        <div class="order-footer">
          <div class="order-total">
            <strong>合計: {{ formatPrice(order.total) }}</strong>
          </div>
          <div class="order-actions">
            <button class="btn-secondary" @click="viewOrderDetails(order)">
              詳細を見る
            </button>
            <button 
              v-if="canReorder(order)"
              class="btn-primary" 
              @click="reorder(order)"
            >
              再注文
            </button>
            <button 
              v-if="canCancelOrder(order)"
              class="btn-danger" 
              @click="cancelOrder(order)"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Order Details Modal -->
    <div v-if="showOrderModal" class="modal-overlay" @click="closeOrderModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>注文詳細 - #{{ selectedOrder?.orderid.toString().padStart(6, '0') }}</h3>
          <button class="close-btn" @click="closeOrderModal">&times;</button>
        </div>
        
        <div v-if="selectedOrder" class="modal-body">
          <div class="detail-section">
            <h4>注文情報</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">注文日時:</span>
                <span class="value">{{ formatDate(selectedOrder.created_at) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">ステータス:</span>
                <span 
                  class="value status-badge" 
                  :style="{ backgroundColor: getStatusColor(selectedOrder.status) }"
                >
                  {{ getStatusLabel(selectedOrder.status) }}
                </span>
              </div>
              <div class="detail-item">
                <span class="label">配送先:</span>
                <span class="value">{{ selectedOrder.shipping_address }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>注文商品</h4>
            <div class="modal-items">
              <div
                v-for="item in selectedOrder.items"
                :key="item.orderitemid"
                class="modal-item"
              >
                <div class="item-image">
                  <img v-if="item.imageurl" :src="item.imageurl" :alt="item.name" />
                  <div v-else class="image-placeholder">📷</div>
                </div>
                <div class="item-details">
                  <h5>{{ item.name }}</h5>
                  <p>単価: {{ formatPrice(item.price) }}</p>
                  <p>数量: {{ item.quantity }}</p>
                </div>
                <div class="item-total">
                  {{ formatPrice(item.price * item.quantity) }}
                </div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <div class="order-summary">
              <div class="summary-row">
                <span>小計:</span>
                <span>{{ formatPrice(selectedOrder.total) }}</span>
              </div>
              <div class="summary-row total">
                <span>合計:</span>
                <span>{{ formatPrice(selectedOrder.total) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="closeOrderModal">閉じる</button>
          <button 
            v-if="selectedOrder && canReorder(selectedOrder)"
            class="btn-primary" 
            @click="reorder(selectedOrder)"
          >
            再注文
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-container {
  width: 100%;
}

.orders-header {
  margin-bottom: 32px;
  text-align: center;
}

.orders-header h2 {
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
}

.orders-header p {
  color: #666;
  font-size: 16px;
}

.filter-section {
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-btn {
  padding: 8px 16px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  border-color: #a0522d;
}

.filter-btn.active {
  background: #a0522d;
  color: white;
  border-color: #a0522d;
}

.count {
  font-size: 12px;
  opacity: 0.8;
}

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #a0522d;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.order-info h3 {
  color: #2c3e50;
  margin-bottom: 4px;
  font-size: 18px;
  font-weight: 600;
}

.order-date {
  color: #666;
  font-size: 14px;
}

.status-badge {
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.order-items {
  margin-bottom: 16px;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.item-image {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  font-size: 20px;
  color: #ccc;
}

.item-details h4 {
  color: #2c3e50;
  margin-bottom: 4px;
  font-size: 14px;
}

.item-details p {
  color: #666;
  font-size: 12px;
}

.more-items {
  color: #666;
  font-size: 12px;
  font-style: italic;
  margin-left: 60px;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
}

.order-total {
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.order-actions {
  display: flex;
  gap: 8px;
}

.btn-primary, .btn-secondary, .btn-danger {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #a0522d;
  color: white;
}

.btn-primary:hover {
  background: #8b4513;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #e0e0e0;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover {
  background: #d32f2f;
}

/* Modal Styles */
.modal-overlay {
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
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  color: #2c3e50;
  margin: 0;
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 4px;
}

.modal-body {
  padding: 20px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  color: #2c3e50;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}

.detail-grid {
  display: grid;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-item .label {
  color: #666;
  font-size: 14px;
}

.detail-item .value {
  color: #2c3e50;
  font-weight: 500;
  font-size: 14px;
}

.modal-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.modal-item .item-details {
  flex: 1;
}

.modal-item h5 {
  color: #2c3e50;
  margin-bottom: 4px;
  font-size: 14px;
}

.modal-item p {
  color: #666;
  font-size: 12px;
  margin-bottom: 2px;
}

.item-total {
  color: #2c3e50;
  font-weight: 600;
  font-size: 14px;
}

.order-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.summary-row.total {
  border-top: 1px solid #e0e0e0;
  padding-top: 8px;
  font-weight: 600;
  font-size: 16px;
  color: #2c3e50;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

@media (max-width: 768px) {
  .filter-buttons {
    justify-content: center;
  }
  
  .order-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .order-actions {
    justify-content: center;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>