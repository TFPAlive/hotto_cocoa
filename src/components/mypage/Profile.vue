<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { auth } from '@/composables/useAuth'
import type { User } from '@/types'

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const saveSuccess = ref(false)

const userProfile = ref<Partial<User>>({
  username: '',
  email: '',
  phone: '',
  firstname: '',
  lastname: '',
  birthdate: '',
  gender: ''
})

const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const genderOptions = [
  { value: '', label: '選択してください' },
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
  { value: 'prefer-not-to-say', label: '回答しない' }
]

onMounted(() => {
  loadUserProfile()
})

async function loadUserProfile() {
  loading.value = true
  error.value = null
  
  try {
    // Use current auth user data as starting point
    if (auth.user) {
      userProfile.value = { ...auth.user }
    }
    
    // Fetch additional profile data from API
    const response = await fetch('/api/user/profile', {
      credentials: 'include'
    })
    
    if (!response.ok) throw new Error('Failed to load profile')
    
    const data = await response.json()
    userProfile.value = { ...userProfile.value, ...data }
  } catch (err: any) {
    error.value = err.message || 'プロフィールの読み込みに失敗しました'
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  saving.value = true
  error.value = null
  saveSuccess.value = false
  
  try {
    const formData = new FormData()
    
    // Add profile fields
    Object.entries(userProfile.value).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value))
      }
    })
    
    // Add avatar if selected
    if (avatarFile.value) {
      formData.append('avatar', avatarFile.value)
    }
    
    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      credentials: 'include',
      body: formData
    })
    
    if (!response.ok) throw new Error('Failed to save profile')
    
    const updatedData = await response.json()
    userProfile.value = { ...userProfile.value, ...updatedData }
    
    // Update auth user data
    if (auth.user) {
      Object.assign(auth.user, updatedData)
    }
    
    saveSuccess.value = true
    setTimeout(() => saveSuccess.value = false, 3000)
  } catch (err: any) {
    error.value = err.message || 'プロフィールの保存に失敗しました'
  } finally {
    saving.value = false
  }
}

function triggerFileInput() {
  fileInput.value?.click()
}

function onAvatarChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      error.value = 'ファイルサイズは5MB以下にしてください'
      return
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      error.value = '画像ファイルを選択してください'
      return
    }
    
    avatarFile.value = file
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function removeAvatar() {
  avatarFile.value = null
  avatarPreview.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function formatDate(dateString: string) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('ja-JP')
}
</script>

