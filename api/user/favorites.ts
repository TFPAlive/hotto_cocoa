import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'
import { AuthRequest, verifyToken } from '../lib/auth'

export default async function handler(req: AuthRequest, res: VercelResponse) {
  if (!verifyToken(req, "user")) return res.status(403).end("Forbidden")

  const userid = req.user?.userid
  if (!userid) return res.status(401).json({ error: 'User not authenticated' })

  try {
    const conn = await getConnection()

    // Note: Favorites table should be created using database/02_mypage_tables.sql

    if (req.method === 'GET') {
      // Get user's favorites
      const [favoriteRows] = await conn.execute(`
        SELECT 
          f.favoriteid,
          f.item_type as type,
          f.item_id as id,
          f.createdat as favorited_at,
          CASE 
            WHEN f.item_type = 'product' THEN p.name
            WHEN f.item_type = 'drink' THEN ud.name
          END as name,
          CASE 
            WHEN f.item_type = 'product' THEN p.price
            WHEN f.item_type = 'drink' THEN d.baseprice
          END as price,
          CASE 
            WHEN f.item_type = 'product' THEN p.imageurl
            WHEN f.item_type = 'drink' THEN d.imageurl
          END as imageurl
        FROM Favorites f
        LEFT JOIN Product p ON f.item_type = 'product' AND f.item_id = p.productid
        LEFT JOIN UserDrink ud ON f.item_type = 'drink' AND f.item_id = ud.drinkid AND ud.userid = ?
        LEFT JOIN Drink d ON f.item_type = 'drink' AND f.item_id = d.drinkid
        WHERE f.userid = ?
        ORDER BY f.createdat DESC
      `, [userid, userid])

      return res.status(200).json(favoriteRows)
    }

    if (req.method === 'POST') {
      const { item_type, item_id } = req.body

      if (!item_type || !item_id) {
        return res.status(400).json({ error: 'item_type and item_id are required' })
      }

      if (!['product', 'drink'].includes(item_type)) {
        return res.status(400).json({ error: 'item_type must be "product" or "drink"' })
      }

      try {
        await conn.execute(`
          INSERT INTO Favorites (userid, item_type, item_id) VALUES (?, ?, ?)
        `, [userid, item_type, item_id])

        return res.status(201).json({ message: 'Added to favorites successfully' })
      } catch (insertError: any) {
        if (insertError.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ error: 'Item already in favorites' })
        }
        throw insertError
      }
    }

    if (req.method === 'DELETE') {
      const { item_type, item_id } = req.body

      if (!item_type || !item_id) {
        return res.status(400).json({ error: 'item_type and item_id are required' })
      }

      const [result] = await conn.execute(`
        DELETE FROM Favorites 
        WHERE userid = ? AND item_type = ? AND item_id = ?
      `, [userid, item_type, item_id])

      if ((result as any).affectedRows === 0) {
        return res.status(404).json({ error: 'Favorite not found' })
      }

      return res.status(200).json({ message: 'Removed from favorites successfully' })
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
    
  } catch (error) {
    console.error('User favorites handler error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}