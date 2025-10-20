import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../../../lib/db_conn'
import { AuthRequest, verifyToken } from '../../../lib/auth'

export default async function handler(req: AuthRequest, res: VercelResponse) {
  const { id } = req.query

  if (!verifyToken(req, "user")) return res.status(403).end("Forbidden")

  const userid = req.user?.userid
  if (!userid) return res.status(401).json({ error: 'User not authenticated' })

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Valid order ID is required' })
  }

  const orderid = Number(id)
  if (!Number.isInteger(orderid)) {
    return res.status(400).json({ error: 'Invalid order ID format' })
  }

  try {
    const conn = await getConnection()

    if (req.method === 'PUT') {
      // Check if order belongs to user and can be cancelled
      const [orderRows] = await conn.execute(
        'SELECT orderid, status FROM `Order` WHERE orderid = ? AND userid = ?',
        [orderid, userid]
      )

      if (!Array.isArray(orderRows) || (orderRows as any).length === 0) {
        return res.status(404).json({ error: 'Order not found' })
      }

      const order = (orderRows as any)[0]
      
      // Only allow cancellation of pending or processing orders
      if (!['pending', 'processing'].includes(order.status)) {
        return res.status(400).json({ error: 'Order cannot be cancelled in current status' })
      }

      // Update order status to cancelled
      await conn.execute(
        'UPDATE `Order` SET status = ?, updatedat = CURRENT_TIMESTAMP WHERE orderid = ? AND userid = ?',
        ['cancelled', orderid, userid]
      )

      return res.status(200).json({ message: 'Order cancelled successfully' })
    }

    res.setHeader('Allow', ['PUT'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
    
  } catch (error) {
    console.error('Cancel order handler error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}