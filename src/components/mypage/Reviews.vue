<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { auth } from '@/composables/useAuth'
import type { Review } from '@/types'

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const reviews = ref<Review[]>([])
const editingReview = ref<Review | null>(null)
const showEditModal = ref(false)
const statusFilter = ref<string>('all')

const editForm = ref({
  rating: 5,
  title: '',
  comment: ''
})

const statusOptions = [
  { value: 'all', label: 'すべて', color: '#666' },
  { value: 'pending', label: '承認待ち', color: '#ff9800' },
  { value: 'approved', label: '公開中', color: '#4caf50' },
  { value: 'rejected', label: '非承認', color: '#f44336' }
]

const filteredReviews = computed(() => {
  if (statusFilter.value === 'all') {
    return reviews.value
  }
  return reviews.value.filter(review => review.status === statusFilter.value)
})

const averageRating = computed(() => {
  if (reviews.value.length === 0) return 0
  const sum = reviews.value.reduce((acc, review) => acc + review.rating, 0)
  return (sum / reviews.value.length).toFixed(1)
})

onMounted(() => {
  fetchReviews()
})

async function fetchReviews() {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch('/api/user/reviews', {
      credentials: 'include'
    })
    
    if (!response.ok) throw new Error('Failed to fetch reviews')
    
    const data = await response.json()
    reviews.value = data
  } catch (err: any) {
    error.value = err.message || 'レビューの取得に失敗しました'
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
    day: 'numeric'
  })
}

function renderStars(rating: number) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

function openEditModal(review: Review) {
  editingReview.value = review
  editForm.value = {
    rating: review.rating,
    title: review.title,
    comment: review.comment
  }
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editingReview.value = null
  editForm.value = {
    rating: 5,
    title: '',
    comment: ''
  }
}

async function saveReview() {
  if (!editingReview.value) return
  
  saving.value = true
  error.value = null
  
  try {
    const response = await fetch(`/api/user/reviews/${editingReview.value.reviewid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(editForm.value)
    })
    
    if (!response.ok) throw new Error('Failed to update review')
    
    const updatedReview = await response.json()
    
    // Update local state
    const index = reviews.value.findIndex(r => r.reviewid === editingReview.value!.reviewid)
    if (index !== -1) {
      reviews.value[index] = { ...reviews.value[index], ...updatedReview }
    }
    
    closeEditModal()
  } catch (err: any) {
    error.value = err.message || 'レビューの更新に失敗しました'
  } finally {
    saving.value = false
  }
}

async function deleteReview(review: Review) {
  if (!confirm('このレビューを削除しますか？')) return
  
  try {
    const response = await fetch(`/api/user/reviews/${review.reviewid}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    
    if (!response.ok) throw new Error('Failed to delete review')
    
    // Remove from local state
    reviews.value = reviews.value.filter(r => r.reviewid !== review.reviewid)
  } catch (err: any) {
    alert(err.message || 'レビューの削除に失敗しました')
  }
}

function canEdit(review: Review): boolean {
  return review.status === 'pending' || review.status === 'rejected'
}

function setRating(rating: number) {
  editForm.value.rating = rating
}
</script>

<template>
  <div class="reviews-container">
    <div class="reviews-header">
      <h2>レビュー管理</h2>
      <p>投稿したレビューを管理できます</p>
    </div>

    <!-- Review Stats -->
    <div class="review-stats">
      <div class="stat-item">
        <div class="stat-number">{{ reviews.length }}</div>
        <div class="stat-label">総レビュー数</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ averageRating }}</div>
        <div class="stat-label">平均評価</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ reviews.filter(r => r.status === 'approved').length }}</div>
        <div class="stat-label">公開中</div>
      </div>
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
            ({{ reviews.filter(r => r.status === option.value).length }})
          </span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>レビューを読み込み中...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary" @click="fetchReviews">再試行</button>
    </div>

    <div v-else-if="filteredReviews.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <h3>レビューがありません</h3>
      <p v-if="statusFilter === 'all'">まだレビューを投稿していません</p>
      <p v-else>{{ getStatusLabel(statusFilter) }}のレビューがありません</p>
    </div>

    <div v-else class="reviews-list">
      <div
        v-for="review in filteredReviews"
        :key="review.reviewid"
        class="review-card"
      >
        <div class="review-header">
          <div class="review-info">
            <div class="product-info">
              <img 
                v-if="review.drink_image || review.product_image" 
                :src="review.drink_image || review.product_image" 
                :alt="review.drink_name || review.product_name"
                class="product-image"
              />
              <div class="product-details">
                <h4>{{ review.drink_name || review.product_name || '商品名不明' }}</h4>
                <div class="rating-display">
                  {{ renderStars(review.rating) }}
                  <span class="rating-number">({{ review.rating }}/5)</span>
                </div>
              </div>
            </div>
          </div>
          <div class="review-status">
            <span 
              class="status-badge" 
              :style="{ backgroundColor: getStatusColor(review.status) }"
            >
              {{ getStatusLabel(review.status) }}
            </span>
          </div>
        </div>

        <div class="review-content">
          <h3>{{ review.title }}</h3>
          <p>{{ review.comment }}</p>
        </div>

        <div class="review-footer">
          <div class="review-date">
            投稿日: {{ formatDate(review.created_at) }}
            <span v-if="review.updated_at !== review.created_at">
              (編集日: {{ formatDate(review.updated_at) }})
            </span>
          </div>
          <div class="review-actions">
            <button 
              v-if="canEdit(review)"
              class="btn-secondary" 
              @click="openEditModal(review)"
            >
              編集
            </button>
            <button 
              class="btn-danger" 
              @click="deleteReview(review)"
            >
              削除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Review Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>レビューを編集</h3>
          <button class="close-btn" @click="closeEditModal">&times;</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveReview">
            <div class="form-row">
              <label>評価 *</label>
              <div class="rating-input">
                <button
                  v-for="n in 5"
                  :key="n"
                  type="button"
                  class="star-btn"
                  :class="{ active: n <= editForm.rating }"
                  @click="setRating(n)"
                >
                  ★
                </button>
                <span class="rating-text">{{ editForm.rating }}/5</span>
              </div>
            </div>

            <div class="form-row">
              <label for="title">タイトル *</label>
              <input 
                id="title"
                v-model="editForm.title"
                type="text"
                required
                placeholder="レビューのタイトルを入力"
                maxlength="100"
              />
            </div>

            <div class="form-row">
              <label for="comment">コメント *</label>
              <textarea 
                id="comment"
                v-model="editForm.comment"
                required
                placeholder="商品の感想を詳しく教えてください"
                rows="5"
                maxlength="1000"
              ></textarea>
              <div class="char-count">{{ editForm.comment.length }}/1000</div>
            </div>

            <div v-if="error" class="error-message">
              {{ error }}
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="closeEditModal">キャンセル</button>
          <button 
            class="btn-primary" 
            @click="saveReview"
            :disabled="saving || !editForm.title.trim() || !editForm.comment.trim()"
          >
            <span v-if="saving">保存中...</span>
            <span v-else>保存</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reviews-container {
  width: 100%;
}

