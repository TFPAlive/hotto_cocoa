import { ref, onMounted } from "vue"
import type { Drink } from "@/types"

export function useDrinks() {
	const drinks = ref<Drink[]>([])
	const loading = ref(false)
	const error = ref<string | null>(null)

	const fetchDrinks = async () => {
		loading.value = true
		error.value = null
		try {
			const res = await fetch("/api/admin/drinks", {
				credentials: 'include'
			})

			if (!res.ok) throw new Error("Failed to fetch drinks")
			drinks.value = await res.json()

		} catch (err: any) {
			error.value = err.message || "Unknown error"
		} finally {
			loading.value = false
		}
	}

	onMounted(fetchDrinks)

	return { drinks, loading, error, fetchDrinks }
}