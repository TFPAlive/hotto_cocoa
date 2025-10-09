<script setup lang="ts">
import { ref } from 'vue'

interface Address {
  id: number;
  name: string;
  postalCode: string;
  prefecture: string;
  city: string;
  town: string;
  building?: string;
  phoneNumber: string;
  isDefault: boolean;
}

const addresses = ref<Address[]>([
  {
    id: 1,
    name: "田中 太郎",
    postalCode: "100-0001",
    prefecture: "東京都",
    city: "千代田区",
    town: "千代田1-1-1",
    building: "千代田マンション 302号室",
    phoneNumber: "03-1234-5678",
    isDefault: true
  }
])

const showAddressForm = ref(false)
const editingAddress = ref<Address | null>(null)
const newAddress = ref<Address>({
  id: 0,
  name: "",
  postalCode: "",
  prefecture: "",
  city: "",
  town: "",
  building: "",
  phoneNumber: "",
  isDefault: false
})

const prefectures = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
]

function openAddForm() {
  editingAddress.value = null
  newAddress.value = {
    id: 0,
    name: "",
    postalCode: "",
    prefecture: "",
    city: "",
    town: "",
    building: "",
    phoneNumber: "",
    isDefault: false
  }
  showAddressForm.value = true
}

function openEditForm(address: Address) {
  editingAddress.value = address
  newAddress.value = { ...address }
  showAddressForm.value = true
}

function closeForm() {
  showAddressForm.value = false
  editingAddress.value = null
}

function saveAddress() {
  if (editingAddress.value) {
    // Edit existing address
    const index = addresses.value.findIndex(addr => addr.id === editingAddress.value!.id)
    if (index !== -1) {
      addresses.value[index] = { ...newAddress.value }
    }
  } else {
    // Add new address
    newAddress.value.id = Date.now()
    addresses.value.push({ ...newAddress.value })
  }
  
  // If this is set as default, remove default from others
  if (newAddress.value.isDefault) {
    addresses.value.forEach(addr => {
      if (addr.id !== newAddress.value.id) {
        addr.isDefault = false
      }
    })
  }
  
  closeForm()
}

function deleteAddress(id: number) {
  if (confirm('この住所を削除しますか？')) {
    addresses.value = addresses.value.filter(addr => addr.id !== id)
  }
}

function setAsDefault(id: number) {
  addresses.value.forEach(addr => {
    addr.isDefault = addr.id === id
  })
}

function formatPostalCode(value: string) {
  // Format as XXX-XXXX
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length >= 4) {
    return cleaned.slice(0, 3) + '-' + cleaned.slice(3, 7)
  }
  return cleaned
}

function formatPhoneNumber(value: string) {
  // Format as XX-XXXX-XXXX or XXX-XXX-XXXX
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return cleaned.slice(0, 2) + '-' + cleaned.slice(2, 6) + '-' + cleaned.slice(6)
  } else if (cleaned.length === 11) {
    return cleaned.slice(0, 3) + '-' + cleaned.slice(3, 7) + '-' + cleaned.slice(7)
  }
  return cleaned
}

function onPostalCodeInput(event: Event) {
  const target = event.target as HTMLInputElement
  const cleaned = target.value.replace(/\D/g, '')
  
  // Console.log when there are exactly 7 numbers
  if (cleaned.length === 7) {
    console.log('Zip code:', cleaned)
    fetchAddressData(cleaned)
  }
  
  newAddress.value.postalCode = formatPostalCode(target.value)
}

