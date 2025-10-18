import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../../lib/db_conn'
import { AuthRequest, verifyToken } from '../../lib/auth'

export default async function handler(req: AuthRequest, res: VercelResponse) {
  if (!verifyToken(req, "admin")) return res.status(403).end("Forbidden")

  try {
    const conn = await getConnection()

    if (req.method === 'GET') {
      // Get all drinks with their product compositions and user names
      const [drinkRows] = await conn.execute(`
        SELECT 
          d.drinkid,
          d.description,
          d.imageurl,
          d.baseprice,
          d.uniqueid,
          d.createdat,
          GROUP_CONCAT(DISTINCT CONCAT(p.name, ':', dp.quantity) SEPARATOR ', ') as product_composition,
          GROUP_CONCAT(DISTINCT ud.name SEPARATOR ', ') as user_names,
          COUNT(DISTINCT ud.userid) as user_count
        FROM Drink d
        LEFT JOIN DrinkProduct dp ON d.drinkid = dp.drinkid
        LEFT JOIN Product p ON dp.productid = p.productid
        LEFT JOIN UserDrink ud ON d.drinkid = ud.drinkid
        GROUP BY d.drinkid, d.description, d.imageurl, d.baseprice, d.uniqueid, d.createdat
        ORDER BY d.createdat DESC
      `)

      // Get product IDs for each drink
      const drinkIds = (drinkRows as any[]).map(drink => drink.drinkid)
      let productMappings: any = {}
      
      if (drinkIds.length > 0) {
        const placeholders = drinkIds.map(() => '?').join(',')
        const [productRows] = await conn.execute(`
          SELECT drinkid, GROUP_CONCAT(productid) as productids
          FROM DrinkProduct 
          WHERE drinkid IN (${placeholders})
          GROUP BY drinkid
        `, drinkIds)
        
        for (const row of productRows as any[]) {
          productMappings[row.drinkid] = row.productids ? row.productids.split(',').map(Number) : []
        }
      }

      // Transform the response to match frontend expectations
      const transformedDrinks = (drinkRows as any[]).map(drink => ({
        drinkid: drink.drinkid,
        name: drink.user_names || `Drink ${drink.drinkid}`, // Use first user name or fallback
        description: drink.description,
        imageurl: drink.imageurl,
        baseprice: drink.baseprice,
        uniqueid: drink.uniqueid,
        productids: productMappings[drink.drinkid] || [],
        createdat: drink.createdat,
        product_composition: drink.product_composition,
        user_count: drink.user_count
      }))
      
      return res.status(200).json(transformedDrinks)
    }

    if (req.method === 'POST') {
      const { description, imageurl, baseprice, productids } = req.body
      
      if (!Array.isArray(productids) || productids.length === 0) {
        return res.status(400).json({ error: 'At least one product is required' })
      }

      if (baseprice == null || typeof baseprice !== 'number' || baseprice < 0) {
        return res.status(400).json({ error: 'Valid base price is required' })
      }

      await conn.beginTransaction()

      try {
        // Generate unique ID from product IDs
        const sortedProductIds = productids.map((p: any) => ({ 
          productid: Number(p.productid), 
          quantity: Number(p.quantity) || 1 
        })).sort((a, b) => a.productid - b.productid)
        
        let uniqueid = ''
        for (const p of sortedProductIds) {
          uniqueid += String(p.productid).padStart(4, '0') + String(p.quantity).padStart(2, '0')
        }

        // Check if drink with this composition already exists
        const [existingRows] = await conn.execute('SELECT drinkid FROM Drink WHERE uniqueid = ?', [uniqueid])
        if (Array.isArray(existingRows) && (existingRows as any).length > 0) {
          await conn.rollback()
          return res.status(409).json({ error: 'A drink with this product composition already exists' })
        }

        // Create the drink
        const [drinkResult] = await conn.execute(
          'INSERT INTO Drink (description, baseprice, createdat, imageurl, uniqueid) VALUES (?, ?, NOW(), ?, ?)',
          [description || null, baseprice, imageurl || null, uniqueid]
        )
        const drinkid = (drinkResult as any).insertId

        // Add product compositions
        for (const p of sortedProductIds) {
          await conn.execute(
            'INSERT INTO DrinkProduct (drinkid, productid, quantity) VALUES (?, ?, ?)',
            [drinkid, p.productid, p.quantity]
          )
        }

        await conn.commit()

        return res.status(201).json({
          message: 'Drink created successfully',
          drinkid,
          description,
          baseprice,
          imageurl,
          uniqueid,
          products: sortedProductIds
        })
      } catch (transactionError) {
        await conn.rollback()
        console.error('Transaction error creating drink:', transactionError)
        return res.status(500).json({ error: 'Failed to create drink' })
      }
    }

    if (req.method === 'DELETE') {
      const { drinkid } = req.body
      
      if (!drinkid || !Number.isInteger(Number(drinkid))) {
        return res.status(400).json({ error: 'Valid drink ID is required' })
      }

      await conn.beginTransaction()

      try {
        // Delete from DrinkProduct first (foreign key constraint)
        await conn.execute('DELETE FROM DrinkProduct WHERE drinkid = ?', [drinkid])
        
        // Delete from UserDrink
        await conn.execute('DELETE FROM UserDrink WHERE drinkid = ?', [drinkid])
        
        // Check if drink is in any orders (prevent deletion if so)
        const [orderCheck] = await conn.execute('SELECT COUNT(*) as count FROM OrderItem WHERE drinkid = ?', [drinkid])
        if (Array.isArray(orderCheck) && (orderCheck as any)[0]?.count > 0) {
          await conn.rollback()
          return res.status(400).json({ error: 'Cannot delete drink that has been ordered' })
        }
        
        // Delete the drink
        const [deleteResult] = await conn.execute('DELETE FROM Drink WHERE drinkid = ?', [drinkid])
        
        if ((deleteResult as any).affectedRows === 0) {
          await conn.rollback()
          return res.status(404).json({ error: 'Drink not found' })
        }

        await conn.commit()
        return res.status(200).json({ message: 'Drink deleted successfully' })
      } catch (transactionError) {
        await conn.rollback()
        console.error('Transaction error deleting drink:', transactionError)
        return res.status(500).json({ error: 'Failed to delete drink' })
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
    
  } catch (error) {
    console.error('Admin drinks handler error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}