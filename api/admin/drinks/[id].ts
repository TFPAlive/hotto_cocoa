import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../../lib/db_conn'
import { AuthRequest, verifyToken } from '../../lib/auth'

export default async function handler(req: AuthRequest, res: VercelResponse) {
  if (!verifyToken(req, "admin")) return res.status(403).end("Forbidden")

  const { id } = req.query
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Valid drink ID is required' })
  }

  const drinkid = Number(id)
  if (!Number.isInteger(drinkid)) {
    return res.status(400).json({ error: 'Invalid drink ID format' })
  }

  try {
    const conn = await getConnection()

    if (req.method === 'GET') {
      // Get specific drink with its product composition
      const [drinkRows] = await conn.execute(`
        SELECT 
          d.drinkid,
          d.description,
          d.imageurl,
          d.baseprice,
          d.uniqueid,
          d.createdat
        FROM Drink d
        WHERE d.drinkid = ?
      `, [drinkid])

      if (!Array.isArray(drinkRows) || (drinkRows as any).length === 0) {
        return res.status(404).json({ error: 'Drink not found' })
      }

      // Get product composition
      const [productRows] = await conn.execute(`
        SELECT 
          dp.productid,
          dp.quantity,
          p.name,
          p.price,
          p.category,
          p.description as product_description,
          p.imageurl as product_imageurl
        FROM DrinkProduct dp
        JOIN Product p ON dp.productid = p.productid
        WHERE dp.drinkid = ?
      `, [drinkid])

      // Get user names for this drink
      const [userRows] = await conn.execute(`
        SELECT 
          ud.userid,
          ud.name as user_drink_name,
          u.username
        FROM UserDrink ud
        JOIN User u ON ud.userid = u.userid
        WHERE ud.drinkid = ?
      `, [drinkid])

      const drink = (drinkRows as any)[0]
      drink.products = productRows
      drink.users = userRows

      return res.status(200).json(drink)
    }

    if (req.method === 'PUT') {
      const { description, imageurl, baseprice, productids } = req.body

      if (baseprice != null && (typeof baseprice !== 'number' || baseprice < 0)) {
        return res.status(400).json({ error: 'Valid base price is required' })
      }

      await conn.beginTransaction()

      try {
        // Check if drink exists
        const [existingRows] = await conn.execute('SELECT drinkid FROM Drink WHERE drinkid = ?', [drinkid])
        if (!Array.isArray(existingRows) || (existingRows as any).length === 0) {
          await conn.rollback()
          return res.status(404).json({ error: 'Drink not found' })
        }

        // Update drink basic info
        if (description !== undefined || imageurl !== undefined || baseprice !== undefined) {
          const updates = []
          const params = []
          
          if (description !== undefined) {
            updates.push('description = ?')
            params.push(description)
          }
          if (imageurl !== undefined) {
            updates.push('imageurl = ?')
            params.push(imageurl)
          }
          if (baseprice !== undefined) {
            updates.push('baseprice = ?')
            params.push(baseprice)
          }

          params.push(drinkid)
          
          await conn.execute(
            `UPDATE Drink SET ${updates.join(', ')} WHERE drinkid = ?`,
            params
          )
        }

        // Update product composition if provided
        if (Array.isArray(productids) && productids.length > 0) {
          // Generate new unique ID
          const sortedProductIds = productids.map((p: any) => ({ 
            productid: Number(p.productid), 
            quantity: Number(p.quantity) || 1 
          })).sort((a, b) => a.productid - b.productid)
          
          let uniqueid = ''
          for (const p of sortedProductIds) {
            uniqueid += String(p.productid).padStart(4, '0') + String(p.quantity).padStart(2, '0')
          }

          // Check if another drink with this composition exists
          const [duplicateRows] = await conn.execute(
            'SELECT drinkid FROM Drink WHERE uniqueid = ? AND drinkid != ?', 
            [uniqueid, drinkid]
          )
          if (Array.isArray(duplicateRows) && (duplicateRows as any).length > 0) {
            await conn.rollback()
            return res.status(409).json({ error: 'Another drink with this product composition already exists' })
          }

          // Update uniqueid
          await conn.execute('UPDATE Drink SET uniqueid = ? WHERE drinkid = ?', [uniqueid, drinkid])

          // Delete existing product associations
          await conn.execute('DELETE FROM DrinkProduct WHERE drinkid = ?', [drinkid])

          // Add new product associations
          for (const p of sortedProductIds) {
            await conn.execute(
              'INSERT INTO DrinkProduct (drinkid, productid, quantity) VALUES (?, ?, ?)',
              [drinkid, p.productid, p.quantity]
            )
          }
        }

        await conn.commit()

        // Return updated drink
        const [updatedRows] = await conn.execute(`
          SELECT 
            d.drinkid,
            d.description,
            d.imageurl,
            d.baseprice,
            d.uniqueid,
            d.createdat
          FROM Drink d
          WHERE d.drinkid = ?
        `, [drinkid])

        return res.status(200).json({
          message: 'Drink updated successfully',
          drink: (updatedRows as any)[0]
        })
      } catch (transactionError) {
        await conn.rollback()
        console.error('Transaction error updating drink:', transactionError)
        return res.status(500).json({ error: 'Failed to update drink' })
      }
    }

    if (req.method === 'DELETE') {
      await conn.beginTransaction()

      try {
        // Check if drink exists
        const [existingRows] = await conn.execute('SELECT drinkid FROM Drink WHERE drinkid = ?', [drinkid])
        if (!Array.isArray(existingRows) || (existingRows as any).length === 0) {
          await conn.rollback()
          return res.status(404).json({ error: 'Drink not found' })
        }

        // Delete product associations
        await conn.execute('DELETE FROM DrinkProduct WHERE drinkid = ?', [drinkid])

        // Delete user drink names
        await conn.execute('DELETE FROM UserDrink WHERE drinkid = ?', [drinkid])

        // Delete cart items containing this drink
        await conn.execute('DELETE FROM Cart WHERE drinkid = ?', [drinkid])

        // Delete the drink itself
        await conn.execute('DELETE FROM Drink WHERE drinkid = ?', [drinkid])

        await conn.commit()

        return res.status(200).json({
          message: 'Drink deleted successfully',
          drinkid
        })
      } catch (transactionError) {
        await conn.rollback()
        console.error('Transaction error deleting drink:', transactionError)
        return res.status(500).json({ error: 'Failed to delete drink' })
      }
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
    
  } catch (error) {
    console.error('Admin drink by ID handler error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}