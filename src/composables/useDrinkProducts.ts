import { ref } from 'vue'
import type { Drink } from '@/types'

export function useDrinkProducts() {
    const drinkProducts = ref<Drink[]>([])

    const fetchDrinkProducts = async (drinkid: number) => {
        try {
            const response = await fetch(`/api/user/drinkProducts?drinkid=${drinkid}`)
            if (!response.ok) throw new Error("Failed to fetch drink products")
            const data = await response.json()
            drinkProducts.value = data
            return data
        } catch (error) {
            console.error(error)
            return []
        }
    }

    return { drinkProducts, fetchDrinkProducts }
}
