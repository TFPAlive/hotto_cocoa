import { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'

type Item = { productid: number; quantity: number }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const connection = await getConnection()
  
  try {
    const body = req.body
    
    // Extract drink details
    const { drinkname, description, imageurl } = body
    
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

    const baseprice = body.price && typeof body.price === 'number' ? body.price : 0

    // Start transaction
    await connection.beginTransaction()

    try {
      // Insert into Drink table
      const insertDrinkQuery = `
        INSERT INTO Drink (name, description, baseprice, createdat, imageurl)
        VALUES (?, ?, ?, NOW(), ?)
      `
      const [ drinkResult ] = await connection.execute(insertDrinkQuery, [
        drinkname,
        description || null,
        baseprice,
        imageurl || null
      ])

      // Get the inserted drink ID
      const drinkid = (drinkResult as any).insertId
      
      // Insert into DrinkProduct table
      const insertDrinkProductQuery = `
        INSERT INTO DrinkProduct (drinkid, productid, quantity)
        VALUES (?, ?, ?)
      `

      for (const item of items) {
        await connection.execute(insertDrinkProductQuery, [
          drinkid,
          item.productid,
          item.quantity
        ])
      }

      // Commit transaction
      await connection.commit()

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

    } catch (transactionError) {
      // Rollback transaction on error
      await connection.rollback()
      throw transactionError
    }

  } catch (error) {
    console.error('Error creating drink:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    await connection.end()
  }
}