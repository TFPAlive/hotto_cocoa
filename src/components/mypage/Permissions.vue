<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { auth } from '@/composables/useAuth'
import type { PermissionSetting, DataExport } from '@/types'

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const showDeleteAccount = ref(false)
const deleteConfirmation = ref('')

const permissionSettings = ref<PermissionSetting[]>([
  {
    key: 'data_analytics',
    category: 'プライバシー',
    label: 'データ分析への利用',
    description: '購入履歴や利用状況を分析し、サービス改善に利用することを許可',
    enabled: false
  },
  {
    key: 'marketing_emails',
    category: '通知',
    label: 'マーケティングメール',
    description: 'おすすめ商品や特別オファーのメールを受信',
    enabled: true
  },
  {
    key: 'push_notifications',
    category: '通知',
    label: 'プッシュ通知',
    description: '注文状況や重要なお知らせのプッシュ通知を受信',
    enabled: true
  },
  {
    key: 'location_tracking',
    category: 'プライバシー',
    label: '位置情報の利用',
    description: '近くの店舗情報や配送最適化のために位置情報を利用',
    enabled: false
  },
  {
    key: 'third_party_sharing',
    category: 'プライバシー',
    label: 'サードパーティとの情報共有',
    description: 'パートナー企業とのサービス連携のための情報共有を許可',
    enabled: false
  },
  {
    key: 'order_notifications',
    category: '通知',
    label: '注文通知',
    description: '注文確認や配送状況の通知を受信',
    enabled: true,
    required: true
  },
  {
    key: 'security_alerts',
    category: '通知',
    label: 'セキュリティアラート',
    description: 'アカウントのセキュリティに関する重要な通知',
    enabled: true,
    required: true
  }
])

const dataExports = ref<DataExport[]>([
  {
    type: 'personal_data',
    label: '個人データ',
    description: 'プロフィール情報、設定、基本的なアカウントデータ',
    size: '2.4 MB'
  },
  {
    type: 'order_history',
    label: '注文履歴',
    description: '過去の注文、支払い履歴、配送情報',
    size: '15.2 MB'
  },
  {
    type: 'activity_data',
    label: '活動データ',
    description: '閲覧履歴、お気に入り、レビュー、検索履歴',
    size: '8.7 MB'
  },
  {
    type: 'communication_data',
    label: 'コミュニケーションデータ',
    description: 'カスタマーサポートとのやり取り、フィードバック',
    size: '1.1 MB'
  }
])

onMounted(() => {
  fetchPermissionSettings()
})

const groupedSettings = computed(() => {
  const groups = permissionSettings.value.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = []
    }
    acc[setting.category].push(setting)
    return acc
  }, {} as Record<string, PermissionSetting[]>)
  
  return groups
})

async function fetchPermissionSettings() {
  loading.value = true
  
  try {
    const response = await fetch('/api/user/permissions', {
      credentials: 'include'
    })
    
    if (response.ok) {
      const permissions = await response.json()
      // Update permission settings based on API response
      permissionSettings.value.forEach(setting => {
        if (permissions[setting.key] !== undefined) {
          setting.enabled = permissions[setting.key]
        }
      })
    }
  } catch (err) {
    console.error('Failed to fetch permission settings:', err)
  } finally {
    loading.value = false
  }
}

async function togglePermission(setting: PermissionSetting) {
  if (setting.required) return
  
  saving.value = true
  error.value = null
  
  try {
    const response = await fetch('/api/user/permissions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        [setting.key]: !setting.enabled
      })
    })
    
    if (!response.ok) throw new Error('Failed to update permission')
    
    setting.enabled = !setting.enabled
  } catch (err: any) {
    error.value = err.message || '設定の更新に失敗しました'
  } finally {
    saving.value = false
  }
}

async function exportData(exportType: string) {
  try {
    const response = await fetch(`/api/user/export-data?type=${exportType}`, {
      credentials: 'include'
    })
    
    if (!response.ok) throw new Error('Failed to export data')
    
    // Create download link
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = `${exportType}_export_${new Date().toISOString().split('T')[0]}.zip`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    // Update last exported date
    const exportItem = dataExports.value.find(item => item.type === exportType)
    if (exportItem) {
      exportItem.lastExported = new Date().toISOString()
    }
  } catch (err: any) {
    alert(err.message || 'データのエクスポートに失敗しました')
  }
}

