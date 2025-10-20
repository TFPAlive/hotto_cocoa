import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../../lib/db_conn'
import { AuthRequest, verifyToken } from '../../lib/auth'

export default async function handler(req: AuthRequest, res: VercelResponse) {
  if (!verifyToken(req, "admin")) return res.status(403).end("Forbidden")

  try {
    const conn = await getConnection()

    if (req.method === 'GET') {
      const { status, search, page = '1', limit = '50' } = req.query

      // Calculate offset for pagination
      const pageNum = Math.max(1, parseInt(String(page)))
      const limitNum = Math.min(100, Math.max(1, parseInt(String(limit))))
      const offset = (pageNum - 1) * limitNum

      try {
        // Step 1: Get all orders with basic info (no complex joins)
        const [allOrders] = await conn.execute(`
          SELECT orderid, userid, status, totalamount, createdat, updatedat, addressid, paymentmethod
          FROM \`Order\`
          ORDER BY createdat DESC
        `)

        let filteredOrders = allOrders as any[]

        // Step 2: Apply filtering in JavaScript (simpler than complex SQL)
        if (status && typeof status === 'string' && status !== 'all') {
          filteredOrders = filteredOrders.filter(order => order.status === status)
        }

        if (search && typeof search === 'string') {
          const searchLower = search.toLowerCase()
          filteredOrders = filteredOrders.filter(order => 
            String(order.orderid).includes(searchLower) ||
            String(order.totalamount).includes(searchLower)
          )
        }

        // Step 3: Get paginated results
        const total = filteredOrders.length
        const paginatedOrders = filteredOrders.slice(offset, offset + limitNum)

        // Step 4: Enrich orders with user and address info
        const enrichedOrders = []
        for (const order of paginatedOrders) {
          // Get user info
          const [userRows] = await conn.execute(
            'SELECT username, email FROM `User` WHERE userid = ?', 
            [order.userid]
          )
          const user = (userRows as any[])[0] || {}

          // Get address info
          let address: any = {}
          if (order.addressid) {
            const [addressRows] = await conn.execute(
              'SELECT firstname, lastname, postalcode, prefecture, city, town, building, phone FROM Address WHERE addressid = ?',
              [order.addressid]
            )
            address = (addressRows as any[])[0] || {}
          }

          // Get order items
          const [itemRows] = await conn.execute(`
            SELECT oi.drinkid, oi.quantity, oi.price
            FROM OrderItem oi
            WHERE oi.orderid = ?
          `, [order.orderid])

          const items = []
          for (const item of itemRows as any[]) {
            // Get drink name for this user
            const [drinkRows] = await conn.execute(
              'SELECT name FROM UserDrink WHERE drinkid = ? AND userid = ? LIMIT 1',
              [item.drinkid, order.userid]
            )
            const drinkName = (drinkRows as any[])[0]?.name || `Drink ${item.drinkid}`

            // Get drink image
            const [drinkImageRows] = await conn.execute(
              'SELECT imageurl FROM Drink WHERE drinkid = ?',
              [item.drinkid]
            )
            const drinkImage = (drinkImageRows as any[])[0]?.imageurl || null

            items.push({
              drinkid: item.drinkid,
              quantity: item.quantity,
              price: item.price,
              drink_name: drinkName,
              drink_image: drinkImage
            })
          }

          // Format shipping address
          const addressParts = [
            address.postalcode,
            address.prefecture,
            address.city,
            address.town,
            address.building
          ].filter(part => part && part.trim() !== '').join(' ')

          enrichedOrders.push({
            ...order,
            username: user.username || null,
            email: user.email || null,
            shipping_name: address.name || null,
            shipping_address: addressParts || null,
            shipping_phone: address.phone || null,
            items
          })
        }

        return res.status(200).json({
          orders: enrichedOrders,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
          }
        })
        
      } catch (queryError) {
        console.error('Query error:', queryError)
        return res.status(500).json({ error: 'Database query failed', details: queryError.message })
      }
    }

    if (req.method === 'PUT') {
      // Bulk update order statuses
      const { orderIds, status } = req.body

      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: 'Order IDs array is required' })
      }

      if (!status || !['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'paid'].includes(status)) {
        return res.status(400).json({ error: 'Valid status is required' })
      }

      const validOrderIds = orderIds.filter(id => Number.isInteger(Number(id)))
      if (validOrderIds.length === 0) {
        return res.status(400).json({ error: 'No valid order IDs provided' })
      }

      try {
        await conn.beginTransaction()
        
        let updatedCount = 0
        for (const orderId of validOrderIds) {
          const [result] = await conn.execute(
            'UPDATE `Order` SET status = ?, updatedat = NOW() WHERE orderid = ?',
            [status, orderId]
          )
          updatedCount += (result as any).affectedRows
        }

        await conn.commit()

        return res.status(200).json({
          message: `Successfully updated ${updatedCount} orders`,
          updatedCount
        })
      } catch (transactionError) {
        await conn.rollback()
        console.error('Transaction error updating orders:', transactionError)
        return res.status(500).json({ error: 'Failed to update orders' })
      }
    }

    if (req.method === 'DELETE') {
      // Delete orders (bulk)
      const { orderIds } = req.body

      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: 'Order IDs array is required' })
      }

      const validOrderIds = orderIds.filter(id => Number.isInteger(Number(id)))
      if (validOrderIds.length === 0) {
        return res.status(400).json({ error: 'No valid order IDs provided' })
      }

      try {
        await conn.beginTransaction()
        
        let deletedCount = 0
        for (const orderId of validOrderIds) {
          // Delete order items first (foreign key constraint)
          await conn.execute('DELETE FROM OrderItem WHERE orderid = ?', [orderId])
          
          // Delete order
          const [result] = await conn.execute('DELETE FROM `Order` WHERE orderid = ?', [orderId])
          deletedCount += (result as any).affectedRows
        }

        await conn.commit()

        return res.status(200).json({
          message: `Successfully deleted ${deletedCount} orders`,
          deletedCount
        })
      } catch (transactionError) {
        await conn.rollback()
        console.error('Transaction error deleting orders:', transactionError)
        return res.status(500).json({ error: 'Failed to delete orders' })
      }
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
    
  } catch (error) {
    console.error('Admin orders handler error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}