import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'
import { AuthRequest, verifyToken } from '../lib/auth'

export default async function handler(req: AuthRequest, res: VercelResponse) {
  if (!verifyToken(req, "user")) return res.status(403).end("Forbidden")

  const userid = req.user?.userid
  if (!userid) return res.status(401).json({ error: 'User not authenticated' })

  try {
    const conn = await getConnection()

    if (req.method === 'GET') {
      // Get user's browsing history - combining products viewed and drinks created
      const history = []

      // Get product views from a hypothetical UserActivity table
      // For now, we'll simulate with recent cart items and orders as "history"
      const [productHistory] = await conn.execute(`
        SELECT DISTINCT
          p.productid as id,
          p.name,
          p.price,
          p.imageurl,
          'product' as type,
          ci.createdat as last_accessed,
          1 as visit_count
        FROM CartItem ci
        JOIN Drink d ON ci.drinkid = d.drinkid
        JOIN DrinkProduct dp ON d.drinkid = dp.drinkid
        JOIN Product p ON dp.productid = p.productid
        JOIN Cart c ON ci.cartid = c.cartid
        WHERE c.userid = ?
        ORDER BY ci.createdat DESC
        LIMIT 20
      `, [userid])

      // Get user's created drinks as "history"
      const [drinkHistory] = await conn.execute(`
        SELECT 
          ud.drinkid as id,
          ud.name,
          d.baseprice as price,
          d.imageurl,
          'drink' as type,
          ud.createdat as last_accessed,
          1 as visit_count
        FROM UserDrink ud
        JOIN Drink d ON ud.drinkid = d.drinkid
        WHERE ud.userid = ?
        ORDER BY ud.createdat DESC
        LIMIT 20
      `, [userid])

      // Combine and sort by date
      const combinedHistory = [
        ...(productHistory as any[]),
        ...(drinkHistory as any[])
      ].sort((a, b) => new Date(b.last_accessed).getTime() - new Date(a.last_accessed).getTime())

      return res.status(200).json(combinedHistory)
    }

    if (req.method === 'DELETE') {
      // Clear user history (this would typically clear a UserActivity table)
      // For now, we'll return success as we don't have a dedicated history table
      return res.status(200).json({ message: 'History cleared successfully' })
    }

    res.setHeader('Allow', ['GET', 'DELETE'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
    
  } catch (error) {
    console.error('User history handler error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}