async function deleteAccount() {
  if (deleteConfirmation.value !== 'DELETE') {
    error.value = '確認のため「DELETE」と入力してください'
    return
  }
  
  if (!confirm('アカウントを削除すると、すべてのデータが永久に失われます。本当に削除しますか？')) {
    return
  }
  
  saving.value = true
  error.value = null
  
  try {
    const response = await fetch('/api/user/delete-account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        confirmation: deleteConfirmation.value
      })
    })
    
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to delete account')
    }
    
    alert('アカウントが削除されました。ご利用いただき、ありがとうございました。')
    window.location.href = '/'
  } catch (err: any) {
    error.value = err.message || 'アカウントの削除に失敗しました'
  } finally {
    saving.value = false
  }
}

function formatDate(dateString?: string) {
  if (!dateString) return 'エクスポート履歴なし'
  return new Date(dateString).toLocaleDateString('ja-JP')
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'プライバシー': return '🔒'
    case '通知': return '🔔'
    default: return '⚙️'
  }
}
</script>

<template>
  <div class="permissions-container">
    <div class="permissions-header">
      <h2>プライバシーと権限</h2>
      <p>データの利用方法と通知設定を管理します</p>
    </div>

    <!-- Privacy Settings Section -->
    <div class="permissions-section">
      <div class="section-header">
        <h3>⚙️ 権限設定</h3>
        <p>データの使用と通知に関する設定</p>
      </div>
      
      <div class="settings-groups">
        <div
          v-for="(settings, category) in groupedSettings"
          :key="category"
          class="settings-group"
        >
          <div class="group-header">
            <span class="group-icon">{{ getCategoryIcon(category) }}</span>
            <h4>{{ category }}</h4>
          </div>
          
          <div class="settings-list">
            <div
              v-for="setting in settings"
              :key="setting.key"
              class="setting-item"
              :class="{ required: setting.required }"
            >
              <div class="setting-info">
                <div class="setting-label">
                  {{ setting.label }}
                  <span v-if="setting.required" class="required-badge">必須</span>
                </div>
                <div class="setting-description">{{ setting.description }}</div>
              </div>
              
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  :checked="setting.enabled"
                  @change="togglePermission(setting)"
                  :disabled="saving || setting.required"
                />
                <span class="toggle-slider" :class="{ required: setting.required }"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Export Section -->
    <div class="permissions-section">
      <div class="section-header">
        <h3>📁 データのエクスポート</h3>
        <p>あなたのデータをダウンロードできます</p>
      </div>
      
      <div class="export-list">
        <div
          v-for="exportItem in dataExports"
          :key="exportItem.type"
          class="export-item"
        >
          <div class="export-info">
            <div class="export-label">{{ exportItem.label }}</div>
            <div class="export-description">{{ exportItem.description }}</div>
            <div class="export-meta">
              <span class="export-size">サイズ: {{ exportItem.size }}</span>
              <span class="export-date">最終エクスポート: {{ formatDate(exportItem.lastExported) }}</span>
            </div>
          </div>
          
          <button 
            class="btn-secondary"
            @click="exportData(exportItem.type)"
          >
            ダウンロード
          </button>
        </div>
      </div>
      
      <div class="export-info-box">
        <h4>📋 データエクスポートについて</h4>
        <ul>
          <li>データはZIP形式でダウンロードされます</li>
          <li>エクスポートには最大30分かかる場合があります</li>
          <li>データには個人を特定できる情報が含まれています</li>
          <li>ダウンロードしたファイルは安全に管理してください</li>
        </ul>
      </div>
    </div>

    <!-- Account Deletion Section -->
    <div class="permissions-section danger-section">
      <div class="section-header">
        <h3>⚠️ アカウントの削除</h3>
        <p>アカウントとすべてのデータを永久に削除します</p>
      </div>
      
      <div class="danger-warning">
        <div class="warning-icon">🚨</div>
        <div class="warning-text">
          <h4>重要：この操作は取り消せません</h4>
          <p>アカウントを削除すると、以下のデータがすべて失われます：</p>
          <ul>
            <li>プロフィール情報と設定</li>
            <li>注文履歴と支払い情報</li>
            <li>お気に入りとレビュー</li>
            <li>ポイントと割引券</li>
            <li>すべての活動履歴</li>
          </ul>
        </div>
      </div>
      
      <button class="btn-danger" @click="showDeleteAccount = true">
        アカウントを削除
      </button>
    </div>

    <!-- Account Deletion Modal -->
    <div v-if="showDeleteAccount" class="modal-overlay" @click="showDeleteAccount = false">
      <div class="modal-content danger-modal" @click.stop>
        <div class="modal-header">
          <h3>⚠️ アカウントの削除</h3>
          <button class="close-btn" @click="showDeleteAccount = false">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="final-warning">
            <div class="warning-icon">🚨</div>
            <h4>最終確認</h4>
            <p>アカウントを削除すると、すべてのデータが永久に失われます。この操作は取り消すことができません。</p>
          </div>
          
          <div class="confirmation-input">
            <label>確認のため、以下に <strong>「DELETE」</strong> と入力してください：</label>
            <input
              v-model="deleteConfirmation"
              type="text"
              placeholder="DELETE"
              class="danger-input"
            />
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="showDeleteAccount = false">キャンセル</button>
          <button 
            class="btn-danger" 
            @click="deleteAccount"
            :disabled="saving || deleteConfirmation !== 'DELETE'"
          >
            <span v-if="saving">削除中...</span>
            <span v-else>アカウントを削除</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="error && !showDeleteAccount" class="error-banner">
      {{ error }}
      <button @click="error = null" class="close-error">&times;</button>
    </div>
  </div>