async function fetchAddressData(postalCode: string) {
  try {
    const response = await fetch(`https://jp-postal-code-api.ttskch.com/api/v1/${postalCode}.json`)
    
    if (!response.ok) {
      console.error('Failed to fetch address data:', response.status)
      return
    }
    
    const data = await response.json()
    
    if (data.addresses && data.addresses.length > 0) {
      const addressInfo = data.addresses[0].ja
      
      // Auto-fill the form fields
      newAddress.value.prefecture = addressInfo.prefecture || ''
      newAddress.value.city = addressInfo.address1 || ''
      newAddress.value.town = `${addressInfo.address2 || ''}${addressInfo.address3 || ''}`.trim()
      
      console.log('Address auto-filled:', {
        prefecture: addressInfo.prefecture,
        city: addressInfo.address1,
        town: `${addressInfo.address2 || ''}${addressInfo.address3 || ''}`.trim()
      })
    } else {
      console.log('No address data found for postal code:', postalCode)
    }
  } catch (error) {
    console.error('Error fetching address data:', error)
  }
}

function onPhoneNumberInput(event: Event) {
  const target = event.target as HTMLInputElement
  newAddress.value.phoneNumber = formatPhoneNumber(target.value)
}
</script>

<template>
  <div class="address-container">
    <div class="main-content" :class="{ 'slide-left': showAddressForm }">
      <div class="address-header">
        <h2>配送先住所</h2>
        <button class="add-address-btn" @click="openAddForm">
          <span>+</span> 新しい住所を追加
        </button>
      </div>
      
      <div class="address-list">
        <div 
          v-for="address in addresses" 
          :key="address.id" 
          class="address-card"
          :class="{ default: address.isDefault }"
        >
          <div class="address-header-card">
            <div class="address-name">{{ address.name }}</div>
            <div class="address-actions">
              <button class="edit-btn" @click="openEditForm(address)">編集</button>
              <button 
                class="delete-btn" 
                @click="deleteAddress(address.id)"
                :disabled="address.isDefault"
              >
                削除
              </button>
            </div>
          </div>
          
          <div class="address-details">
            <div class="postal-code">〒{{ address.postalCode }}</div>
            <div class="address-line">
              {{ address.prefecture }}{{ address.city }}{{ address.town }}
            </div>
            <div v-if="address.building" class="building">{{ address.building }}</div>
            <div class="phone">TEL: {{ address.phoneNumber }}</div>
          </div>
          
          <div class="address-footer">
            <div v-if="address.isDefault" class="default-badge">
              デフォルト配送先
            </div>
            <button 
              v-else 
              class="set-default-btn" 
              @click="setAsDefault(address.id)"
            >
              デフォルトに設定
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-overlay" :class="{ 'slide-in': showAddressForm }">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingAddress ? '住所を編集' : '新しい住所を追加' }}</h3>
          <button class="close-btn" @click="closeForm">&times;</button>
        </div>
        
        <form @submit.prevent="saveAddress" class="address-form">
          <div class="form-row">
            <label for="name">お名前 *</label>
            <input 
              id="name"
              v-model="newAddress.name"
              type="text"
              placeholder="田中 太郎"
              required
            />
          </div>
          
          <div class="form-row">
            <label for="postalCode">郵便番号 *</label>
            <input 
              id="postalCode"
              v-model="newAddress.postalCode"
              type="text"
              placeholder="100-0001"
              maxlength="8"
              @input="onPostalCodeInput"
              required
            />
          </div>
          
          <div class="form-row">
            <label for="prefecture">都道府県 *</label>
            <select id="prefecture" v-model="newAddress.prefecture" required>
              <option value="">選択してください</option>
              <option v-for="pref in prefectures" :key="pref" :value="pref">
                {{ pref }}
              </option>
            </select>
          </div>
          
          <div class="form-row">
            <label for="city">市区町村 *</label>
            <input 
              id="city"
              v-model="newAddress.city"
              type="text"
              placeholder="千代田区"
              required
            />
          </div>
          
          <div class="form-row">
            <label for="town">町域・番地 *</label>
            <input 
              id="town"
              v-model="newAddress.town"
              type="text"
              placeholder="千代田1-1-1"
              required
            />
          </div>
          
          <div class="form-row">
            <label for="building">建物名・部屋番号</label>
            <input 
              id="building"
              v-model="newAddress.building"
              type="text"
              placeholder="千代田マンション 302号室"
            />
          </div>
          
          <div class="form-row">
            <label for="phoneNumber">電話番号 *</label>
            <input 
              id="phoneNumber"
              v-model="newAddress.phoneNumber"
              type="tel"
              placeholder="03-1234-5678"
              @input="onPhoneNumberInput"
              required
            />
          </div>
          
          <div class="form-row checkbox-row">
            <label>
              <input 
                type="checkbox" 
                v-model="newAddress.isDefault"
              />
              デフォルトの配送先として設定
            </label>
          </div>
          
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="closeForm">
              キャンセル
            </button>
            <button type="submit" class="save-btn">
              {{ editingAddress ? '更新' : '追加' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.address-container {
  position: relative;
  overflow-x: hidden;
  overflow-y: visible;
  width: 100%;
  height: 100%;
  min-height: 600px;
}

.main-content {
  position: absolute;
  top: 0;
  left: 0;
  width: -webkit-fill-available;
  height: 100%;
  transition: transform 0.4s ease-in-out;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.main-content.slide-left {
  transform: translateX(-100%);
}

.address-management {
  padding: 24px;
  background: #fafafa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e0e0e0;
}

.address-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
}

.add-address-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.add-address-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.addresses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.address-card {
  background: white;
  border: 2px solid #e3f2fd;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.address-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: #2196f3;
}

.address-card.default {
  border-color: #4caf50;
  background: linear-gradient(135deg, #f8fff8 0%, #e8f5e8 100%);
}

.address-card.default::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #4caf50, #81c784);
}

.default-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #4caf50;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.address-content {
  margin-bottom: 16px;
}

.address-content h3 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.address-content p {
  margin: 4px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.address-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.edit-btn, .delete-btn, .set-default-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.edit-btn {
  background: #2196f3;
  color: white;
}

.edit-btn:hover {
  background: #1976d2;
}

.delete-btn {
  background: #f44336;
  color: white;
}

.delete-btn:hover {
  background: #d32f2f;
}

.set-default-btn {
  background: #ff9800;
  color: white;
}

.set-default-btn:hover {
  background: #f57c00;
}

.modal-overlay {
  position: absolute;
  top: 0;
  right: 0;
  width: -webkit-fill-available;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateX(100%);
  transition: transform 0.4s ease-in-out;
  overflow-y: auto;
}

.modal-overlay.slide-in {
  transform: translateX(0);
}

.modal-content {
  position: relative;
  background: transparent;
  border-radius: 0;
  padding: 24px;
  border: none;
  max-width: none;
  max-height: none;
  box-shadow: none;
  animation: none;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-50px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 24px;
}

.address-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: flex;
  flex-direction: column;
}

.form-row label {
  margin-bottom: 8px;
  color: #2c3e50;
  font-weight: 500;
  font-size: 14px;
}

.form-row input,
.form-row select {
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
}

.form-row input:focus,
.form-row select:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.checkbox-row {
  flex-direction: row !important;
  align-items: center;
  gap: 8px;
}

.checkbox-row input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.checkbox-row label {
  margin: 0;
  font-size: 14px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.cancel-btn, .save-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.save-btn {
  background: linear-gradient(135deg, #4caf50 0%, #81c784 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.no-addresses {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.no-addresses-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #ccc;
}

.no-addresses h3 {
  margin: 0 0 8px 0;
  color: #999;
  font-size: 18px;
  font-weight: 500;
}

.no-addresses p {
  margin: 0;
  color: #bbb;
  font-size: 14px;
}

@media (max-width: 768px) {
  .address-management {
    padding: 16px;
  }
  
  .addresses-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .address-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .modal-content {
    width: 95%;
    margin: 16px;
  }
  
  .modal-body {
    padding: 16px;
  }
}
</style>