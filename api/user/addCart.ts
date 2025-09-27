import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'

type Item = { productid: number; quantity: number }

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
    } else if (body.productid || body.quantity != null) {
      items = [{ productid: Number(body.productid), quantity: Number(body.quantity) }]
    }

    // Basic validation: integer ids and positive quantities
    items = items
      .map(it => ({ productid: Number(it.productid), quantity: Number(it.quantity) }))
      .filter(it => Number.isInteger(it.productid) && Number.isInteger(it.quantity) && it.quantity > 0)

    if (items.length === 0) {
      return res.status(400).json({ error: 'Product ID and quantity are required' })
    }

    // === AUTH — adjust to your auth system ===
    const userid = Number(body.userid)
    if (!userid || !Number.isInteger(userid) || userid <= 0) {
      return res.status(401).json({ error: 'Unauthorized: valid userid required' })
    }

    const conn = await getConnection()

    try {
      // Start transaction
      await conn.query('START TRANSACTION')

      // Get or create cart
      const [cartRows] = await conn.query('SELECT * FROM Cart WHERE userid = ? LIMIT 1', [userid]) as any
      let cartid: number
      if (!cartRows || cartRows.length === 0) {
        const [insertResult] = await conn.query(
          'INSERT INTO Cart (userid, createdat, updatedat) VALUES (?, NOW(), NOW())',
          [userid]
        ) as any
        cartid = insertResult.insertId
      } else {
        cartid = cartRows[0].cartid
        await conn.query('UPDATE Cart SET updatedat = NOW() WHERE cartid = ?', [cartid])
      }

      // For each item: ensure product exists, then insert or update CartItem
      for (const it of items) {
        const [productRows] = await conn.query('SELECT price FROM Product WHERE productid = ? LIMIT 1', [it.productid]) as any
        if (!productRows || productRows.length === 0) {
          await conn.query('ROLLBACK')
          return res.status(404).json({ error: `Product ${it.productid} not found` })
        }
        const price = productRows[0].price

        const [existing] = await conn.query(
          'SELECT * FROM CartItem WHERE cartid = ? AND productid = ? LIMIT 1',
          [cartid, it.productid]
        ) as any

        if (existing && existing.length > 0) {
          await conn.query(
            'UPDATE CartItem SET quantity = quantity + ?, price = ? WHERE cartitemid = ?',
            [it.quantity, price, existing[0].cartitemid]
          )
        } else {
          await conn.query(
            `INSERT INTO CartItem (cartid, productid, quantity, price)
             VALUES (?, ?, ?, ?)`,
            [cartid, it.productid, it.quantity, price]
          )
        }
      }

      await conn.query('COMMIT')

      // Return updated cart items
      const [cartItems] = await conn.query(
        `SELECT ci.cartitemid, ci.productid, ci.quantity, ci.price, p.name, p.imageurl
         FROM CartItem ci
         JOIN Product p ON ci.productid = p.productid
         WHERE ci.cartid = ?`,
        [cartid]
      ) as any

      return res.status(200).json({ cartid, userId, items: cartItems })

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
