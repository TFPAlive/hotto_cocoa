import { VercelRequest, VercelResponse } from "@vercel/node";
import { getConnection } from "../lib/db_conn";

type Item = { productid: number; quantity: number }

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const q = req.query || {}
		const action = String((q as any).action || '')

		// GET /api/user/products -> list all products with optional filtering
		if (req.method === 'GET' && !action) {
			const connection = await getConnection();
			
			// Get query parameters for filtering
			const { search, category, sortBy } = q as any;
			
			let query = "SELECT * FROM Product WHERE 1=1";
			const params: any[] = [];
			
			// Add search filter
			if (search && typeof search === 'string' && search.trim()) {
				query += " AND (name LIKE ? OR description LIKE ? OR keyword LIKE ?)";
				const searchTerm = `%${search.trim()}%`;
				params.push(searchTerm, searchTerm, searchTerm);
			}
			
			// Add category filter
			if (category && typeof category === 'string' && category.trim()) {
				query += " AND category = ?";
				params.push(category.trim());
			}
			
			// Add sorting
			switch (sortBy) {
				case 'price-low':
					query += " ORDER BY price ASC";
					break;
				case 'price-high':
					query += " ORDER BY price DESC";
					break;
				case 'name':
					query += " ORDER BY name ASC";
					break;
				default:
					query += " ORDER BY productid ASC"; // Default sort by ID (featured)
			}
			
			const [rows] = await connection.execute(query, params);
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

		// GET /api/user/products?action=drinks -> list all available drinks with basic info
		if (req.method === 'GET' && action === 'drinks') {
			const connection = await getConnection();
			
			// Get query parameters for filtering
			const { search, sortBy, userid } = q as any;
			
			let query = `
				SELECT DISTINCT
					d.drinkid,
					ud.name as drinkname,
					d.description,
					d.baseprice as price,
					d.imageurl,
					d.createdat,
					'drink' as item_type
				FROM Drink d
				LEFT JOIN UserDrink ud ON d.drinkid = ud.drinkid
				WHERE 1=1
			`;
			const params: any[] = [];
			
			// Add search filter
			if (search && typeof search === 'string' && search.trim()) {
				query += " AND (ud.name LIKE ? OR d.description LIKE ?)";
				const searchTerm = `%${search.trim()}%`;
				params.push(searchTerm, searchTerm);
			}
			
			// Only show drinks that have names (have been created by users)
			query += " AND ud.name IS NOT NULL";
			
			// Add sorting
			switch (sortBy) {
				case 'price-low':
					query += " ORDER BY d.baseprice ASC";
					break;
				case 'price-high':
					query += " ORDER BY d.baseprice DESC";
					break;
				case 'name':
					query += " ORDER BY ud.name ASC";
					break;
				default:
					query += " ORDER BY d.createdat DESC"; // Newest first
			}
			
			const [rows] = await connection.execute(query, params);
			return res.status(200).json(rows);
		}

		// GET /api/user/products?action=random-drink -> get a random drink recipe for a specific cup
		if (req.method === 'GET' && action === 'random-drink') {
			const connection = await getConnection();
			const cupId = parseInt(q.cupId as string);
			
			if (!cupId || isNaN(cupId)) {
				return res.status(400).json({ error: 'Valid cupId is required' });
			}
			
			try {
				// Get a random drink that uses this cup
				const [drinkRows] = await connection.execute(`
					SELECT DISTINCT d.drinkid, ud.name as drinkname, d.description, d.baseprice, d.imageurl
					FROM Drink d
					INNER JOIN DrinkProduct dp ON d.drinkid = dp.drinkid
					LEFT JOIN UserDrink ud ON d.drinkid = ud.drinkid
					WHERE dp.productid = ? AND ud.name IS NOT NULL
					ORDER BY RAND()
					LIMIT 1
				`, [cupId]);
				
				if (!Array.isArray(drinkRows) || drinkRows.length === 0) {
					// No existing drinks with this cup, create a basic random recipe
					const [randomProducts] = await connection.execute(`
						SELECT productid, name, category, price 
						FROM Product 
						WHERE category IN ('drink bases', 'choco bombs', 'marshmallows', 'sprinkles') 
						ORDER BY RAND() 
						LIMIT 3
					`);
					
					const products = [
						{ productid: cupId, category: 'mugs & cups' },
						...(Array.isArray(randomProducts) ? randomProducts.slice(0, 2).map((p: any) => ({ 
							productid: p.productid, 
							category: p.category 
						})) : [])
					];
					
					return res.status(200).json({
						drinkid: null,
						drinkname: 'Random Special',
						products: products
					});
				}
				
				// Get all products for this drink
				const drink = (drinkRows as any[])[0];
				const [productRows] = await connection.execute(`
					SELECT dp.productid, dp.quantity, p.name, p.category, p.price
					FROM DrinkProduct dp
					INNER JOIN Product p ON dp.productid = p.productid
					WHERE dp.drinkid = ?
				`, [drink.drinkid]);
				
				return res.status(200).json({
					drinkid: drink.drinkid,
					drinkname: drink.drinkname || drink.description || 'Random Special',
					products: Array.isArray(productRows) ? productRows.map((p: any) => ({
						productid: p.productid,
						category: p.category,
						quantity: p.quantity || 1
					})) : []
				});
				
			} catch (error) {
				console.error('Random drink fetch error:', error);
				return res.status(500).json({ error: 'Failed to fetch random drink' });
			}
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