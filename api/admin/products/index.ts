import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../../lib/db_conn'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const conn = await getConnection()
      const [rows] = await conn.query('SELECT * FROM products')
      res.status(200).json(rows)
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch products' })
    }
  } else if (req.method === 'POST') {
    const { name, description, price, material, keyword, category, imageUrl } = req.body
    if (!name || price == null) {
      return res.status(400).json({ error: 'Name and price are required' })
    }
    try {
      const conn = await getConnection()
      const [result]: any = await conn.query(
        'INSERT INTO Product (name, description, price, material, keyword, category, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, description ?? '', price, material ?? '', keyword ?? '', category ?? '', imageUrl ?? '']
      )
      res.status(201).json({ id: result?.insertId, name, description, price, material, keyword, category, imageUrl })
    } catch (err) {
      res.status(500).json({ error: 'Failed to add product' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
