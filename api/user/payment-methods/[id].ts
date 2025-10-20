import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../../lib/db_conn'
import { AuthRequest, verifyToken } from '../../lib/auth'

export default async function handler(req: AuthRequest, res: VercelResponse) {
  const { id } = req.query

  if (!verifyToken(req, "user")) return res.status(403).end("Forbidden")

  const userid = req.user?.userid
  if (!userid) return res.status(401).json({ error: 'User not authenticated' })

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Valid payment method ID is required' })
  }

  const paymentid = Number(id)
  if (!Number.isInteger(paymentid)) {
    return res.status(400).json({ error: 'Invalid payment method ID format' })
  }

  try {
    const conn = await getConnection()

    if (req.method === 'DELETE') {
      // Check if payment method belongs to user
      const [existingRows] = await conn.execute(
        'SELECT paymentid, is_default FROM PaymentMethods WHERE paymentid = ? AND userid = ?',
        [paymentid, userid]
      )

      if (!Array.isArray(existingRows) || (existingRows as any).length === 0) {
        return res.status(404).json({ error: 'Payment method not found' })
      }

      const paymentMethod = (existingRows as any)[0]

      // Don't allow deleting the default payment method if it's the only one
      if (paymentMethod.is_default) {
        const [countRows] = await conn.execute(
          'SELECT COUNT(*) as count FROM PaymentMethods WHERE userid = ?',
          [userid]
        )
        
        if ((countRows as any)[0].count > 1) {
          // Set another payment method as default
          await conn.execute(`
            UPDATE PaymentMethods 
            SET is_default = TRUE 
            WHERE userid = ? AND paymentid != ? 
            ORDER BY createdat ASC 
            LIMIT 1
          `, [userid, paymentid])
        }
      }

      await conn.execute(
        'DELETE FROM PaymentMethods WHERE paymentid = ? AND userid = ?',
        [paymentid, userid]
      )

      return res.status(200).json({ message: 'Payment method deleted successfully' })
    }

    res.setHeader('Allow', ['DELETE'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
    
  } catch (error) {
    console.error('Payment method by ID handler error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}