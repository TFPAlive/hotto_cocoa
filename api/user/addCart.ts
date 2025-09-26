import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'

type Item = { productId: number; quantity: number }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const body = req.body || {}
    // Accept either { products: [...] } or single { productId, quantity }
    let items: Item[] = []
    if (Array.isArray(body.products)) {
      items = body.products
    } else if (body.productId || body.quantity != null) {
      items = [{ productId: Number(body.productId), quantity: Number(body.quantity) }]
    }

    // Basic validation: integer ids and positive quantities
    items = items
      .map(it => ({ productId: Number(it.productId), quantity: Number(it.quantity) }))
      .filter(it => Number.isInteger(it.productId) && Number.isInteger(it.quantity) && it.quantity > 0)

    if (items.length === 0) {
      return res.status(400).json({ error: 'Product ID and quantity are required' })
    }

    // === AUTH — adjust to your auth system ===
    const userId = Number(body.userId)
    if (!userId || !Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: 'Unauthorized: valid userId required' })
    }

    const conn = await getConnection()

    try {
      // Start transaction
      await conn.query('START TRANSACTION')

      // Get or create cart
      const [cartRows] = await conn.query('SELECT * FROM Cart WHERE user_id = ? LIMIT 1', [userId]) as any
      let cartId: number
      if (!cartRows || cartRows.length === 0) {
        const [insertResult] = await conn.query(
          'INSERT INTO Cart (user_id, created_at, updated_at) VALUES (?, NOW(), NOW())',
          [userId]
        ) as any
        cartId = insertResult.insertId
      } else {
        cartId = cartRows[0].cart_id
        await conn.query('UPDATE Cart SET updated_at = NOW() WHERE cart_id = ?', [cartId])
      }

      // For each item: ensure product exists, then insert or update CartItem
      for (const it of items) {
        const [productRows] = await conn.query('SELECT price FROM Product WHERE id = ? LIMIT 1', [it.productId]) as any
        if (!productRows || productRows.length === 0) {
          await conn.query('ROLLBACK')
          return res.status(404).json({ error: `Product ${it.productId} not found` })
        }
        const price = productRows[0].price

        const [existing] = await conn.query(
          'SELECT * FROM CartItem WHERE cart_id = ? AND product_id = ? LIMIT 1',
          [cartId, it.productId]
        ) as any

        if (existing && existing.length > 0) {
          await conn.query(
            'UPDATE CartItem SET quantity = quantity + ?, price = ? WHERE cart_item_id = ?',
            [it.quantity, price, existing[0].cart_item_id]
          )
        } else {
          await conn.query(
            `INSERT INTO CartItem (cart_id, product_id, quantity, price)
             VALUES (?, ?, ?, ?)`,
            [cartId, it.productId, it.quantity, price]
          )
        }
      }

      await conn.query('COMMIT')

      // Return updated cart items
      const [cartItems] = await conn.query(
        `SELECT ci.cart_item_id, ci.product_id, ci.quantity, ci.price, p.name, p.imageUrl
         FROM CartItem ci
         JOIN Product p ON ci.product_id = p.id
         WHERE ci.cart_id = ?`,
        [cartId]
      ) as any

      return res.status(200).json({ cartId, userId, items: cartItems })

    } catch (dbErr) {
      console.error('DB error:', dbErr)
      try { await conn.query('ROLLBACK') } catch (_) {}
      return res.status(500).json({ error: 'Failed to add products to cart' })
    } finally {
      // release connection if your getConnection returns a pooled connection
      try {
        if (conn && typeof (conn as any).release === 'function') (conn as any).release()
      } catch (_) {}
    }
  } catch (err) {
    console.error('Server error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
