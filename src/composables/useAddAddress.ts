import { ref } from 'vue'
import { auth } from '@/composables/useAuth'
import type { Address } from '@/types'

// Accept an address object without `addressid` (server assigns it)
export function useAddAddress(address: Omit<Address, 'addressid'>) {
    const adding = ref(false)
    const error = ref<string | null>(null)

    async function addAddress() {
        adding.value = true
        error.value = null
        try {
                const res = await fetch('/api/user/address?action=add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ userid: auth.user?.userid, ...address }),
            })
            if (!res.ok) throw new Error('Failed to add address')
        } catch (err: any) {
            error.value = err.message || 'Unknown error'
        }
        adding.value = false
    }

    return { adding, error, addAddress }
}