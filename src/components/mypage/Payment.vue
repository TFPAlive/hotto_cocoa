<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { auth } from '@/composables/useAuth'
import type { PaymentMethod } from '@/types'

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const paymentMethods = ref<PaymentMethod[]>([])
const showAddModal = ref(false)

const newPayment = ref({
  type: 'credit_card' as const,
  provider: '',
  card_number: '',
  expiry_month: '',
  expiry_year: '',
  cvv: '',
  cardholder_name: '',
  is_default: false
})

const paymentTypes = [
  { value: 'credit_card', label: 'クレジットカード', icon: '💳' },
  { value: 'paypal', label: 'PayPal', icon: '🅿️' },
  { value: 'bank_transfer', label: '銀行振込', icon: '🏦' }
]

onMounted(() => {
  fetchPaymentMethods()
})

async function fetchPaymentMethods() {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch('/api/user/payment-methods', {
      credentials: 'include'
    })
    
    if (!response.ok) throw new Error('Failed to fetch payment methods')
    
    const data = await response.json()
    paymentMethods.value = data
  } catch (err: any) {
    error.value = err.message || '支払い方法の取得に失敗しました'
  } finally {
    loading.value = false
  }
}

async function addPaymentMethod() {
  saving.value = true
  error.value = null
  
  try {
    const response = await fetch('/api/user/payment-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newPayment.value)
    })
    
    if (!response.ok) throw new Error('Failed to add payment method')
    
    await fetchPaymentMethods()
    closeAddModal()
  } catch (err: any) {
    error.value = err.message || '支払い方法の追加に失敗しました'
  } finally {
    saving.value = false
  }
}

async function setDefaultPayment(paymentMethod: PaymentMethod) {
  try {
    const response = await fetch(`/api/user/payment-methods/${paymentMethod.paymentid}/default`, {
      method: 'PUT',
      credentials: 'include'
    })
    
    if (!response.ok) throw new Error('Failed to set default payment method')
    
    // Update local state
    paymentMethods.value.forEach(pm => {
      pm.is_default = pm.paymentid === paymentMethod.paymentid
    })
  } catch (err: any) {
    alert(err.message || 'デフォルト設定に失敗しました')
  }
}

