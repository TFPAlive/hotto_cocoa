import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const body = req.body || {}
    const userid = Number(body.userid)
    const addressid = Number(body.addressid)
    const paymentMethod = String(body.paymentMethod || '')
    const items = Array.isArray(body.items) ? body.items : []

    if (!userid || !Number.isInteger(userid) || userid <= 0) return res.status(400).json({ error: 'Invalid user id' })
    if (!addressid || !Number.isInteger(addressid) || addressid <= 0) return res.status(400).json({ error: 'Invalid address id' })
    if (!['paypay', 'card', 'convenience'].includes(paymentMethod)) return res.status(400).json({ error: 'Unsupported payment method' })
    if (!items.length) return res.status(400).json({ error: 'No items in order' })

    // Minimal DB check (optional): ensure address belongs to user
    try {
      const conn = await getConnection()
      const [rows] = await conn.execute('SELECT addressid FROM Address WHERE addressid = ? AND userid = ?', [addressid, userid])
      // @ts-ignore
      if (!Array.isArray(rows) || (rows as any).length === 0) {
        return res.status(404).json({ error: 'Address not found for user' })
      }
    } catch (dbErr) {
      console.warn('DB address check skipped or failed:', dbErr)
    }

    // Create a mock order record or token here. For now, return payment-specific mock data.
    if (paymentMethod === 'paypay') {
      return res.status(200).json({ paymentUrl: 'https://paypay.example.com/checkout?token=mock_paypay_token_123' })
    }

    if (paymentMethod === 'card') {
      return res.status(200).json({ token: 'mock_card_token_abc123', message: 'Proceed to card capture (mock)' })
    }

    if (paymentMethod === 'convenience') {
      return res.status(200).json({ instructions: 'Pay at any participating convenience store using code: 1234-5678 (mock)' })
    }

    return res.status(500).json({ error: 'Unhandled payment method' })
  } catch (err) {
    console.error('placeOrder error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
