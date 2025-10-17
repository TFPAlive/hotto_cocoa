<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { auth } from '@/composables/useAuth'
import type { Product, Drink, FavoriteItem } from '@/types'

const loading = ref(false)
const error = ref<string | null>(null)
const favorites = ref<FavoriteItem[]>([])
const activeTab = ref<'all' | 'products' | 'drinks'>('all')

onMounted(() => {
  fetchFavorites()
})

async function fetchFavorites() {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch('/api/user/favorites', {
      credentials: 'include'
    })
    
    if (!response.ok) throw new Error('Failed to fetch favorites')
    
    const data = await response.json()
    favorites.value = data
  } catch (err: any) {
    error.value = err.message || 'お気に入りの取得に失敗しました'
  } finally {
    loading.value = false
  }
}

async function removeFavorite(item: FavoriteItem) {
  if (!confirm('お気に入りから削除しますか？')) return
  
  try {
    const response = await fetch(`/api/user/favorites/${item.favoriteid}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    
    if (!response.ok) throw new Error('Failed to remove favorite')
    
    // Remove from local state
    favorites.value = favorites.value.filter(f => f.favoriteid !== item.favoriteid)
  } catch (err: any) {
    alert(err.message || 'お気に入りの削除に失敗しました')
  }
}

async function addToCart(item: FavoriteItem) {
  try {
    const response = await fetch('/api/user/cart?action=add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        [item.type === 'drink' ? 'drinkid' : 'productid']: item.itemid,
        userid: auth.user?.userid
      })
    })
    
    if (!response.ok) throw new Error('Failed to add to cart')
    
    alert('カートに追加しました')
  } catch (err: any) {
    alert(err.message || 'カートへの追加に失敗しました')
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ja-JP')
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  }).format(price)
}

const filteredFavorites = computed(() => {
  if (activeTab.value === 'all') return favorites.value
  return favorites.value.filter(item => item.type === (activeTab.value === 'products' ? 'product' : 'drink'))
})
</script>

<template>
  <div class="favorites-container">
    <div class="favorites-header">
      <h2>お気に入り</h2>
      <p>気に入った商品やドリンクをまとめて管理</p>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button 
        class="tab-btn"
        :class="{ active: activeTab === 'all' }"
        @click="activeTab = 'all'"
      >
        すべて ({{ favorites.length }})
      </button>
      <button 
        class="tab-btn"
        :class="{ active: activeTab === 'products' }"
        @click="activeTab = 'products'"
      >
        商品 ({{ favorites.filter(f => f.type === 'product').length }})
      </button>
      <button 
        class="tab-btn"
        :class="{ active: activeTab === 'drinks' }"
        @click="activeTab = 'drinks'"
      >
        ドリンク ({{ favorites.filter(f => f.type === 'drink').length }})
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>お気に入りを読み込み中...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary" @click="fetchFavorites">再試行</button>
    </div>

    <div v-else-if="filteredFavorites.length === 0" class="empty-state">
      <div class="empty-icon">💖</div>
      <h3>お気に入りがありません</h3>
      <p v-if="activeTab === 'all'">まだお気に入りに追加していません</p>
      <p v-else-if="activeTab === 'products'">お気に入りの商品がありません</p>
      <p v-else>お気に入りのドリンクがありません</p>
      <router-link to="/" class="btn-primary">商品を見る</router-link>
    </div>

    <div v-else class="favorites-grid">
      <div
        v-for="item in filteredFavorites"
        :key="item.favoriteid"
        class="favorite-card"
      >
        <div class="item-image">
          <img v-if="item.imageurl" :src="item.imageurl" :alt="item.name" />
          <div v-else class="image-placeholder">
            {{ item.type === 'drink' ? '🥤' : '📦' }}
          </div>
          <div class="type-badge">
            {{ item.type === 'drink' ? 'ドリンク' : '商品' }}
          </div>
        </div>

        <div class="item-details">
          <h3>{{ item.name }}</h3>
          <p v-if="item.description" class="item-description">
            {{ item.description.substring(0, 100) }}{{ item.description.length > 100 ? '...' : '' }}
          </p>
          <div class="item-price">{{ formatPrice(item.price) }}</div>
          <div class="item-date">
            {{ formatDate(item.created_at) }}に追加
          </div>
        </div>

        <div class="item-actions">
          <button class="btn-primary" @click="addToCart(item)">
            カートに追加
          </button>
          <button class="btn-danger" @click="removeFavorite(item)">
            削除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.favorites-container {
  width: 100%;
}

.favorites-header {
  margin-bottom: 32px;
  text-align: center;
}

.favorites-header h2 {
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
}

.favorites-header p {
  color: #666;
  font-size: 16px;
}

.tab-navigation {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
  background: white;
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tab-btn {
  flex: 1;
  padding: 12px 16px;
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

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.favorite-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.favorite-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.item-image {
  position: relative;
  height: 180px;
  overflow: hidden;
  background: #f8f9fa;
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
  font-size: 48px;
  color: #ccc;
}

.type-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(160, 82, 45, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.item-details {
  padding: 16px;
}

.item-details h3 {
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 600;
}

.item-description {
  color: #666;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 8px;
}

.item-price {
  color: #a0522d;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.item-date {
  color: #999;
  font-size: 12px;
}

.item-actions {
  padding: 12px 16px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 8px;
}

.btn-primary, .btn-secondary, .btn-danger {
  flex: 1;
  padding: 8px 12px;
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

@media (max-width: 768px) {
  .favorites-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
  }
  
  .tab-navigation {
    flex-direction: column;
  }
  
  .item-actions {
    flex-direction: column;
  }
}
</style>