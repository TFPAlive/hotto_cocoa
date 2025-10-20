import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../../lib/db_conn'
import { AuthRequest, verifyToken } from '../../lib/auth'

export default async function handler(req: AuthRequest, res: VercelResponse) {
  const { id } = req.query

  if (!verifyToken(req, "user")) return res.status(403).end("Forbidden")

  const userid = req.user?.userid
  if (!userid) return res.status(401).json({ error: 'User not authenticated' })

  try {
    const conn = await getConnection()

    if (req.method === 'PUT' && id) {
      const { rating, title, comment } = req.body
      const reviewid = Number(id)

      if (!Number.isInteger(reviewid)) {
        return res.status(400).json({ error: 'Invalid review ID' })
      }

      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' })
      }

      // Check if review belongs to user
      const [existingRows] = await conn.execute(
        'SELECT reviewid FROM Reviews WHERE reviewid = ? AND userid = ?',
        [reviewid, userid]
      )

      if (!Array.isArray(existingRows) || (existingRows as any).length === 0) {
        return res.status(404).json({ error: 'Review not found' })
      }

      // Update review
      await conn.execute(`
        UPDATE Reviews 
        SET rating = COALESCE(?, rating), 
            title = COALESCE(?, title), 
            comment = COALESCE(?, comment),
            status = 'pending',
            updatedat = CURRENT_TIMESTAMP
        WHERE reviewid = ? AND userid = ?
      `, [rating, title, comment, reviewid, userid])

      return res.status(200).json({ message: 'Review updated successfully' })
    }

    if (req.method === 'DELETE' && id) {
      const reviewid = Number(id)

      if (!Number.isInteger(reviewid)) {
        return res.status(400).json({ error: 'Invalid review ID' })
      }

      const [result] = await conn.execute(
        'DELETE FROM Reviews WHERE reviewid = ? AND userid = ?',
        [reviewid, userid]
      )

      if ((result as any).affectedRows === 0) {
        return res.status(404).json({ error: 'Review not found' })
      }

      return res.status(200).json({ message: 'Review deleted successfully' })
    }

    res.setHeader('Allow', ['PUT', 'DELETE'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
    
  } catch (error) {
    console.error('Review by ID handler error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}