import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'

type Item = { productid: number; quantity: number }

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', ['POST'])
		return res.status(405).end(`Method ${req.method} Not Allowed`)
	}

	try {
		const body = req.body || {}

		// Extract and validate products
		const item = { drinkid: Number(body.drinkid), quantity: 1 }

		if (!item.drinkid || item.quantity <= 0) {
			return res.status(400).json({
				error: 'Product ID is required'
			})
		}

		// === AUTH — adjust to your auth system ===
		const userid = Number(body.userid)
		if (!userid || !Number.isInteger(userid) || userid <= 0) {
			return res.status(401).json({
				error: 'Unauthorized: valid userid required'
			})
		}

		const conn = await getConnection()

		try {
			// Start transaction
			await conn.query('START TRANSACTION')

			// Get or create cart
			const [cartRows] = await conn.query('SELECT * FROM Cart WHERE userid = ? LIMIT 1', [userid]) as any
			let cartid: number
			if (!cartRows || cartRows.length === 0) {
				const [insertResult] = await conn.query( 'INSERT INTO Cart (userid, createdat, updatedat) VALUES (?, NOW(), NOW())', [userid] ) as any
				cartid = insertResult.insertId
			} else {
				cartid = cartRows[0].cartid
				await conn.query('UPDATE Cart SET updatedat = NOW() WHERE cartid = ?', [cartid])
			}

			const [productRows] = await conn.query('SELECT baseprice FROM Drink WHERE drinkid = ? LIMIT 1', [item.drinkid]) as any
			if (!productRows || productRows.length === 0) {
				await conn.query('ROLLBACK')
				return res.status(404).json({ error: `Drink ${item.drinkid} not found` })
			}
			const price = productRows[0].baseprice

			const [existing] = await conn.query( 'SELECT * FROM CartItem WHERE cartid = ? AND drinkid = ? LIMIT 1', [cartid, item.drinkid] ) as any
			if (existing && existing.length > 0) {
				await conn.query( 'UPDATE CartItem SET quantity = quantity + ?, price = ? WHERE cartitemid = ?', [item.quantity, price, existing[0].cartitemid] )
			} else {
				await conn.query( `INSERT INTO CartItem (cartid, drinkid, quantity, price) VALUES (?, ?, ?, ?)`, [cartid, item.drinkid, item.quantity, price] )
			}

			await conn.query('COMMIT')

			// Return updated cart items
			const [cartItems] = await conn.query(
				`SELECT ci.cartitemid, ci.drinkid, ci.quantity, ci.price, ud.name, d.imageurl
				FROM CartItem ci
				JOIN Drink d ON ci.drinkid = d.drinkid
				JOIN UserDrink ud ON ci.drinkid = ud.drinkid
				WHERE ci.cartid = ?`,
				[cartid] ) as any

			return res.status(200).json({ cartid, items: cartItems })

		} catch (dbErr) {
			console.error('DB error:', dbErr)
			try {
				await conn.query('ROLLBACK')
			} catch (_) {}
			return res.status(500).json({ error: 'Failed to add products to cart' })
		} finally {
			// release connection if your getConnection returns a pooled connection
			try {
				if (conn && typeof(conn as any).release === 'function')(conn as any).release()
			} catch (_) {}
		}
	} catch (err) {
		console.error('Server error:', err)
		return res.status(500).json({ error: 'Server error' })
	}
}