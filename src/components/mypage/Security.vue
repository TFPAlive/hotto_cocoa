<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { auth } from '@/composables/useAuth'
import type { SecuritySetting, LoginSession } from '@/types'

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const showChangePassword = ref(false)
const loginSessions = ref<LoginSession[]>([])

const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: ''
})

const securitySettings = ref<SecuritySetting[]>([
  {
    key: 'two_factor_enabled',
    label: '二段階認証',
    description: 'ログイン時にSMSまたはアプリでの認証を要求します',
    enabled: false
  },
  {
    key: 'email_notifications',
    label: 'セキュリティ通知',
    description: '不審なログインや設定変更をメールで通知します',
    enabled: true
  },
  {
    key: 'login_alerts',
    label: 'ログインアラート',
    description: '新しいデバイスからのログインを通知します',
    enabled: true
  },
  {
    key: 'session_timeout',
    label: '自動ログアウト',
    description: '一定時間操作がないと自動的にログアウトします',
    enabled: false
  }
])

onMounted(() => {
  fetchSecuritySettings()
  fetchLoginSessions()
})

async function fetchSecuritySettings() {
  loading.value = true
  
  try {
    const response = await fetch('/api/user/security-settings', {
      credentials: 'include'
    })
    
    if (response.ok) {
      const settings = await response.json()
      // Update security settings based on API response
      securitySettings.value.forEach(setting => {
        if (settings[setting.key] !== undefined) {
          setting.enabled = settings[setting.key]
        }
      })
    }
  } catch (err) {
    console.error('Failed to fetch security settings:', err)
  } finally {
    loading.value = false
  }
}

async function fetchLoginSessions() {
  try {
    const response = await fetch('/api/user/login-sessions', {
      credentials: 'include'
    })
    
    if (response.ok) {
      loginSessions.value = await response.json()
    }
  } catch (err) {
    console.error('Failed to fetch login sessions:', err)
  }
}

async function toggleSecuritySetting(setting: SecuritySetting) {
  saving.value = true
  error.value = null
  
  try {
    const response = await fetch('/api/user/security-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        [setting.key]: !setting.enabled
      })
    })
    
    if (!response.ok) throw new Error('Failed to update security setting')
    
    setting.enabled = !setting.enabled
  } catch (err: any) {
    error.value = err.message || 'セキュリティ設定の更新に失敗しました'
  } finally {
    saving.value = false
  }
}

async function changePassword() {
  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    error.value = '新しいパスワードが一致しません'
    return
  }
  
  if (passwordForm.value.new_password.length < 8) {
    error.value = 'パスワードは8文字以上である必要があります'
    return
  }
  
  saving.value = true
  error.value = null
  
  try {
    const response = await fetch('/api/user/change-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        current_password: passwordForm.value.current_password,
        new_password: passwordForm.value.new_password
      })
    })
    
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to change password')
    }
    
    // Reset form and close modal
    passwordForm.value = {
      current_password: '',
      new_password: '',
      confirm_password: ''
    }
    showChangePassword.value = false
    alert('パスワードを変更しました')
  } catch (err: any) {
    error.value = err.message || 'パスワードの変更に失敗しました'
  } finally {
    saving.value = false
  }
}

