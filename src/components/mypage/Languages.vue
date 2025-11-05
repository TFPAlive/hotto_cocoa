<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { auth } from '@/composables/useAuth'
import type { Language, Currency, Region, LocalizationSettings } from '@/types'

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

const languages = ref<Language[]>([
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' }
])

const currencies = ref<Currency[]>([
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'KRW', name: 'Korean Won', symbol: '₩' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'GBP', name: 'British Pound', symbol: '£' }
])

const regions = ref<Region[]>([
  { code: 'JP', name: '日本', timezone: 'Asia/Tokyo' },
  { code: 'US', name: 'United States', timezone: 'America/New_York' },
  { code: 'KR', name: '韓国', timezone: 'Asia/Seoul' },
  { code: 'CN', name: '中国', timezone: 'Asia/Shanghai' },
  { code: 'GB', name: 'United Kingdom', timezone: 'Europe/London' },
  { code: 'DE', name: 'Germany', timezone: 'Europe/Berlin' }
])

const dateFormats = [
  { value: 'YYYY/MM/DD', label: '2024/01/15', description: '年/月/日' },
  { value: 'MM/DD/YYYY', label: '01/15/2024', description: '月/日/年' },
  { value: 'DD/MM/YYYY', label: '15/01/2024', description: '日/月/年' },
  { value: 'YYYY-MM-DD', label: '2024-01-15', description: 'ISO形式' }
]

const settings = ref<LocalizationSettings>({
  language: 'ja',
  currency: 'JPY',
  region: 'JP',
  dateFormat: 'YYYY/MM/DD',
  timeFormat: '24h',
  numberFormat: 'comma',
  firstDayOfWeek: 1
})

const previewDate = new Date()
const previewNumber = 1234567.89

onMounted(() => {
  fetchSettings()
})

async function fetchSettings() {
  loading.value = true
  
  try {
    const response = await fetch('/api/user/localization-settings', {
      credentials: 'include'
    })
    
    if (response.ok) {
      const data = await response.json()
      settings.value = { ...settings.value, ...data }
    }
  } catch (err) {
    console.error('Failed to fetch localization settings:', err)
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  saving.value = true
  error.value = null
  
  try {
    const response = await fetch('/api/user/localization-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(settings.value)
    })
    
    if (!response.ok) throw new Error('Failed to save settings')
    
    // Show success message
    alert('設定を保存しました。変更を反映するためにページを再読み込みします。')
    window.location.reload()
  } catch (err: any) {
    error.value = err.message || '設定の保存に失敗しました'
  } finally {
    saving.value = false
  }
}

function getLanguageName(code: string) {
  const lang = languages.value.find(l => l.code === code)
  return lang ? `${lang.flag} ${lang.nativeName}` : code
}

function getCurrencyName(code: string) {
  const curr = currencies.value.find(c => c.code === code)
  return curr ? `${curr.symbol} ${curr.name}` : code
}

function getRegionName(code: string) {
  const region = regions.value.find(r => r.code === code)
  return region ? region.name : code
}

function formatPreviewDate() {
  const format = settings.value.dateFormat
  const year = previewDate.getFullYear()
  const month = (previewDate.getMonth() + 1).toString().padStart(2, '0')
  const day = previewDate.getDate().toString().padStart(2, '0')
  
  return format
    .replace('YYYY', year.toString())
    .replace('MM', month)
    .replace('DD', day)
}

function formatPreviewTime() {
  const hours = previewDate.getHours()
  const minutes = previewDate.getMinutes().toString().padStart(2, '0')
  
  if (settings.value.timeFormat === '12h') {
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    const ampm = hours >= 12 ? 'PM' : 'AM'
    return `${displayHours}:${minutes} ${ampm}`
  } else {
    return `${hours.toString().padStart(2, '0')}:${minutes}`
  }
}

function formatPreviewNumber() {
  const separator = settings.value.numberFormat === 'comma' ? ',' : 
                   settings.value.numberFormat === 'space' ? ' ' : '.'
  
  const parts = previewNumber.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)
  
  return parts.join('.')
}

