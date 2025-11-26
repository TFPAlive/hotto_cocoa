<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/composables/useAuth'

const router = useRouter()

onMounted(() => {
  // Redirect to home after 3 seconds
  setTimeout(() => {
    router.push('/')
  }, 3000)
})

function goHome() {
  router.push('/')
}

function goLogin() {
  router.push('/auth/login')
}
</script>

<template>
  <div class="access-denied-container">
    <div class="access-denied-card">
      <div class="icon">🔒</div>
      <h1>Access Denied</h1>
      <p class="message">You don't have permission to access this area.</p>
      <p class="sub-message">Admin privileges are required to view this page.</p>
      
      <div class="user-info" v-if="auth.isLoggedIn">
        <p>Logged in as: <strong>{{ auth.user?.username || 'User' }}</strong></p>
        <p>Role: <strong>{{ auth.userRole }}</strong></p>
      </div>

      <div class="actions">
        <button @click="goHome" class="btn-primary">
          Go to Home
        </button>
        <button v-if="!auth.isLoggedIn" @click="goLogin" class="btn-secondary">
          Login
        </button>
      </div>

      <p class="redirect-notice">You will be redirected to home in 3 seconds...</p>
    </div>
  </div>
</template>

<style scoped>
.access-denied-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--main-bg-color), var(--sub-bg-color));
  padding: 20px;
}

.access-denied-card {
  background: var(--main-bg-color);
  border-radius: 20px;
  padding: 60px 40px;
  max-width: 500px;
  width: 100%;
  text-align: center;
  box-shadow: 0 10px 40px var(--shadow-color);
  border: 3px solid #e53935;
}

.icon {
  font-size: 5rem;
  margin-bottom: 20px;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

h1 {
  color: #e53935;
  font-size: 2.5rem;
  margin-bottom: 15px;
  font-weight: bold;
}

.message {
  color: var(--font-color);
  font-size: 1.2rem;
  margin-bottom: 10px;
  font-weight: 500;
}

.sub-message {
  color: var(--font-color);
  font-size: 1rem;
  margin-bottom: 30px;
  opacity: 0.8;
}

.user-info {
  background: var(--sub-bg-color);
  border-radius: 10px;
  padding: 15px;
  margin: 20px 0;
  border-left: 4px solid var(--hover-color);
}

.user-info p {
  color: var(--font-color);
  margin: 5px 0;
  font-size: 0.95rem;
}

.user-info strong {
  color: var(--header-color);
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
}

.btn-primary {
  background: var(--header-color);
  color: var(--main-bg-color);
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: var(--hover-color);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px var(--shadow-color);
}

.btn-secondary {
  background: transparent;
  color: var(--header-color);
  border: 2px solid var(--header-color);
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: var(--header-color);
  color: var(--main-bg-color);
  transform: translateY(-2px);
}

.redirect-notice {
  color: var(--font-color);
  font-size: 0.85rem;
  margin-top: 25px;
  opacity: 0.7;
  font-style: italic;
}

@media (max-width: 768px) {
  .access-denied-card {
    padding: 40px 30px;
  }

  h1 {
    font-size: 2rem;
  }

  .icon {
    font-size: 4rem;
  }

  .actions {
    flex-direction: column;
  }

  .btn-primary, .btn-secondary {
    width: 100%;
  }
}
</style>
