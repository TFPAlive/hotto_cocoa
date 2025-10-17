import { VercelRequest, VercelResponse } from "@vercel/node";
import { getConnection } from "../lib/db_conn";

type Item = { productid: number; quantity: number }

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const q = req.query || {}
		const action = String((q as any).action || '')

		// GET /api/user/products -> list all products
		if (req.method === 'GET' && !action) {
			const connection = await getConnection();
			const [rows] = await connection.execute("SELECT * FROM Product");
			return res.status(200).json(rows);
		}

		// GET /api/user/products?action=drinkProducts -> list DrinkProduct joins
		if (req.method === 'GET' && action === 'drinkProducts') {
			const connection = await getConnection();
			const [rows] = await connection.execute(`SELECT 
				dp.drinkid, dp.productid, dp.quantity,
				p.name, p.price, p.category, p.description
			FROM DrinkProduct dp
			INNER JOIN Product p ON dp.productid = p.productid`)
			return res.status(200).json(rows);
		}

		// POST /api/user/products?action=create -> createDrink logic
		if (req.method === 'POST' && action === 'create') {
			const body = req.body || {}

			const { drinkname, description, imageurl, uniqueid } = body

			if (!drinkname || typeof drinkname !== 'string') {
				return res.status(400).json({ error: 'Drink name is required and must be a string' })
			}

			let items: Item[] = []
			if (Array.isArray(body.products)) {
				items = body.products
			} else if (body.productid || body.quantity != null) {
				items = [{ productid: Number(body.productid), quantity: Number(body.quantity) }]
			}

			items = items.map(it => ({ productid: Number(it.productid), quantity: Number(it.quantity) })).filter(it => Number.isInteger(it.productid) && Number.isInteger(it.quantity) && it.quantity > 0)

			if (items.length === 0) {
				return res.status(400).json({ error: 'At least one valid product with positive quantity is required' })
			}

			const baseprice = body.price && typeof body.price === 'number' ? body.price : 0

			const userid = Number(body.userid)
			if (!userid || !Number.isInteger(userid) || userid <= 0) {
				return res.status(401).json({ error: 'Unauthorized: valid userid required' })
			}

			const conn = await getConnection()
			try {
				await conn.query('START TRANSACTION')

				let drinkid: number
				const [uniqueIdRows] = await conn.query('SELECT drinkid FROM Drink WHERE uniqueid = ?', [uniqueid]) as any
				if (!uniqueIdRows || uniqueIdRows.length === 0) {
					const [drinkResult] = await conn.query('INSERT INTO Drink (description, baseprice, createdat, imageurl, uniqueid) VALUES (?, ?, NOW(), ?, ?)', [ description || null, baseprice, imageurl || null, uniqueid ]) as any
					drinkid = (drinkResult as any).insertId

					for (const it of items) {
						await conn.query('INSERT INTO DrinkProduct (drinkid, productid, quantity) VALUES (?, ?, ?)', [ drinkid, it.productid, it.quantity ])
					}
				} else {
					drinkid = uniqueIdRows[0].drinkid
				}

				const [uniqueNameRows] = await conn.query('SELECT * FROM UserDrink WHERE userid = ? AND drinkid = ? LIMIT 1', [userid, drinkid]) as any
				if (!(uniqueNameRows && uniqueNameRows.length > 0)) {
					await conn.query('INSERT INTO UserDrink (userid, drinkid, name, createdat) VALUES (?, ?, ?, NOW())', [ userid, drinkid, drinkname ])
				}

				await conn.query('COMMIT')

				return res.status(201).json({
					message: 'Drink created successfully',
					drink: { drinkid, name: drinkname, description, baseprice, imageurl: imageurl || null, products: items }
				})
			} catch (transactionError) {
				try { await conn.query('ROLLBACK') } catch(_) {}
				console.error('Transaction error creating drink:', transactionError)
				return res.status(500).json({ error: 'Failed to create drink' })
			}
		}

		res.setHeader('Allow', ['GET','POST'])
		return res.status(405).end()
	} catch (error) {
		console.error('Products handler error:', error)
		return res.status(500).json({ error: 'Internal Server Error' })
	}
}