function getDayOfWeekLabel() {
  return settings.value.firstDayOfWeek === 0 ? '日曜日から始まる' : '月曜日から始まる'
}

function resetToDefaults() {
  if (!confirm('デフォルト設定に戻しますか？')) return
  
  settings.value = {
    language: 'ja',
    currency: 'JPY',
    region: 'JP',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: '24h',
    numberFormat: 'comma',
    firstDayOfWeek: 1
  }
}
</script>

<template>
  <div class="languages-container">
    <div class="languages-header">
      <h2>言語と地域</h2>
      <p>表示言語、通貨、地域設定を管理します</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>設定を読み込み中...</p>
    </div>

    <div v-else class="settings-content">
      <!-- Language Settings -->
      <div class="settings-section">
        <div class="section-header">
          <h3>🌍 表示言語</h3>
          <p>アプリケーションの表示言語を選択します</p>
        </div>
        
        <div class="form-row">
          <label for="language">言語</label>
          <select id="language" v-model="settings.language">
            <option v-for="lang in languages" :key="lang.code" :value="lang.code">
              {{ lang.flag }} {{ lang.nativeName }} ({{ lang.name }})
            </option>
          </select>
        </div>
      </div>

      <!-- Regional Settings -->
      <div class="settings-section">
        <div class="section-header">
          <h3>📍 地域設定</h3>
          <p>通貨、タイムゾーン、数値形式を設定します</p>
        </div>
        
        <div class="form-grid">
          <div class="form-row">
            <label for="region">地域</label>
            <select id="region" v-model="settings.region">
              <option v-for="region in regions" :key="region.code" :value="region.code">
                {{ region.name }} ({{ region.timezone }})
              </option>
            </select>
          </div>
          
          <div class="form-row">
            <label for="currency">通貨</label>
            <select id="currency" v-model="settings.currency">
              <option v-for="currency in currencies" :key="currency.code" :value="currency.code">
                {{ currency.symbol }} {{ currency.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Format Settings -->
      <div class="settings-section">
        <div class="section-header">
          <h3>📅 フォーマット設定</h3>
          <p>日付、時刻、数値の表示形式を設定します</p>
        </div>
        
        <div class="form-grid">
          <div class="form-row">
            <label for="dateFormat">日付形式</label>
            <select id="dateFormat" v-model="settings.dateFormat">
              <option v-for="format in dateFormats" :key="format.value" :value="format.value">
                {{ format.label }} ({{ format.description }})
              </option>
            </select>
          </div>
          
          <div class="form-row">
            <label for="timeFormat">時刻形式</label>
            <select id="timeFormat" v-model="settings.timeFormat">
              <option value="24h">24時間形式 (23:59)</option>
              <option value="12h">12時間形式 (11:59 PM)</option>
            </select>
          </div>
        </div>
        
        <div class="form-grid">
          <div class="form-row">
            <label for="numberFormat">数値区切り文字</label>
            <select id="numberFormat" v-model="settings.numberFormat">
              <option value="comma">カンマ (1,234,567)</option>
              <option value="space">スペース (1 234 567)</option>
              <option value="period">ピリオド (1.234.567)</option>
            </select>
          </div>
          
          <div class="form-row">
            <label for="firstDayOfWeek">週の始まり</label>
            <select id="firstDayOfWeek" v-model="settings.firstDayOfWeek">
              <option :value="1">月曜日</option>
              <option :value="0">日曜日</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Preview Section -->
      <div class="settings-section preview-section">
        <div class="section-header">
          <h3>👀 プレビュー</h3>
          <p>現在の設定での表示例</p>
        </div>
        
        <div class="preview-grid">
          <div class="preview-item">
            <div class="preview-label">言語</div>
            <div class="preview-value">{{ getLanguageName(settings.language) }}</div>
          </div>
          
          <div class="preview-item">
            <div class="preview-label">地域・通貨</div>
            <div class="preview-value">{{ getRegionName(settings.region) }} - {{ getCurrencyName(settings.currency) }}</div>
          </div>
          
          <div class="preview-item">
            <div class="preview-label">日付</div>
            <div class="preview-value">{{ formatPreviewDate() }}</div>
          </div>
          
          <div class="preview-item">
            <div class="preview-label">時刻</div>
            <div class="preview-value">{{ formatPreviewTime() }}</div>
          </div>
          
          <div class="preview-item">
            <div class="preview-label">数値</div>
            <div class="preview-value">{{ formatPreviewNumber() }}</div>
          </div>
          
          <div class="preview-item">
            <div class="preview-label">カレンダー</div>
            <div class="preview-value">{{ getDayOfWeekLabel() }}</div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="actions-section">
        <div class="actions-left">
          <button class="btn-secondary" @click="resetToDefaults">
            デフォルトに戻す
          </button>
        </div>
        
        <div class="actions-right">
          <button 
            class="btn-primary" 
            @click="saveSettings"
            :disabled="saving"
          >
            <span v-if="saving">保存中...</span>
            <span v-else>設定を保存</span>
          </button>
        </div>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- Information Box -->
      <div class="info-section">
        <div class="info-header">
          <span class="info-icon">ℹ️</span>
          <h4>設定について</h4>
        </div>
        <ul class="info-list">
          <li><strong>言語設定</strong>: アプリケーションの表示言語が変更されます</li>
          <li><strong>地域設定</strong>: タイムゾーンと地域固有のフォーマットが適用されます</li>
          <li><strong>通貨設定</strong>: 価格表示に使用される通貨が変更されます</li>
          <li><strong>フォーマット</strong>: 日付、時刻、数値の表示形式をカスタマイズできます</li>
          <li><strong>適用</strong>: 変更を適用するにはページの再読み込みが必要です</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.languages-container {
  width: 100%;
}

.languages-header {
  margin-bottom: 32px;
  text-align: center;
}

.languages-header h2 {
  color: var(--header-color);
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
}

.languages-header p {
  color: var(--font-color);
  font-size: 16px;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--sub-bg-color);
  border-top: 4px solid var(--header-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-section {
  background: var(--main-bg-color);
  border: 2px solid var(--sub-bg-color);
  border-radius: 12px;
  padding: 24px;
}

.preview-section {
  background: linear-gradient(135deg, var(--sub-bg-color) 0%, var(--shadow-color) 100%);
  border-color: var(--shadow-color);
}

.section-header {
  margin-bottom: 20px;
}

.section-header h3 {
  color: var(--header-color);
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.section-header p {
  color: #666;
  margin: 0;
  font-size: 14px;
}

.form-row {
  margin-bottom: 20px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-row label {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
  font-weight: 500;
  font-size: 14px;
}

.form-row select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  background-color: white;
  transition: all 0.3s ease;
}

.form-row select:focus {
  outline: none;
  border-color: #a0522d;
  box-shadow: 0 0 0 3px rgba(160, 82, 45, 0.1);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.preview-item {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.preview-label {
  color: #666;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.preview-value {
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.actions-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
}

.actions-left, .actions-right {
  display: flex;
  gap: 8px;
}

.btn-primary, .btn-secondary {
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

.btn-primary:hover:not(:disabled) {
  background: #8b4513;
  transform: translateY(-2px);
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

.error-message {
  color: #f44336;
  background: #ffebee;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  border: 1px solid #ffcdd2;
}

.info-section {
  background: #e3f2fd;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #bbdefb;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.info-icon {
  font-size: 18px;
}

.info-header h4 {
  color: #1976d2;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.info-list {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.info-list li {
  margin-bottom: 6px;
  line-height: 1.4;
}

.info-list strong {
  color: #2c3e50;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .preview-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-section {
    flex-direction: column;
    gap: 12px;
  }
  
  .actions-left, .actions-right {
    width: 100%;
    justify-content: center;
  }
}
</style>