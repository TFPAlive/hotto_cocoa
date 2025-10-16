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

    // Begin DB transaction: create Order and OrderItem rows
    const conn = await getConnection()
    try {
      await conn.beginTransaction()

      // Ensure address belongs to the user
      const [addrRows] = await conn.execute('SELECT addressid FROM Address WHERE addressid = ? AND userid = ?', [addressid, userid])
      // @ts-ignore
      if (!Array.isArray(addrRows) || (addrRows as any).length === 0) {
        await conn.rollback()
        return res.status(404).json({ error: 'Address not found for user' })
      }

      // Fetch cart item details for the given cartitem ids and ensure they belong to the user
      const cartItemIds = items.map((it: any) => Number(it.cartitemid)).filter((id: number) => Number.isFinite(id))
      if (cartItemIds.length === 0) {
        await conn.rollback()
        return res.status(400).json({ error: 'Invalid cart items' })
      }

      const placeholders = cartItemIds.map(() => '?').join(',')
      const [cartRows] = await conn.execute(
        `SELECT ci.cartitemid, ci.drinkid, ci.quantity, ci.price FROM CartItem ci JOIN UserDrink ud ON ci.drinkid = ud.drinkid WHERE ci.cartitemid IN (${placeholders}) AND ud.userid = ?`,
        [...cartItemIds, userid]
      )

      // @ts-ignore
      const cartArray = Array.isArray(cartRows) ? (cartRows as any) : []
      if (cartArray.length !== cartItemIds.length) {
        await conn.rollback()
        return res.status(400).json({ error: 'Some cart items are invalid or do not belong to the user' })
      }

      // Compute total amount
      let totalAmount = 0
      for (const r of cartArray) {
        const price = Number(r.price) || 0
        const qty = Number(r.quantity) || 0
        totalAmount += price * qty
      }

      // Insert into Order table
      const [orderResult] = await conn.execute(
        'INSERT INTO `Order` (userid, status, totalamount, createdat, updatedat, addressid, paymentmethod) VALUES (?, ?, ?, NOW(), NOW(), ?, ?)',
        [userid, 'pending', totalAmount, addressid, paymentMethod]
      )
      // @ts-ignore
      const orderid = (orderResult as any).insertId
      if (!orderid) {
        await conn.rollback()
        return res.status(500).json({ error: 'Failed to create order' })
      }

      // Insert order items
      for (const r of cartArray) {
        await conn.execute(
          'INSERT INTO OrderItem (orderid, drinkid, quantity, price) VALUES (?, ?, ?, ?)',
          [orderid, r.drinkid, r.quantity, r.price]
        )
      }

      // Clear entire cart for the user (delete CartItem rows that belong to this user)
      await conn.execute(
        `DELETE ci FROM CartItem ci JOIN UserDrink ud ON ci.drinkid = ud.drinkid WHERE ud.userid = ?`,
        [userid]
      )

      await conn.commit()

      // Return payment initiation data including orderid
      if (paymentMethod === 'paypay') {
        return res.status(200).json({ orderid, paymentUrl: `https://paypay.example.com/checkout?order=${orderid}&token=mock_paypay_token_123` })
      }

      if (paymentMethod === 'card') {
        return res.status(200).json({ orderid, token: `mock_card_token_order_${orderid}`, message: 'Proceed to card capture (mock)' })
      }

      if (paymentMethod === 'convenience') {
        return res.status(200).json({ orderid, instructions: `Pay at any participating convenience store using code: ORD-${orderid}-1234 (mock)` })
      }

      return res.status(500).json({ error: 'Unhandled payment method' })
    } catch (txErr) {
      console.error('Transaction error in placeOrder:', txErr)
      try { await conn.rollback() } catch (rbErr) { console.error('Rollback error:', rbErr) }
      return res.status(500).json({ error: 'Failed to create order' })
    }
  } catch (err) {
    console.error('placeOrder error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