async function revokeSession(session: LoginSession) {
  if (!confirm('このセッションを無効化しますか？')) return
  
  try {
    const response = await fetch(`/api/user/login-sessions/${session.sessionid}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    
    if (!response.ok) throw new Error('Failed to revoke session')
    
    loginSessions.value = loginSessions.value.filter(s => s.sessionid !== session.sessionid)
  } catch (err: any) {
    alert(err.message || 'セッションの無効化に失敗しました')
  }
}

async function revokeAllSessions() {
  if (!confirm('すべてのセッションを無効化しますか？現在のセッションも終了され、再ログインが必要になります。')) return
  
  try {
    const response = await fetch('/api/user/revoke-all-sessions', {
      method: 'POST',
      credentials: 'include'
    })
    
    if (!response.ok) throw new Error('Failed to revoke all sessions')
    
    // This will likely log out the user
    alert('すべてのセッションを無効化しました。再ログインしてください。')
    window.location.href = '/login'
  } catch (err: any) {
    alert(err.message || 'セッションの無効化に失敗しました')
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('ja-JP')
}

function getDeviceIcon(device: string) {
  if (device.includes('Mobile') || device.includes('iPhone') || device.includes('Android')) {
    return '📱'
  } else if (device.includes('iPad') || device.includes('Tablet')) {
    return '📋'
  }
  return '💻'
}
</script>

<template>
  <div class="security-container">
    <div class="security-header">
      <h2>セキュリティ</h2>
      <p>アカウントのセキュリティ設定を管理します</p>
    </div>

    <!-- Password Section -->
    <div class="security-section">
      <div class="section-header">
        <h3>🔒 パスワード</h3>
        <p>アカウントのパスワードを変更します</p>
      </div>
      
      <div class="password-info">
        <p>最後に変更: 2024年1月15日</p>
        <button class="btn-primary" @click="showChangePassword = true">
          パスワードを変更
        </button>
      </div>
    </div>

    <!-- Security Settings Section -->
    <div class="security-section">
      <div class="section-header">
        <h3>🛡️ セキュリティ設定</h3>
        <p>アカウントのセキュリティを強化する設定</p>
      </div>
      
      <div class="settings-list">
        <div
          v-for="setting in securitySettings"
          :key="setting.key"
          class="setting-item"
        >
          <div class="setting-info">
            <div class="setting-label">{{ setting.label }}</div>
            <div class="setting-description">{{ setting.description }}</div>
          </div>
          
          <label class="toggle-switch">
            <input
              type="checkbox"
              :checked="setting.enabled"
              @change="toggleSecuritySetting(setting)"
              :disabled="saving"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- Login Sessions Section -->
    <div class="security-section">
      <div class="section-header">
        <div>
          <h3>📱 ログインセッション</h3>
          <p>現在ログインしているデバイスを管理します</p>
        </div>
        <button class="btn-danger" @click="revokeAllSessions">
          すべてのセッションを無効化
        </button>
      </div>
      
      <div v-if="loginSessions.length === 0" class="empty-sessions">
        <p>アクティブなセッションがありません</p>
      </div>
      
      <div v-else class="sessions-list">
        <div
          v-for="session in loginSessions"
          :key="session.sessionid"
          class="session-item"
          :class="{ current: session.is_current }"
        >
          <div class="session-icon">
            {{ getDeviceIcon(session.device) }}
          </div>
          
          <div class="session-info">
            <div class="session-device">
              {{ session.device }}
              <span v-if="session.is_current" class="current-badge">現在のセッション</span>
            </div>
            <div class="session-details">
              <div class="session-location">📍 {{ session.location }}</div>
              <div class="session-ip">🌐 {{ session.ip_address }}</div>
              <div class="session-activity">🕒 最後のアクティビティ: {{ formatDate(session.last_activity) }}</div>
            </div>
          </div>
          
          <button
            v-if="!session.is_current"
            class="btn-secondary"
            @click="revokeSession(session)"
          >
            無効化
          </button>
        </div>
      </div>
    </div>

    <!-- Change Password Modal -->
    <div v-if="showChangePassword" class="modal-overlay" @click="showChangePassword = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>パスワードを変更</h3>
          <button class="close-btn" @click="showChangePassword = false">&times;</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="changePassword">
            <div class="form-row">
              <label for="current_password">現在のパスワード *</label>
              <input
                id="current_password"
                v-model="passwordForm.current_password"
                type="password"
                placeholder="現在のパスワードを入力"
                required
              />
            </div>
            
            <div class="form-row">
              <label for="new_password">新しいパスワード *</label>
              <input
                id="new_password"
                v-model="passwordForm.new_password"
                type="password"
                placeholder="新しいパスワードを入力（8文字以上）"
                minlength="8"
                required
              />
            </div>
            
            <div class="form-row">
              <label for="confirm_password">パスワード確認 *</label>
              <input
                id="confirm_password"
                v-model="passwordForm.confirm_password"
                type="password"
                placeholder="新しいパスワードを再入力"
                required
              />
            </div>
            
            <div class="password-requirements">
              <p>パスワードの要件:</p>
              <ul>
                <li>8文字以上</li>
                <li>大文字・小文字・数字を含む</li>
                <li>特殊文字を含む（推奨）</li>
              </ul>
            </div>

            <div v-if="error" class="error-message">
              {{ error }}
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="showChangePassword = false">キャンセル</button>
          <button 
            class="btn-primary" 
            @click="changePassword"
            :disabled="saving"
          >
            <span v-if="saving">変更中...</span>
            <span v-else>変更</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="error && !showChangePassword" class="error-banner">
      {{ error }}
      <button @click="error = null" class="close-error">&times;</button>
    </div>
  </div>
</template>

<style scoped>
.security-container {
  width: 100%;
}

.security-header {
  margin-bottom: 32px;
  text-align: center;
}

.security-header h2 {
  color: var(--header-color);
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
}

.security-header p {
  color: var(--font-color);
  font-size: 16px;
}

.security-section {
  background: var(--main-bg-color);
  border: 2px solid var(--sub-bg-color);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.section-header h3 {
  color: var(--header-color);
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.section-header p {
  color: var(--font-color);
  margin: 0;
  font-size: 14px;
}

.password-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--sub-bg-color);
  border-radius: 8px;
}

.password-info p {
  color: var(--font-color);
  margin: 0;
}

.btn-primary, .btn-secondary, .btn-danger {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary {
  background: var(--header-color);
  color: var(--main-bg-color);
}

.btn-primary:hover:not(:disabled) {
  background: var(--hover-font-color);
  transform: translateY(-2px);
}

.btn-secondary {
  background: var(--sub-bg-color);
  color: var(--font-color);
  border: 1px solid var(--shadow-color);
}

.btn-secondary:hover {
  background: var(--shadow-color);
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover {
  background: #d32f2f;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--sub-bg-color);
  border-radius: 8px;
}

.setting-info {
  flex: 1;
}

.setting-label {
  font-weight: 600;
  color: var(--header-color);
  margin-bottom: 4px;
}

.setting-description {
  color: var(--font-color);
  font-size: 14px;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #4caf50;
}

input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.session-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid transparent;
}

.session-item.current {
  border-color: #4caf50;
  background: linear-gradient(135deg, #f8fff8 0%, #e8f5e8 100%);
}

.session-icon {
  font-size: 24px;
  margin-top: 4px;
}

.session-info {
  flex: 1;
}

.session-device {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-badge {
  background: #4caf50;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.session-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.session-location, .session-ip, .session-activity {
  color: #666;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.empty-sessions {
  text-align: center;
  padding: 40px 20px;
  color: #666;
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
  max-width: 450px;
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

.form-row input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-row input:focus {
  outline: none;
  border-color: #a0522d;
  box-shadow: 0 0 0 3px rgba(160, 82, 45, 0.1);
}

.password-requirements {
  background: #e3f2fd;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}

.password-requirements p {
  margin: 0 0 8px 0;
  font-weight: 600;
  color: #2c3e50;
}

.password-requirements ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.error-message {
  color: #f44336;
  background: #ffebee;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  margin-top: 12px;
}

.error-banner {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #f44336;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
}

.close-error {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .password-info, .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .session-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .session-device {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>