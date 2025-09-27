import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../../lib/db_conn'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string | undefined

  if (req.method === 'GET') {
    if (id) {
      // Get single product
      try {
        const conn = await getConnection()
        const [rows] = await conn.query('SELECT * FROM Product WHERE productid = ?', [id])
        if (Array.isArray(rows) && rows.length > 0) {
          res.status(200).json(rows[0])
        } else {
          res.status(404).json({ error: 'Product not found' })
        }
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch product' })
      }
    } else {
      res.status(400).json({ error: 'Product id is required' })
    }
  } else if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'Product id is required' })
    const { name, description, price, material, keyword, category, imageurl } = req.body
    try {
      const conn = await getConnection()
      await conn.query(
        'UPDATE Product SET name = ?, price = ?, description = ?, material = ?, keyword = ?, category = ?, imageurl = ? WHERE productid = ?',
        [name, price, description ?? '', material ?? '', keyword ?? '', category ?? '', imageurl ?? '', id]
      )
      res.status(200).json({ id, name, description, price, material, keyword, category, imageurl })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Failed to update product' })
    }
  } else if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'Product id is required' })
    try {
      const conn = await getConnection()
      await conn.query('DELETE FROM Product WHERE productid = ?', [id])
      res.status(204).end()
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Failed to delete product' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
