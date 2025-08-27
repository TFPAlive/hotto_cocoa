// stores/auth.ts
import { defineStore } from "pinia"
import { ref, computed } from "vue"

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem("token"))
  const role = ref(localStorage.getItem("role"))

  const isLoggedIn = computed(() => !!token.value)

  function login(newToken: string, newRole: string) {
    token.value = newToken
    role.value = newRole
    localStorage.setItem("token", newToken)
    localStorage.setItem("role", newRole)
  }

  function logout() {
    token.value = null
    role.value = null
    localStorage.removeItem("token")
    localStorage.removeItem("role")
  }

  return { token, role, isLoggedIn, login, logout }
})
