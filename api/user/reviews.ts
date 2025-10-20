import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'
import { AuthRequest, verifyToken } from '../lib/auth'

export default async function handler(req: AuthRequest, res: VercelResponse) {
  if (!verifyToken(req, "user")) return res.status(403).end("Forbidden")

  const userid = req.user?.userid
  if (!userid) return res.status(401).json({ error: 'User not authenticated' })

  try {
    const conn = await getConnection()

    // Note: Reviews table should be created using database/02_mypage_tables.sql

    if (req.method === 'GET') {
      // Get user's reviews
      const [reviewRows] = await conn.execute(`
        SELECT 
          r.reviewid,
          r.rating,
          r.title,
          r.comment,
          r.status,
          r.createdat,
          r.updatedat,
          CASE 
            WHEN r.product_id IS NOT NULL THEN p.name
            WHEN r.drink_id IS NOT NULL THEN ud.name
            ELSE 'Unknown Item'
          END as product_name,
          CASE 
            WHEN r.product_id IS NOT NULL THEN p.imageurl
            WHEN r.drink_id IS NOT NULL THEN d.imageurl
            ELSE NULL
          END as product_image
        FROM Reviews r
        LEFT JOIN Product p ON r.product_id = p.productid
        LEFT JOIN UserDrink ud ON r.drink_id = ud.drinkid AND ud.userid = ?
        LEFT JOIN Drink d ON r.drink_id = d.drinkid
        WHERE r.userid = ?
        ORDER BY r.createdat DESC
      `, [userid, userid])

      return res.status(200).json(reviewRows)
    }

    if (req.method === 'POST') {
      const { order_id, drink_id, product_id, rating, title, comment } = req.body

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' })
      }

      if (!order_id && !drink_id && !product_id) {
        return res.status(400).json({ error: 'Must specify order_id, drink_id, or product_id' })
      }

      const [result] = await conn.execute(`
        INSERT INTO Reviews (userid, order_id, drink_id, product_id, rating, title, comment) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [userid, order_id || null, drink_id || null, product_id || null, rating, title || '', comment || ''])

      return res.status(201).json({ 
        reviewid: (result as any).insertId,
        message: 'Review submitted successfully' 
      })
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
    
  } catch (error) {
    console.error('User reviews handler error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}