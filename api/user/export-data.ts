import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'
import { AuthRequest, verifyToken } from '../lib/auth'

export default async function handler(req: AuthRequest, res: VercelResponse) {
  if (!verifyToken(req, "user")) return res.status(403).end("Forbidden")

  const userid = req.user?.userid
  if (!userid) return res.status(401).json({ error: 'User not authenticated' })

  const { type } = req.query

  if (!type || Array.isArray(type)) {
    return res.status(400).json({ error: 'Export type is required' })
  }

  const exportType = String(type)
  const validTypes = ['profile', 'orders', 'reviews', 'favorites', 'history', 'all']
  
  if (!validTypes.includes(exportType)) {
    return res.status(400).json({ error: 'Invalid export type' })
  }

  try {
    const conn = await getConnection()

    if (req.method === 'GET') {
      let exportData: any = {}
      
      // Export user profile data
      if (exportType === 'profile' || exportType === 'all') {
        const [userRows] = await conn.execute(
          'SELECT userid, username, email, phone, firstname, lastname, birthdate, gender, createdat FROM User WHERE userid = ?',
          [userid]
        )
        exportData.profile = (userRows as any[])[0] || null
      }

      // Export order history
      if (exportType === 'orders' || exportType === 'all') {
        const [orderRows] = await conn.execute(`
          SELECT o.*, 
                 GROUP_CONCAT(CONCAT(oi.drinkid, ':', oi.quantity, ':', oi.price)) as items
          FROM \`Order\` o
          LEFT JOIN OrderItem oi ON o.orderid = oi.orderid
          WHERE o.userid = ?
          GROUP BY o.orderid
          ORDER BY o.createdat DESC
        `, [userid])
        exportData.orders = orderRows || []
      }

      // Export reviews
      if (exportType === 'reviews' || exportType === 'all') {
        try {
          const [reviewRows] = await conn.execute(
            'SELECT * FROM Reviews WHERE userid = ? ORDER BY createdat DESC',
            [userid]
          )
          exportData.reviews = reviewRows || []
        } catch (reviewError) {
          // Table might not exist yet
          exportData.reviews = []
        }
      }

      // Export favorites
      if (exportType === 'favorites' || exportType === 'all') {
        try {
          const [favoriteRows] = await conn.execute(
            'SELECT * FROM Favorites WHERE userid = ? ORDER BY createdat DESC',
            [userid]
          )
          exportData.favorites = favoriteRows || []
        } catch (favoriteError) {
          // Table might not exist yet
          exportData.favorites = []
        }
      }

      // Export browsing history (simplified)
      if (exportType === 'history' || exportType === 'all') {
        const [drinkRows] = await conn.execute(
          'SELECT * FROM UserDrink WHERE userid = ? ORDER BY createdat DESC',
          [userid]
        )
        exportData.history = drinkRows || []
      }

      // Add metadata
      exportData.metadata = {
        exportType,
        exportDate: new Date().toISOString(),
        userId: userid
      }

      // Set headers for file download
      const filename = `${exportType}_export_${new Date().toISOString().split('T')[0]}.json`
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      
      return res.status(200).json(exportData)
    }

    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
    
  } catch (error) {
    console.error('Data export handler error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}