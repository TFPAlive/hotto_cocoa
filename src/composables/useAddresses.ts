import { ref } from "vue"
import { auth } from "./useAuth"
import type { Address } from "@/types"

const addresses = ref<Address[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const fetchAddresses = async () => {
    loading.value = true
    error.value = null
    try {
    const response = await fetch(`/api/user/address?userid=${auth.user?.userid}`, { credentials: 'include' })
        if (!response.ok) throw new Error("Failed to fetch addresses")
        const data = await response.json()
        addresses.value = Array.isArray(data) ? data as Address[] : []
    } catch (err: any) {
        error.value = err.message || 'Unknown error'
    } finally {
        loading.value = false
    }
}

export function useAddresses() {
  return { addresses, loading, error, fetchAddresses }
}