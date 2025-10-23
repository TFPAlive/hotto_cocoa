import { ref, computed } from 'vue'
import type { Product } from '@/types'

interface Review {
  reviewid: number
  productid: number
  userid: number
  username?: string
  rating: number
  comment: string
  createdat: string
  helpful_yes?: number
  helpful_no?: number
}

export function useProductDetail() {
  const product = ref<Product | null>(null)
  const reviews = ref<Review[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const averageRating = computed(() => {
    if (reviews.value.length === 0) return 0
    const sum = reviews.value.reduce((acc, review) => acc + review.rating, 0)
    return sum / reviews.value.length
  })

  const totalReviews = computed(() => reviews.value.length)

  // Fetch single product
  async function fetchProduct(productId: number) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`/api/user/products/${productId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found')
        }
        throw new Error('Failed to fetch product')
      }
      
      const data = await response.json()
      product.value = data
    } catch (err: any) {
      error.value = err.message || 'Unknown error occurred'
      product.value = null
    } finally {
      loading.value = false
    }
  }

  // Fetch product reviews
  async function fetchReviews(productId: number) {
    try {
      const response = await fetch(`/api/user/product-reviews?productid=${productId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }
      
      const data = await response.json()
      reviews.value = Array.isArray(data) ? data : []
    } catch (err: any) {
      console.error('Error fetching reviews:', err)
      reviews.value = []
    }
  }

  // Submit new review
  async function submitReview(productId: number, userId: number, rating: number, comment: string, title?: string) {
    try {
      const response = await fetch('/api/user/product-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productid: productId,
          userid: userId,
          rating,
          comment,
          title: title || ''
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit review')
      }

      const result = await response.json()
      // Refresh reviews after submission
      await fetchReviews(productId)
      return result.review
    } catch (err: any) {
      throw new Error(err.message || 'Failed to submit review')
    }
  }

  return {
    // State
    product,
    reviews,
    loading,
    error,
    
    // Computed
    averageRating,
    totalReviews,
    
    // Methods
    fetchProduct,
    fetchReviews,
    submitReview
  }
}