async function deletePaymentMethod(paymentMethod: PaymentMethod) {
  if (!confirm('この支払い方法を削除しますか？')) return
  
  try {
    const response = await fetch(`/api/user/payment-methods/${paymentMethod.paymentid}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    
    if (!response.ok) throw new Error('Failed to delete payment method')
    
    paymentMethods.value = paymentMethods.value.filter(pm => pm.paymentid !== paymentMethod.paymentid)
  } catch (err: any) {
    alert(err.message || '支払い方法の削除に失敗しました')
  }
}

function openAddModal() {
  showAddModal.value = true
}

function closeAddModal() {
  showAddModal.value = false
  newPayment.value = {
    type: 'credit_card',
    provider: '',
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    cardholder_name: '',
    is_default: false
  }
  error.value = null
}

function getPaymentTypeInfo(type: string) {
  return paymentTypes.find(pt => pt.value === type) || paymentTypes[0]
}

function formatCardNumber(number: string) {
  return `**** **** **** ${number}`
}

function formatExpiryDate(month?: number, year?: number) {
  if (!month || !year) return 'N/A'
  return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`
}
</script>

<template>
  <div class="payment-container">
    <div class="payment-header">
      <h2>支払い方法</h2>
      <p>支払い方法を管理します</p>
    </div>

    <div class="payment-controls">
      <button class="btn-primary" @click="openAddModal">
        <span>+</span> 支払い方法を追加
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>支払い方法を読み込み中...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary" @click="fetchPaymentMethods">再試行</button>
    </div>

    <div v-else-if="paymentMethods.length === 0" class="empty-state">
      <div class="empty-icon">💳</div>
      <h3>支払い方法が登録されていません</h3>
      <p>支払い方法を追加してください</p>
      <button class="btn-primary" @click="openAddModal">追加する</button>
    </div>

    <div v-else class="payment-list">
      <div
        v-for="method in paymentMethods"
        :key="method.paymentid"
        class="payment-card"
        :class="{ default: method.is_default }"
      >
        <div class="payment-header-card">
          <div class="payment-info">
            <div class="payment-type">
              <span class="type-icon">{{ getPaymentTypeInfo(method.type).icon }}</span>
              <span class="type-label">{{ getPaymentTypeInfo(method.type).label }}</span>
            </div>
            <div v-if="method.is_default" class="default-badge">デフォルト</div>
          </div>
        </div>

        <div class="payment-details">
          <div v-if="method.type === 'credit_card'" class="card-details">
            <div class="card-number">{{ formatCardNumber(method.last_four || '0000') }}</div>
            <div class="card-info">
              <span class="cardholder">{{ method.cardholder_name || 'N/A' }}</span>
              <span class="expiry">{{ formatExpiryDate(method.expiry_month, method.expiry_year) }}</span>
            </div>
            <div class="card-provider">{{ method.provider }}</div>
          </div>
          <div v-else-if="method.type === 'paypal'" class="paypal-details">
            <div class="provider">PayPal アカウント</div>
          </div>
          <div v-else class="bank-details">
            <div class="provider">{{ method.provider || '銀行振込' }}</div>
          </div>
        </div>

        <div class="payment-actions">
          <button 
            v-if="!method.is_default"
            class="btn-secondary" 
            @click="setDefaultPayment(method)"
          >
            デフォルトに設定
          </button>
          <button 
            class="btn-danger" 
            @click="deletePaymentMethod(method)"
            :disabled="method.is_default && paymentMethods.length === 1"
          >
            削除
          </button>
        </div>
      </div>
    </div>

    <!-- Add Payment Method Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>支払い方法を追加</h3>
          <button class="close-btn" @click="closeAddModal">&times;</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="addPaymentMethod">
            <div class="form-row">
              <label>支払い方法 *</label>
              <div class="payment-type-selector">
                <label
                  v-for="type in paymentTypes"
                  :key="type.value"
                  class="type-option"
                  :class="{ active: newPayment.type === type.value }"
                >
                  <input 
                    v-model="newPayment.type" 
                    type="radio" 
                    :value="type.value"
                    style="display: none"
                  />
                  <span class="type-icon">{{ type.icon }}</span>
                  <span class="type-label">{{ type.label }}</span>
                </label>
              </div>
            </div>

            <div v-if="newPayment.type === 'credit_card'" class="card-form">
              <div class="form-row">
                <label for="card_number">カード番号 *</label>
                <input 
                  id="card_number"
                  v-model="newPayment.card_number"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  maxlength="19"
                  required
                />
              </div>

              <div class="form-grid">
                <div class="form-row">
                  <label for="expiry_month">有効期限 (月) *</label>
                  <select id="expiry_month" v-model="newPayment.expiry_month" required>
                    <option value="">選択</option>
                    <option v-for="month in 12" :key="month" :value="month">
                      {{ month.toString().padStart(2, '0') }}
                    </option>
                  </select>
                </div>
                
                <div class="form-row">
                  <label for="expiry_year">有効期限 (年) *</label>
                  <select id="expiry_year" v-model="newPayment.expiry_year" required>
                    <option value="">選択</option>
                    <option v-for="year in 10" :key="year" :value="new Date().getFullYear() + year - 1">
                      {{ new Date().getFullYear() + year - 1 }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-row">
                  <label for="cvv">CVV *</label>
                  <input 
                    id="cvv"
                    v-model="newPayment.cvv"
                    type="text"
                    placeholder="123"
                    maxlength="4"
                    required
                  />
                </div>
                
                <div class="form-row">
                  <label for="provider">カード会社</label>
                  <input 
                    id="provider"
                    v-model="newPayment.provider"
                    type="text"
                    placeholder="Visa, MasterCard など"
                  />
                </div>
              </div>

              <div class="form-row">
                <label for="cardholder_name">カード名義人 *</label>
                <input 
                  id="cardholder_name"
                  v-model="newPayment.cardholder_name"
                  type="text"
                  placeholder="TARO TANAKA"
                  required
                />
              </div>
            </div>

            <div class="form-row checkbox-row">
              <label>
                <input type="checkbox" v-model="newPayment.is_default" />
                デフォルトの支払い方法として設定
              </label>
            </div>

            <div v-if="error" class="error-message">
              {{ error }}
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="closeAddModal">キャンセル</button>
          <button 
            class="btn-primary" 
            @click="addPaymentMethod"
            :disabled="saving"
          >
            <span v-if="saving">追加中...</span>
            <span v-else>追加</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.payment-container {
  width: 100%;
}

.payment-header {
  margin-bottom: 32px;
  text-align: center;
}

.payment-header h2 {
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
}

.payment-header p {
  color: #666;
  font-size: 16px;
}

.payment-controls {
  margin-bottom: 24px;
  text-align: right;
}

.btn-primary {
  background: #a0522d;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  background: #8b4513;
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.payment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.payment-card {
  background: white;
  border: 2px solid #e3f2fd;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.payment-card.default {
  border-color: #4caf50;
  background: linear-gradient(135deg, #f8fff8 0%, #e8f5e8 100%);
}

.payment-header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.payment-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.payment-type {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-icon {
  font-size: 20px;
}

.type-label {
  font-weight: 600;
  color: #2c3e50;
}

.default-badge {
  background: #4caf50;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.payment-details {
  margin-bottom: 16px;
}

.card-details .card-number {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
  font-family: 'Courier New', monospace;
}

.card-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.cardholder {
  color: #666;
  font-size: 14px;
}

.expiry {
  color: #666;
  font-size: 14px;
}

.card-provider, .provider {
  color: #a0522d;
  font-weight: 600;
  font-size: 14px;
}

.payment-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-secondary, .btn-danger {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
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

.btn-danger:hover:not(:disabled) {
  background: #d32f2f;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
.form-row select {
  width: -webkit-fill-available;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-row input:focus,
.form-row select:focus {
  outline: none;
  border-color: #a0522d;
  box-shadow: 0 0 0 3px rgba(160, 82, 45, 0.1);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.payment-type-selector {
  display: flex;
  gap: 8px;
}

.type-option {
  flex: 1;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.type-option:hover {
  border-color: #a0522d;
}

.type-option.active {
  border-color: #a0522d;
  background: rgba(160, 82, 45, 0.1);
}

.checkbox-row {
  display: flex !important;
  flex-direction: row !important;
  align-items: center;
  gap: 8px;
}

.checkbox-row input[type="checkbox"] {
  width: auto !important;
  margin: 0;
}

.checkbox-row label {
  margin: 0 !important;
  cursor: pointer;
  font-size: 14px;
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
  .payment-controls {
    text-align: center;
  }
  
  .payment-actions {
    justify-content: center;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .payment-type-selector {
    flex-direction: column;
  }
}
</style>