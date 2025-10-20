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
      // Get user's orders with details
      const [orderRows] = await conn.execute(`
        SELECT 
          o.orderid,
          o.status,
          o.totalamount as total,
          o.createdat as created_at,
          o.updatedat,
          o.paymentmethod,
          a.firstname as shipping_name,
          a.lastname as shipping_lastname,
          CONCAT(a.postalcode, ' ', a.prefecture, ' ', a.city, ' ', a.town, ' ', IFNULL(a.building, '')) as shipping_address,
          a.phone as shipping_phone
        FROM \`Order\` o
        LEFT JOIN Address a ON o.addressid = a.addressid
        WHERE o.userid = ?
        ORDER BY o.createdat DESC
      `, [userid])

      const orders = []
      for (const order of orderRows as any[]) {
        // Get order items for each order
        const [itemRows] = await conn.execute(`
          SELECT 
            oi.drinkid,
            oi.quantity,
            oi.price,
            ud.name as drink_name,
            d.imageurl as drink_image
          FROM OrderItem oi
          LEFT JOIN UserDrink ud ON oi.drinkid = ud.drinkid AND ud.userid = ?
          LEFT JOIN Drink d ON oi.drinkid = d.drinkid
          WHERE oi.orderid = ?
        `, [userid, order.orderid])

        orders.push({
          ...order,
          items: itemRows
        })
      }

      return res.status(200).json(orders)
    }

    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
    
  } catch (error) {
    console.error('User orders handler error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}