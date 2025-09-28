import { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'

type Item = { productid: number; quantity: number }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }
  
  try {
    const body = req.body
    
    // Extract drink details
    const { drinkname, description, imageurl, uniqueid } = body
    
    // Validate required fields
    if (!drinkname || typeof drinkname !== 'string') {
      return res.status(400).json({ error: 'Drink name is required and must be a string' })
    }
    
    // Extract and validate products
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
      return res.status(400).json({ error: 'At least one valid product with positive quantity is required' })
    }

    // Base price is optional, default to 0 if not provided or invalid
    const baseprice = body.price && typeof body.price === 'number' ? body.price : 0

    // === AUTH — adjust to your auth system ===
    const userid = Number(body.userid)
    if (!userid || !Number.isInteger(userid) || userid <= 0) {
      return res.status(401).json({ error: 'Unauthorized: valid userid required' })
    }

    // Start transaction
    const conn = await getConnection()

    try {
      // Start transaction
      await conn.query('START TRANSACTION')

      let drinkid: number
      const [uniqueIdRows] = await conn.query('SELECT drinkid FROM Drink WHERE uniqueid = ?', [uniqueid]) as any
      if (!uniqueIdRows || uniqueIdRows.length === 0) {
        // Insert into Drink table
        const [drinkResult] = await conn.query('INSERT INTO Drink (description, baseprice, createdat, imageurl, uniqueid) VALUES (?, ?, NOW(), ?, ?)', [
          description || null,
          baseprice,
          imageurl || null,
          uniqueid
        ]) as any

        // Get the inserted drink ID
        drinkid = (drinkResult as any).insertId
        
        // Insert into DrinkProduct table
        for (const it of items) {
          console.log('Inserting into DrinkProduct:', { drinkid, productid: it.productid, quantity: it.quantity })
          await conn.query('INSERT INTO DrinkProduct (drinkid, productid, quantity) VALUES (?, ?, ?)', [
            drinkid,
            it.productid,
            it.quantity
          ])
        }
      } else {
        drinkid = uniqueIdRows[0].drinkid
      }

      //Insert UserDrink table
      const [uniqueNameRows] = await conn.query('SELECT * FROM UserDrink WHERE userid = ? AND drinkid = ? LIMIT 1', [userid, drinkid]) as any
      if (uniqueNameRows && uniqueNameRows.length > 0) {
        // User already has this drink combination, skip insertion and return success
      } else {
        await conn.query('INSERT INTO UserDrink (userid, drinkid, name, createdat) VALUES (?, ?, ?, NOW())', [
          userid,
          drinkid,
          drinkname
        ])
      }

      // Commit transaction
      await conn.query('COMMIT')

      // Return success response with the created drink
      res.status(201).json({
        message: 'Drink created successfully',
        drink: {
          drinkid,
          name: drinkname,
          description,
          baseprice,
          imageurl: imageurl || null,
          products: items
        }
      })

      return res

    } catch (transactionError) {
      // Rollback transaction on error
      await conn.rollback()
      throw transactionError
    }

  } catch (error) {
    console.error('Error creating drink:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}