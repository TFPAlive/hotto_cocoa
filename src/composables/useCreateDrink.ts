import { ref } from 'vue'
import { auth } from '@/composables/useAuth'
import type { Product } from '@/types'

export function useCreateDrink(selectedProducts: Record<string, Product | undefined>, drinkname: string, price: number) {
	const creating = ref(false)
	const error = ref<string | null>(null)
	const drinkid = ref<number | null>(null)

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

			let uniqueid = ''
			for (const p of products) uniqueid += p.productid.toString().padStart(4, '0')

			const res = await fetch('/api/user/createDrink', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ drinkname, products, price, userid: auth.user?.userid, uniqueid }),
			})

			if (!res.ok) throw new Error('Network response was not ok')

			const output = await res.json()
			drinkid.value = output.drink.drinkid

		} catch (err) {
			error.value = 'Failed to create drink'
			console.error(err)
		} finally {
			creating.value = false
		}
	}

	return { drinkid, creating, error, createDrink }
}
