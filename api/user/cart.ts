import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'

// This combined handler supports:
// GET  -> /api/user/cart?userid=123            (get cart items - both drinks and products)
// POST -> /api/user/cart?action=add             (body: { drinkid?, productid?, userid, quantity? })
// POST -> /api/user/cart?action=remove          (body: { cartitemid, userid })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // Get all cart items (both drinks and products)
      const connection = await getConnection();
      const { userid } = req.query;
      if (!userid) {
        return res.status(400).json({ error: "Missing userid parameter" });
      }
      
      const [rows] = await connection.execute(
        `SELECT 
          ci.cartitemid, 
          ci.drinkid, 
          ci.productid,
          ci.quantity, 
          ci.price,
          -- Drink fields
          ud.name as drink_name,
          d.imageurl as drink_image,
          -- Product fields  
          p.name as product_name,
          p.imageurl as product_image,
          -- Unified fields for display
          COALESCE(ud.name, p.name) as name,
          COALESCE(d.imageurl, p.imageurl) as imageurl,
          CASE 
            WHEN ci.drinkid IS NOT NULL THEN 'drink'
            WHEN ci.productid IS NOT NULL THEN 'product'
          END as item_type
        FROM CartItem ci
        LEFT JOIN Cart c ON ci.cartid = c.cartid
        LEFT JOIN Drink d ON ci.drinkid = d.drinkid
        LEFT JOIN UserDrink ud ON ci.drinkid = ud.drinkid AND ud.userid = ?
        LEFT JOIN Product p ON ci.productid = p.productid
        WHERE c.userid = ?
        ORDER BY ci.cartitemid DESC`,
        [userid, userid]
      );
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const action = (req.query && (req.query as any).action) ? String((req.query as any).action) : 'add'

      if (action === 'add') {
        // Add item to cart (drink or product)
        const body = req.body || {}
        const drinkid = body.drinkid ? Number(body.drinkid) : null
        const productid = body.productid ? Number(body.productid) : null
        const quantity = body.quantity ? Number(body.quantity) : 1

        // Validate that exactly one of drinkid or productid is provided
        if ((!drinkid && !productid) || (drinkid && productid)) {
          return res.status(400).json({ error: 'Exactly one of drinkid or productid is required' })
        }

        if (quantity <= 0) {
          return res.status(400).json({ error: 'Quantity must be positive' })
        }

        const userid = Number(body.userid)
        if (!userid || !Number.isInteger(userid) || userid <= 0) {
          return res.status(401).json({ error: 'Unauthorized: valid userid required' })
        }

        const conn = await getConnection()
        try {
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

          let price: number
          let existingQuery: string
          let existingParams: any[]
          let insertQuery: string
          let insertParams: any[]

          if (drinkid) {
            // Handle drink item
            const [drinkRows] = await conn.query('SELECT baseprice FROM Drink WHERE drinkid = ? LIMIT 1', [drinkid]) as any
            if (!drinkRows || drinkRows.length === 0) {
              await conn.query('ROLLBACK')
              return res.status(404).json({ error: `Drink ${drinkid} not found` })
            }
            price = drinkRows[0].baseprice

            existingQuery = 'SELECT * FROM CartItem WHERE cartid = ? AND drinkid = ? LIMIT 1'
            existingParams = [cartid, drinkid]
            insertQuery = 'INSERT INTO CartItem (cartid, drinkid, quantity, price) VALUES (?, ?, ?, ?)'
            insertParams = [cartid, drinkid, quantity, price]
          } else {
            // Handle product item
            const [productRows] = await conn.query('SELECT price FROM Product WHERE productid = ? LIMIT 1', [productid]) as any
            if (!productRows || productRows.length === 0) {
              await conn.query('ROLLBACK')
              return res.status(404).json({ error: `Product ${productid} not found` })
            }
            price = productRows[0].price

            existingQuery = 'SELECT * FROM CartItem WHERE cartid = ? AND productid = ? LIMIT 1'
            existingParams = [cartid, productid]
            insertQuery = 'INSERT INTO CartItem (cartid, productid, quantity, price) VALUES (?, ?, ?, ?)'
            insertParams = [cartid, productid, quantity, price]
          }

          // Check if item already exists in cart
          const [existing] = await conn.query(existingQuery, existingParams) as any
          if (existing && existing.length > 0) {
            await conn.query( 
              'UPDATE CartItem SET quantity = quantity + ?, price = ? WHERE cartitemid = ?', 
              [quantity, price, existing[0].cartitemid] 
            )
          } else {
            await conn.query(insertQuery, insertParams)
          }

          await conn.query('COMMIT')

          // Return updated cart items
          const [cartItems] = await conn.query(
            `SELECT 
              ci.cartitemid, 
              ci.drinkid, 
              ci.productid,
              ci.quantity, 
              ci.price,
              COALESCE(ud.name, p.name) as name,
              COALESCE(d.imageurl, p.imageurl) as imageurl,
              CASE 
                WHEN ci.drinkid IS NOT NULL THEN 'drink'
                WHEN ci.productid IS NOT NULL THEN 'product'
              END as item_type
            FROM CartItem ci
            LEFT JOIN Drink d ON ci.drinkid = d.drinkid
            LEFT JOIN UserDrink ud ON ci.drinkid = ud.drinkid AND ud.userid = ?
            LEFT JOIN Product p ON ci.productid = p.productid
            WHERE ci.cartid = ?`,
            [userid, cartid] 
          ) as any

          return res.status(200).json({ cartid, items: cartItems })
        } catch (dbErr) {
          console.error('DB error:', dbErr)
          try { await conn.query('ROLLBACK') } catch(_) {}
          return res.status(500).json({ error: 'Failed to add item to cart' })
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
