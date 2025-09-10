import { ref, onMounted } from 'vue'
import type { User } from '@/types'

export function useUserInfo() {
    const userInfo = ref<User | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    const fetchUserInfo = async () => {
        loading.value = true
        error.value = null
        try {
            const res = await fetch('/api/user/userinfo', { credentials: 'include' })
            if (!res.ok) throw new Error('Failed to fetch user info')
            const data = await res.json()
            userInfo.value = data[0] || null // Assuming the API returns an array of users
        } catch (err: any) {
            error.value = err.message || 'Unknown error'
        } finally {
            loading.value = false
        }
    }

    onMounted(fetchUserInfo)

    return {
        userInfo,
        loading,
        error,
        fetchUserInfo,
    }
}