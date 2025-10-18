import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../../lib/db_conn'
import { AuthRequest, verifyToken } from '../../lib/auth'

export default async function handler(req: AuthRequest, res: VercelResponse) {
	if (!verifyToken(req, "admin")) return res.status(403).end("Forbidden")
	
	if (req.method === 'GET') {
		try {
			const conn = await getConnection()
			const [rows] = await conn.query('SELECT * FROM Product')
			res.status(200).json(rows)
		} catch (err) {
			res.status(500).json({ error: 'Failed to fetch products' })
		}
	} else if (req.method === 'POST') {
		const { name, description, price, material, keyword, category, imageurl } = req.body
		if (!name || price == null) {
			return res.status(400).json({ error: 'Name and price are required' })
		}
		try {
			const conn = await getConnection()
			const [result]: any = await conn.query( 'INSERT INTO Product (name, description, price, material, keyword, category, imageurl) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, description ?? '', price, material ?? '', keyword ?? '', category ?? '', imageurl ?? ''])
			res.status(201).json({ id: result?.insertId, ...req.body })
		} catch (err) {
			res.status(500).json({ error: 'Failed to add product' })
		}
	} else {
		res.setHeader('Allow', ['GET', 'POST'])
		res.status(405).end(`Method ${req.method} Not Allowed`)
	}
}