<template>
  <div class="profile-container">
    <div class="profile-header">
      <h2>プロフィール設定</h2>
      <p>アカウント情報を管理します</p>
    </div>
    
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>プロフィールを読み込み中...</p>
    </div>
    
    <div v-else class="profile-content">
      <form @submit.prevent="saveProfile" class="profile-form">
        <!-- Avatar Section -->
        <div class="form-section">
          <h3>プロフィール画像</h3>
          <div class="avatar-section">
            <div class="avatar-display">
              <img 
                v-if="avatarPreview" 
                :src="avatarPreview" 
                alt="Avatar preview"
                class="avatar-image"
              />
              <img 
                v-else-if="userProfile.avatar" 
                :src="userProfile.avatar" 
                alt="Current avatar"
                class="avatar-image"
              />
              <div v-else class="avatar-placeholder">
                <span>👤</span>
              </div>
            </div>
            <div class="avatar-controls">
              <input 
                ref="fileInput"
                type="file" 
                accept="image/*" 
                @change="onAvatarChange"
                style="display: none"
              />
              <button type="button" class="btn-secondary" @click="triggerFileInput">
                画像を選択
              </button>
              <button 
                v-if="avatarFile || userProfile.avatar" 
                type="button" 
                class="btn-danger" 
                @click="removeAvatar"
              >
                削除
              </button>
            </div>
          </div>
        </div>

        <!-- Basic Information -->
        <div class="form-section">
          <h3>基本情報</h3>
          <div class="form-grid">
            <div class="form-row">
              <label for="username">ユーザー名 *</label>
              <input 
                id="username"
                v-model="userProfile.username"
                type="text"
                required
                placeholder="ユーザー名を入力"
              />
            </div>
            
            <div class="form-row">
              <label for="email">メールアドレス *</label>
              <input 
                id="email"
                v-model="userProfile.email"
                type="email"
                required
                placeholder="email@example.com"
              />
            </div>
            
            <div class="form-row">
              <label for="phone">電話番号</label>
              <input 
                id="phone"
                v-model="userProfile.phone"
                type="tel"
                placeholder="090-1234-5678"
              />
            </div>
          </div>
        </div>

        <!-- Personal Details -->
        <div class="form-section">
          <h3>個人情報</h3>
          <div class="form-grid">
            <div class="form-row">
              <label for="firstname">姓</label>
              <input 
                id="firstname"
                v-model="userProfile.firstname"
                type="text"
                placeholder="田中"
              />
            </div>
            
            <div class="form-row">
              <label for="lastname">名</label>
              <input 
                id="lastname"
                v-model="userProfile.lastname"
                type="text"
                placeholder="太郎"
              />
            </div>
            
            <div class="form-row">
              <label for="birthdate">生年月日</label>
              <input 
                id="birthdate"
                v-model="userProfile.birthdate"
                type="date"
              />
            </div>
            
            <div class="form-row">
              <label for="gender">性別</label>
              <select id="gender" v-model="userProfile.gender">
                <option 
                  v-for="option in genderOptions" 
                  :key="option.value" 
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <div class="status-messages">
            <div v-if="error" class="error-message">
              {{ error }}
            </div>
            <div v-if="saveSuccess" class="success-message">
              プロフィールを保存しました
            </div>
          </div>
          
          <button 
            type="submit" 
            class="btn-primary" 
            :disabled="saving"
          >
            <span v-if="saving">保存中...</span>
            <span v-else>プロフィールを保存</span>
          </button>
        </div>
      </form>
      
      <!-- Account Information -->
      <div class="account-info">
        <h3>アカウント情報</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">アカウント作成日:</span>
            <span class="value">{{ formatDate(userProfile.created_at || '') || '不明' }}</span>
          </div>
          <div class="info-item">
            <span class="label">最終ログイン:</span>
            <span class="value">{{ formatDate(userProfile.last_login || '') || '不明' }}</span>
          </div>
          <div class="info-item">
            <span class="label">ユーザーID:</span>
            <span class="value">{{ userProfile.userid || '不明' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.profile-header {
  margin-bottom: 32px;
  text-align: center;
}

.profile-header h2 {
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
}

.profile-header p {
  color: #666;
  font-size: 16px;
}

.loading-state {
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

.profile-form {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.form-section {
  margin-bottom: 32px;
}

.form-section h3 {
  color: #2c3e50;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 2px solid #a0522d;
  padding-bottom: 8px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.form-row {
  display: flex;
  flex-direction: column;
}

.form-row label {
  margin-bottom: 6px;
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
  border-color: #a0522d;
  box-shadow: 0 0 0 3px rgba(160, 82, 45, 0.1);
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-display {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f8f8;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 48px;
  color: #ccc;
}

.avatar-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
}

.status-messages {
  flex: 1;
}

.error-message {
  color: #f44336;
  background: #ffebee;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 8px;
}

.success-message {
  color: #4caf50;
  background: #f1f8e9;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #a0522d 0%, #8b4513 100%);
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
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(160, 82, 45, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
  border: 2px solid #e0e0e0;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #e0e0e0;
  color: #333;
}

.btn-danger {
  background: #f44336;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.btn-danger:hover {
  background: #d32f2f;
}

.account-info {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 24px;
  border: 2px solid #e9ecef;
}

.account-info h3 {
  color: #2c3e50;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .label {
  color: #666;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item .value {
  color: #2c3e50;
  font-weight: 500;
}

@media (max-width: 768px) {
  .profile-container {
    padding: 16px;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .avatar-section {
    flex-direction: column;
    text-align: center;
  }
  
  .form-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>