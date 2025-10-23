import { ref, computed, watch } from 'vue'
import { useProducts } from './useProducts'

export function useStore() {
  const { products, loading, error, fetchProducts } = useProducts()

  // Filter states
  const selectedFilters = ref({
    ingredients: [] as string[],
    drinkBase: [] as string[],
    chocoBombs: [] as string[],
    dippedCookies: [] as string[],
    marshmallows: [] as string[],
    sprinkles: [] as string[],
    topCream: [] as string[],
    scoops: [] as string[],
    mugsOrCups: [] as string[],
    costumService: [] as string[]
  })

  // Search and sort
  const searchQuery = ref('')
  const sortBy = ref('featured')

  // Watch for search changes and apply server-side filtering
  watch([searchQuery, sortBy], async ([newSearch, newSort]) => {
    await fetchProducts({
      search: newSearch || undefined,
      sortBy: newSort === 'featured' ? undefined : newSort
    })
  }, { immediate: false })

  // Client-side filtering for advanced filters
  const filteredProducts = computed(() => {
    let filtered = products.value

    // Apply client-side category filters
    Object.entries(selectedFilters.value).forEach(([filterKey, selectedOptions]) => {
      if (selectedOptions.length > 0) {
        filtered = filtered.filter(product => {
          const productKeywords = product.keyword?.toLowerCase() || ''
          const productCategory = product.category?.toLowerCase() || ''
          const productDescription = product.description?.toLowerCase() || ''
          
          return selectedOptions.some(option => 
            productKeywords.includes(option.toLowerCase()) ||
            productCategory.includes(option.toLowerCase()) ||
            productDescription.includes(option.toLowerCase())
          )
        })
      }
    })

    return filtered
  })

  // Clear all filters
  function clearAllFilters() {
    Object.keys(selectedFilters.value).forEach(key => {
      (selectedFilters.value as any)[key] = []
    })
    searchQuery.value = ''
    sortBy.value = 'featured'
  }

  // Get active filter count
  const activeFilterCount = computed(() => {
    return Object.values(selectedFilters.value).reduce((count, filters) => {
      return count + filters.length
    }, 0) + (searchQuery.value ? 1 : 0)
  })

  return {
    // Data
    products: filteredProducts,
    loading,
    error,
    
    // Filters
    selectedFilters,
    searchQuery,
    sortBy,
    activeFilterCount,
    
    // Methods
    fetchProducts,
    clearAllFilters
  }
}