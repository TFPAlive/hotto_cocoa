import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../../../lib/db_conn'
import { AuthRequest, verifyToken } from '../../../lib/auth'

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

    if (req.method === 'PUT') {
      // Check if payment method belongs to user
      const [existingRows] = await conn.execute(
        'SELECT paymentid FROM PaymentMethods WHERE paymentid = ? AND userid = ?',
        [paymentid, userid]
      )

      if (!Array.isArray(existingRows) || (existingRows as any).length === 0) {
        return res.status(404).json({ error: 'Payment method not found' })
      }

      await conn.beginTransaction()

      try {
        // Unset current default
        await conn.execute(
          'UPDATE PaymentMethods SET is_default = FALSE WHERE userid = ?',
          [userid]
        )

        // Set new default
        await conn.execute(
          'UPDATE PaymentMethods SET is_default = TRUE WHERE paymentid = ? AND userid = ?',
          [paymentid, userid]
        )

        await conn.commit()

        return res.status(200).json({ message: 'Default payment method updated successfully' })
      } catch (transactionError) {
        await conn.rollback()
        throw transactionError
      }
    }

    res.setHeader('Allow', ['PUT'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
    
  } catch (error) {
    console.error('Set default payment method handler error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}