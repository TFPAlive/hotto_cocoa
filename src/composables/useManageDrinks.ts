import { ref } from 'vue'
import type { Drink } from '@/types'

export function useManageDrinks(fetchDrinks: () => Promise<void>) {
	const loading = ref(false)
	const error = ref<string | null>(null)

	// Add drink
	async function addDrink(drink: Omit<Drink, 'drinkid'> & { file?: File }) {
		loading.value = true
		error.value = null

		try {
			let imageurl = drink.imageurl

			if (drink.file) {
				// Get signed URL from backend
				const uploadRes = await fetch(`/api/admin/drinks/file?fileName=${encodeURIComponent(drink.file.name)}&fileType=${encodeURIComponent(drink.file.type)}`, {
					credentials: 'include'
				})
				if (!uploadRes.ok) throw new Error('Failed to get upload URL')
				const { uploadUrl, publicUrl } = await uploadRes.json()

				// Upload file to GCS
				const putRes = await fetch(uploadUrl, {
					method: 'PUT',
					headers: { 'Content-Type': drink.file.type },
					body: drink.file
				})

				if (!putRes.ok) throw new Error('Failed to upload file')
				imageurl = publicUrl
			}

			// Send drink data to API
			const drinkData = {
				description: drink.description,
				baseprice: drink.baseprice,
				imageurl,
				productids: drink.productids.map(id => ({ productid: id, quantity: 1 }))
			}

			const res = await fetch('/api/admin/drinks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(drinkData)
			})

			if (!res.ok) throw new Error('Failed to add drink')
			await fetchDrinks()
			return true
		} catch (err: any) {
			error.value = err.message || 'Error adding drink'
			return false
		} finally {
			loading.value = false
		}
	}

	// Edit drink
	async function editDrink(id: string, drink: Omit<Drink, 'drinkid'> & { file?: File }) {
		loading.value = true
		error.value = null
		try {
            let imageurl = drink.imageurl
			if (drink.file) {
				// Get signed URL from backend
				const uploadRes = await fetch(`/api/admin/drinks/file?fileName=${encodeURIComponent(drink.file.name)}&fileType=${encodeURIComponent(drink.file.type)}`, {
					credentials: 'include'
				})
				if (!uploadRes.ok) throw new Error('Failed to get upload URL')
				const { uploadUrl, publicUrl } = await uploadRes.json()

				// Upload file to GCS
				const putRes = await fetch(uploadUrl, {
					method: 'PUT',
					headers: { 'Content-Type': drink.file.type },
					body: drink.file
				})

				if (!putRes.ok) throw new Error('Failed to upload file')

				if (drink.imageurl) {
					const deleteRes = await fetch(`/api/admin/drinks/file?fileName=${encodeURIComponent(drink.imageurl?.split('/').pop() || '')}`, { 
						method: 'DELETE',
						credentials: 'include'
					})
					if (!deleteRes.ok) console.warn('Failed to delete old image')
				}
				imageurl = publicUrl
			}
			// Send drink data to API
			const drinkData = {
				description: drink.description,
				baseprice: drink.baseprice,
				imageurl,
				productids: drink.productids.map(id => ({ productid: id, quantity: 1 }))
			}

			const res = await fetch(`/api/admin/drinks/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(drinkData)
			})

			if (!res.ok) throw new Error('Failed to update drink')
			await fetchDrinks()
			return true
		} catch (err: any) {
			error.value = err.message || 'Error updating drink'
			return false
		} finally {
			loading.value = false
		}
	}

	// Delete drink
	async function deleteDrink(id: string) {
		loading.value = true
		error.value = null
		
		try {
			const res = await fetch(`/api/admin/drinks/${id}`, { 
				method: 'DELETE',
				credentials: 'include'
			})
			if (!res.ok) throw new Error('Failed to delete drink')
			await fetchDrinks()
			return true
		} catch (err: any) {
			error.value = err.message || 'Error deleting drink'
			return false
		} finally {
			loading.value = false
		}
	}

	return { addDrink, editDrink, deleteDrink, loading, error }
}