import { ref, computed } from 'vue'
import axios from 'axios'

interface UserProfile {
  userid: number
  username: string
  email: string
  phone?: string
  firstname?: string
  lastname?: string
  birthdate?: string
  gender?: string
  avatar?: string
  createdat: string
  updatedat: string
}

const userProfile = ref<UserProfile | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

export function useUserProfile() {
  const fetchProfile = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await axios.get('/api/user/profile', {
        withCredentials: true
      })
      userProfile.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch profile'
      console.error('Error fetching profile:', err)
    } finally {
      isLoading.value = false
    }
  }

  const updateProfile = async (data: Partial<UserProfile>) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await axios.put('/api/user/profile', data, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      userProfile.value = { ...userProfile.value, ...response.data }
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update profile'
      console.error('Error updating profile:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const displayName = computed(() => {
    if (!userProfile.value) return 'User'

    const { username } = userProfile.value
    return username || 'User'
  })

  const avatarUrl = computed(() => {
    return userProfile.value?.avatar || '/default-avatar.png'
  })

  return {
    userProfile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    displayName,
    avatarUrl
  }
}