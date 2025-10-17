<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { auth } from '@/composables/useAuth'
import type { Product, Drink, HistoryItem } from '@/types'

const loading = ref(false)
const error = ref<string | null>(null)
const history = ref<HistoryItem[]>([])
const activeTab = ref<'all' | 'products' | 'drinks'>('all')

onMounted(() => {
  fetchHistory()
})

async function fetchHistory() {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch('/api/user/history', {
      credentials: 'include'
    })
    
    if (!response.ok) throw new Error('Failed to fetch history')
    
    const data = await response.json()
    history.value = data
  } catch (err: any) {
    error.value = err.message || '履歴の取得に失敗しました'
  } finally {
    loading.value = false
  }
}

async function clearHistory() {
  if (!confirm('履歴をすべて削除しますか？')) return
  
  try {
    const response = await fetch('/api/user/history', {
      method: 'DELETE',
      credentials: 'include'
    })
    
    if (!response.ok) throw new Error('Failed to clear history')
    
    history.value = []
  } catch (err: any) {
    alert(err.message || '履歴の削除に失敗しました')
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    month: 'short',
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

const filteredHistory = computed(() => {
  if (activeTab.value === 'all') return history.value
  return history.value.filter(item => item.type === (activeTab.value === 'products' ? 'product' : 'drink'))
})
</script>

<template>
  <div class="history-container">
    <div class="history-header">
      <h2>閲覧履歴</h2>
      <p>最近見た商品・ドリンクの履歴</p>
    </div>

    <div class="history-controls">
      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button 
          class="tab-btn"
          :class="{ active: activeTab === 'all' }"
          @click="activeTab = 'all'"
        >
          すべて ({{ history.length }})
        </button>
        <button 
          class="tab-btn"
          :class="{ active: activeTab === 'products' }"
          @click="activeTab = 'products'"
        >
          商品 ({{ history.filter(h => h.type === 'product').length }})
        </button>
        <button 
          class="tab-btn"
          :class="{ active: activeTab === 'drinks' }"
          @click="activeTab = 'drinks'"
        >
          ドリンク ({{ history.filter(h => h.type === 'drink').length }})
        </button>
      </div>

      <button 
        v-if="history.length > 0"
        class="btn-danger" 
        @click="clearHistory"
      >
        履歴をクリア
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>履歴を読み込み中...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary" @click="fetchHistory">再試行</button>
    </div>

    <div v-else-if="filteredHistory.length === 0" class="empty-state">
      <div class="empty-icon">📱</div>
      <h3>履歴がありません</h3>
      <p>商品を見ると履歴に表示されます</p>
      <router-link to="/" class="btn-primary">商品を見る</router-link>
    </div>

    <div v-else class="history-list">
      <div
        v-for="item in filteredHistory"
        :key="item.historyid"
        class="history-item"
      >
        <div class="item-image">
          <img v-if="item.imageurl" :src="item.imageurl" :alt="item.name" />
          <div v-else class="image-placeholder">
            {{ item.type === 'drink' ? '🥤' : '📦' }}
          </div>
        </div>

        <div class="item-details">
          <div class="item-type">
            {{ item.type === 'drink' ? 'ドリンク' : '商品' }}
          </div>
          <h3>{{ item.name }}</h3>
          <div class="item-price">{{ formatPrice(item.price) }}</div>
        </div>

        <div class="item-meta">
          <div class="visit-count">{{ item.visit_count }}回閲覧</div>
          <div class="visit-date">{{ formatDate(item.visited_at) }}</div>
        </div>

        <div class="item-actions">
          <router-link 
            :to="item.type === 'drink' ? `/drinks/${item.itemid}` : `/products/${item.itemid}`"
            class="btn-secondary"
          >
            詳細を見る
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-container {
  width: 100%;
}

.history-header {
  margin-bottom: 32px;
  text-align: center;
}

.history-header h2 {
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
}

.history-header p {
  color: #666;
  font-size: 16px;
}

.history-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
}

.tab-navigation {
  display: flex;
  background: white;
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: #f5f5f5;
}

.tab-btn.active {
  background: #a0522d;
  color: white;
}

.btn-danger {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  background: #f44336;
  color: white;
  transition: all 0.2s ease;
}

.btn-danger:hover {
  background: #d32f2f;
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

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.item-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  font-size: 24px;
  color: #ccc;
}

.item-details {
  flex: 1;
}

.item-type {
  color: #a0522d;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.item-details h3 {
  color: #2c3e50;
  margin-bottom: 4px;
  font-size: 16px;
  font-weight: 600;
}

.item-price {
  color: #a0522d;
  font-size: 14px;
  font-weight: 600;
}

.item-meta {
  text-align: right;
  color: #666;
  font-size: 12px;
}

.visit-count {
  margin-bottom: 2px;
  font-weight: 500;
}

.visit-date {
  color: #999;
}

.item-actions {
  flex-shrink: 0;
}

.btn-secondary {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  background: #f5f5f5;
  color: #666;
  border-radius: 6px;
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-block;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-primary {
  padding: 12px 24px;
  border: none;
  background: #a0522d;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-block;
}

.btn-primary:hover {
  background: #8b4513;
}

@media (max-width: 768px) {
  .history-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .tab-navigation {
    order: 1;
  }
  
  .btn-danger {
    order: 2;
    align-self: center;
  }
  
  .history-item {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .item-meta {
    text-align: center;
  }
}
</style>