</template>

<style scoped>
.permissions-container {
  width: 100%;
}

.permissions-header {
  margin-bottom: 32px;
  text-align: center;
}

.permissions-header h2 {
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
}

.permissions-header p {
  color: #666;
  font-size: 16px;
}

.permissions-section {
  background: white;
  border: 2px solid #e3f2fd;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.danger-section {
  border-color: #ffebee;
  background: linear-gradient(135deg, #fff8f8 0%, #ffebee 100%);
}

.section-header {
  margin-bottom: 20px;
}

.section-header h3 {
  color: #2c3e50;
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.section-header p {
  color: #666;
  margin: 0;
  font-size: 14px;
}

.settings-groups {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-group {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.group-icon {
  font-size: 18px;
}

.group-header h4 {
  color: #2c3e50;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.setting-item.required {
  background: linear-gradient(135deg, #f0f8f0 0%, #e8f5e8 100%);
  border-color: #c8e6c9;
}

.setting-info {
  flex: 1;
  margin-right: 16px;
}

.setting-label {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.required-badge {
  background: #4caf50;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.setting-description {
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  flex-shrink: 0;
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

input:checked + .toggle-slider.required {
  background-color: #2196f3;
}

input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

input:disabled + .toggle-slider {
  opacity: 0.6;
  cursor: not-allowed;
}

.export-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.export-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.export-info {
  flex: 1;
}

.export-label {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.export-description {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.export-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #888;
}

.export-info-box {
  background: #e3f2fd;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #bbdefb;
}

.export-info-box h4 {
  color: #1976d2;
  margin: 0 0 12px 0;
  font-size: 16px;
}

.export-info-box ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.export-info-box li {
  margin-bottom: 4px;
}

.danger-warning {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #ffebee;
  border: 2px solid #ffcdd2;
  border-radius: 8px;
  margin-bottom: 20px;
}

.warning-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.warning-text h4 {
  color: #d32f2f;
  margin: 0 0 8px 0;
  font-size: 16px;
}

.warning-text p {
  color: #666;
  margin: 0 0 8px 0;
}

.warning-text ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
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
  background: #a0522d;
  color: white;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #e0e0e0;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #d32f2f;
  transform: translateY(-2px);
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
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.danger-modal {
  border: 2px solid #f44336;
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

.final-warning {
  background: #ffebee;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #ffcdd2;
  margin-bottom: 20px;
  text-align: center;
}

.final-warning .warning-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.final-warning h4 {
  color: #d32f2f;
  margin: 0 0 8px 0;
}

.final-warning p {
  color: #666;
  margin: 0;
}

.confirmation-input {
  margin-bottom: 20px;
}

.confirmation-input label {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
  font-weight: 500;
}

.danger-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #f44336;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
  font-weight: 600;
}

.danger-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.1);
}

.error-message {
  color: #f44336;
  background: #ffebee;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
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
  .setting-item, .export-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .setting-info {
    margin-right: 0;
  }
  
  .export-meta {
    flex-direction: column;
    gap: 4px;
  }
  
  .danger-warning {
    flex-direction: column;
    text-align: center;
  }
}
</style>