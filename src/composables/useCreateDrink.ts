import { ref } from 'vue'
import type { Product } from '@/types'

export function useCreateDrink(selectedProducts: Record<string, Product | undefined>, drinkname: string, price: number) {
    const creating = ref(false)
    const error = ref<string | null>(null)

    async function createDrink() {
      creating.value = true
      error.value = null

      try {
        const products = Object.values(selectedProducts)
          .filter((p): p is Product => !!p)
          .map(p => ({
            productid: p.productid, // adjust if your Product type uses a different key
            quantity: 1, // make sure Product has this field
          }))
        const res = await fetch('/api/user/createDrink', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ drinkname, products, price })
        })
        if (!res.ok) throw new Error('Network response was not ok')
      } catch (err) {
        error.value = 'Failed to create drink'
        console.error(err)
      } finally {
        creating.value = false
      }
    }

    return { creating, error, createDrink }
}
