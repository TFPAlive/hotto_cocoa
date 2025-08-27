import { defineStore } from "pinia"
import { ref, computed } from "vue"

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem("authToken"))
  const role = ref(localStorage.getItem("userRole"))

  const isLoggedIn = computed(() => !!token.value)

  function login(newToken: string, newRole: string) {
    token.value = newToken
    role.value = newRole
    localStorage.setItem("authToken", newToken)
    localStorage.setItem("userRole", newRole)
  }

  function logout() {
    token.value = null
    role.value = null
    localStorage.removeItem("authToken")
    localStorage.removeItem("userRole")
  }

  return { token, role, isLoggedIn, login, logout }
})