.reviews-header {
  margin-bottom: 32px;
  text-align: center;
}

.reviews-header h2 {
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
}

.reviews-header p {
  color: #666;
  font-size: 16px;
}

.review-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  justify-content: center;
}

.stat-item {
  background: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 120px;
}

.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #a0522d;
  margin-bottom: 4px;
}

.stat-label {
  color: #666;
  font-size: 14px;
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
  justify-content: center;
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

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.review-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-image {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
}

.product-details h4 {
  color: #2c3e50;
  margin-bottom: 4px;
  font-size: 16px;
  font-weight: 600;
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ff9800;
  font-size: 16px;
}

.rating-number {
  color: var(--font-color);
  font-size: 12px;
}

.status-badge {
  color: var(--main-bg-color);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.review-content h3 {
  color: var(--header-color);
  margin-bottom: 8px;
  font-size: 18px;
  font-weight: 600;
}

.review-content p {
  color: var(--font-color);
  line-height: 1.6;
  margin-bottom: 16px;
}

.review-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--shadow-color);
}

.review-date {
  color: var(--font-color);
  font-size: 12px;
}

.review-actions {
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

.btn-primary:hover:not(:disabled) {
  background: #8b4513;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  max-width: 500px;
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

.form-row {
  margin-bottom: 20px;
}

.form-row label {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
  font-weight: 500;
  font-size: 14px;
}

.form-row input,
.form-row textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-row input:focus,
.form-row textarea:focus {
  outline: none;
  border-color: #a0522d;
  box-shadow: 0 0 0 3px rgba(160, 82, 45, 0.1);
}

.rating-input {
  display: flex;
  align-items: center;
  gap: 4px;
}

.star-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #e0e0e0;
  cursor: pointer;
  transition: color 0.2s ease;
}

.star-btn.active {
  color: #ff9800;
}

.star-btn:hover {
  color: #ff9800;
}

.rating-text {
  margin-left: 8px;
  color: #666;
  font-size: 14px;
}

.char-count {
  text-align: right;
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}

.error-message {
  color: #f44336;
  background: #ffebee;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  margin-top: 12px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

@media (max-width: 768px) {
  .review-stats {
    flex-direction: column;
  }
  
  .filter-buttons {
    justify-content: center;
  }
  
  .review-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .review-actions {
    justify-content: center;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .product-info {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>