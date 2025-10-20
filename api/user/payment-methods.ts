import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'
import { AuthRequest, verifyToken } from '../lib/auth'

export default async function handler(req: AuthRequest, res: VercelResponse) {
  if (!verifyToken(req, "user")) return res.status(403).end("Forbidden")

  const userid = req.user?.userid
  if (!userid) return res.status(401).json({ error: 'User not authenticated' })

  try {
    const conn = await getConnection()

    // Note: PaymentMethods table should be created using database/02_mypage_tables.sql

    if (req.method === 'GET') {
      // Get user's payment methods
      const [paymentRows] = await conn.execute(`
        SELECT 
          paymentid,
          type,
          provider,
          card_number_masked,
          expiry_month,
          expiry_year,
          cardholder_name,
          is_default,
          createdat,
          updatedat
        FROM PaymentMethods
        WHERE userid = ?
        ORDER BY is_default DESC, createdat DESC
      `, [userid])

      return res.status(200).json(paymentRows)
    }

    if (req.method === 'POST') {
      const { 
        type, 
        provider, 
        card_number, 
        expiry_month, 
        expiry_year, 
        cardholder_name, 
        is_default 
      } = req.body

      if (!type || !['credit_card', 'paypal', 'bank_transfer'].includes(type)) {
        return res.status(400).json({ error: 'Valid payment type is required' })
      }

      // Mask card number (show only last 4 digits)
      let card_number_masked = null
      if (type === 'credit_card' && card_number) {
        const cleaned = card_number.replace(/\D/g, '')
        card_number_masked = cleaned.slice(-4)
      }

      await conn.beginTransaction()

      try {
        // If this should be default, unset other defaults
        if (is_default) {
          await conn.execute(
            'UPDATE PaymentMethods SET is_default = FALSE WHERE userid = ?',
            [userid]
          )
        }

        const [result] = await conn.execute(`
          INSERT INTO PaymentMethods 
          (userid, type, provider, card_number_masked, expiry_month, expiry_year, cardholder_name, is_default) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [userid, type, provider, card_number_masked, expiry_month, expiry_year, cardholder_name, !!is_default])

        await conn.commit()

        return res.status(201).json({ 
          paymentid: (result as any).insertId,
          message: 'Payment method added successfully' 
        })
      } catch (transactionError) {
        await conn.rollback()
        throw transactionError
      }
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
    
  } catch (error) {
    console.error('Payment methods handler error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}