import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'

// This combined handler supports:
// GET  -> /api/user/cart?userid=123            (was myCart.ts)
// POST -> /api/user/cart?action=add             (body: { drinkid, userid, quantity? })
// POST -> /api/user/cart?action=remove          (body: { cartitemid, userid })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // myCart behavior
      const connection = await getConnection();
      const { userid } = req.query;
      if (!userid) {
        return res.status(400).json({ error: "Missing userid parameter" });
      }
      const [rows] = await connection.execute(
        `SELECT ci.cartitemid, ci.drinkid, ci.quantity, ci.price, ud.name, d.imageurl
            FROM CartItem ci
            JOIN Drink d ON ci.drinkid = d.drinkid
            JOIN UserDrink ud ON ci.drinkid = ud.drinkid
            WHERE ud.userid = ?`,
        [userid]
      );
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const action = (req.query && (req.query as any).action) ? String((req.query as any).action) : 'add'

      if (action === 'add') {
        // addCart behavior
        const body = req.body || {}
        const item = { drinkid: Number(body.drinkid), quantity: body.quantity ? Number(body.quantity) : 1 }

        if (!item.drinkid || item.quantity <= 0) {
          return res.status(400).json({ error: 'Product ID is required' })
        }

        const userid = Number(body.userid)
        if (!userid || !Number.isInteger(userid) || userid <= 0) {
          return res.status(401).json({ error: 'Unauthorized: valid userid required' })
        }

        const conn = await getConnection()
        try {
          await conn.query('START TRANSACTION')

          const [cartRows] = await conn.query('SELECT * FROM Cart WHERE userid = ? LIMIT 1', [userid]) as any
          let cartid: number
          if (!cartRows || cartRows.length === 0) {
            const [insertResult] = await conn.query( 'INSERT INTO Cart (userid, createdat, updatedat) VALUES (?, NOW(), NOW())', [userid] ) as any
            cartid = insertResult.insertId
          } else {
            cartid = cartRows[0].cartid
            await conn.query('UPDATE Cart SET updatedat = NOW() WHERE cartid = ?', [cartid])
          }

          const [productRows] = await conn.query('SELECT baseprice FROM Drink WHERE drinkid = ? LIMIT 1', [item.drinkid]) as any
          if (!productRows || productRows.length === 0) {
            await conn.query('ROLLBACK')
            return res.status(404).json({ error: `Drink ${item.drinkid} not found` })
          }
          const price = productRows[0].baseprice

          const [existing] = await conn.query( 'SELECT * FROM CartItem WHERE cartid = ? AND drinkid = ? LIMIT 1', [cartid, item.drinkid] ) as any
          if (existing && existing.length > 0) {
            await conn.query( 'UPDATE CartItem SET quantity = quantity + ?, price = ? WHERE cartitemid = ?', [item.quantity, price, existing[0].cartitemid] )
          } else {
            await conn.query( `INSERT INTO CartItem (cartid, drinkid, quantity, price) VALUES (?, ?, ?, ?)`, [cartid, item.drinkid, item.quantity, price] )
          }

          await conn.query('COMMIT')

          const [cartItems] = await conn.query(
            `SELECT ci.cartitemid, ci.drinkid, ci.quantity, ci.price, ud.name, d.imageurl
            FROM CartItem ci
            JOIN Drink d ON ci.drinkid = d.drinkid
            JOIN UserDrink ud ON ci.drinkid = ud.drinkid
            WHERE ci.cartid = ?`,
            [cartid] ) as any

          return res.status(200).json({ cartid, items: cartItems })
        } catch (dbErr) {
          console.error('DB error:', dbErr)
          try { await conn.query('ROLLBACK') } catch(_) {}
          return res.status(500).json({ error: 'Failed to add products to cart' })
        } finally {
          try { if (conn && typeof (conn as any).release === 'function') (conn as any).release() } catch(_) {}
        }
      }

      if (action === 'remove') {
        // removeCartItem behavior
        const body = req.body || {}
        const cartitemid = Number(body.cartitemid)
        const userid = Number(body.userid)

        if (!cartitemid || !userid) {
          return res.status(400).json({ error: 'cartitemid and userid are required' })
        }

        const conn = await getConnection()
        try {
          await conn.query('START TRANSACTION')

          const [rows] = await conn.query(
            `SELECT ci.cartitemid, ci.quantity, c.userid FROM CartItem ci JOIN Cart c ON ci.cartid = c.cartid WHERE ci.cartitemid = ? LIMIT 1`,
            [cartitemid]
          ) as any

          if (!rows || rows.length === 0) {
            await conn.query('ROLLBACK')
            return res.status(404).json({ error: 'Cart item not found' })
          }

          if (Number(rows[0].userid) !== userid) {
            await conn.query('ROLLBACK')
            return res.status(403).json({ error: 'Forbidden' })
          }

          const currentQty = Number(rows[0].quantity)
          if (currentQty <= 1) {
            await conn.query('DELETE FROM CartItem WHERE cartitemid = ?', [cartitemid])
          } else {
            await conn.query('UPDATE CartItem SET quantity = quantity - 1 WHERE cartitemid = ?', [cartitemid])
          }

          await conn.query('COMMIT')
          return res.status(200).json({ success: true })
        } catch (dbErr) {
          console.error('DB error:', dbErr)
          try { await conn.query('ROLLBACK') } catch(_) {}
          return res.status(500).json({ error: 'DB error' })
        }
      }

      return res.status(400).json({ error: 'Unknown action' })
    }

    res.setHeader('Allow', ['GET','POST'])
    return res.status(405).end()
  } catch (err) {
    console.error('Server error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
