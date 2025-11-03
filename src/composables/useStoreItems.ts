import { ref, computed, watch } from 'vue'

interface StoreItem {
  productid?: number
  drinkid?: number
  name: string
  price: number
  imageurl?: string
  description?: string
  category?: string
  keyword?: string
  material?: string
  item_type: 'product' | 'drink'
  drinkname?: string
}

export function useStoreItems() {
  const items = ref<StoreItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Filter states
  const selectedFilters = ref({
    itemType: [] as string[], // 'products', 'drinks'
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

  // Fetch both products and drinks
  async function fetchStoreItems(params?: { search?: string; sortBy?: string }) {
    loading.value = true
    error.value = null
    
    try {
      const searchParam = params?.search || searchQuery.value
      const sortParam = params?.sortBy || sortBy.value
      
      // Build query parameters
      const queryParams = new URLSearchParams()
      if (searchParam) queryParams.append('search', searchParam)
      if (sortParam && sortParam !== 'featured') queryParams.append('sortBy', sortParam)

      // Fetch products and drinks in parallel
      const [productsResponse, drinksResponse] = await Promise.all([
        fetch(`/api/user/products?${queryParams.toString()}`),
        fetch(`/api/user/products?action=drinks&${queryParams.toString()}`)
      ])

      if (!productsResponse.ok || !drinksResponse.ok) {
        throw new Error('Failed to fetch store items')
      }

      const [products, drinks] = await Promise.all([
        productsResponse.json(),
        drinksResponse.json()
      ])

      // Normalize the data structure
      const normalizedProducts: StoreItem[] = products.map((p: any) => ({
        ...p,
        item_type: 'product' as const,
        name: p.name,
        price: p.price
      }))

      const normalizedDrinks: StoreItem[] = drinks.map((d: any) => ({
        ...d,
        item_type: 'drink' as const,
        name: d.drinkname || d.name,
        price: d.price || d.baseprice || 0
      }))

      // Combine and sort
      const combined = [...normalizedProducts, ...normalizedDrinks]
      
      // Apply sorting if not handled server-side
      if (sortParam === 'featured') {
        // Products first, then drinks, both by ID/creation date
        combined.sort((a, b) => {
          if (a.item_type !== b.item_type) {
            return a.item_type === 'product' ? -1 : 1
          }
          return (a.productid || a.drinkid || 0) - (b.productid || b.drinkid || 0)
        })
      }

      items.value = combined
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching store items:', err)
    } finally {
      loading.value = false
    }
  }

  // Watch for search changes
  watch([searchQuery, sortBy], async ([newSearch, newSort]) => {
    await fetchStoreItems({
      search: newSearch || undefined,
      sortBy: newSort === 'featured' ? undefined : newSort
    })
  }, { immediate: false })

  // Client-side filtering
  const filteredItems = computed(() => {
    let filtered = items.value

    // Apply item type filter
    if (selectedFilters.value.itemType.length > 0) {
      filtered = filtered.filter(item => {
        if (selectedFilters.value.itemType.includes('products') && item.item_type === 'product') return true
        if (selectedFilters.value.itemType.includes('drinks') && item.item_type === 'drink') return true
        return false
      })
    }

    // Apply other category filters (for products mainly)
    Object.entries(selectedFilters.value).forEach(([filterKey, selectedOptions]) => {
      if (filterKey === 'itemType' || selectedOptions.length === 0) return
      
      filtered = filtered.filter(item => {
        const itemKeywords = item.keyword?.toLowerCase() || ''
        const itemCategory = item.category?.toLowerCase() || ''
        const itemDescription = item.description?.toLowerCase() || ''
        
        return selectedOptions.some(option => 
          itemKeywords.includes(option.toLowerCase()) ||
          itemCategory.includes(option.toLowerCase()) ||
          itemDescription.includes(option.toLowerCase())
        )
      })
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
    items: filteredItems,
    loading,
    error,
    
    // Filters
    selectedFilters,
    searchQuery,
    sortBy,
    activeFilterCount,
    
    // Methods
    fetchStoreItems,
    clearAllFilters
  }
}