import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../../lib/db_conn'
import { AuthRequest, verifyToken } from '../../lib/auth'

export default async function handler(req: AuthRequest, res: VercelResponse) {
  if (!verifyToken(req, "admin")) return res.status(403).end("Forbidden")

  const { id } = req.query
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Valid order ID is required' })
  }

  const orderid = Number(id)
  if (!Number.isInteger(orderid)) {
    return res.status(400).json({ error: 'Invalid order ID format' })
  }

  try {
    const conn = await getConnection()

    if (req.method === 'GET') {
      // Get specific order with full details
      const [orderRows] = await conn.execute(`
        SELECT 
          o.orderid,
          o.userid,
          o.status,
          o.totalamount,
          o.createdat,
          o.updatedat,
          o.addressid,
          o.paymentmethod,
          u.username,
          u.email,
          u.phone as user_phone,
          a.name as shipping_name,
          a.postalcode,
          a.prefecture,
          a.city,
          a.town,
          a.building,
          a.phone as shipping_phone
        FROM \`Order\` o
        LEFT JOIN \`User\` u ON o.userid = u.userid
        LEFT JOIN Address a ON o.addressid = a.addressid
        WHERE o.orderid = ?
      `, [orderid])

      if (!Array.isArray(orderRows) || (orderRows as any).length === 0) {
        return res.status(404).json({ error: 'Order not found' })
      }

      // Get order items with drink details
      const [itemRows] = await conn.execute(`
        SELECT 
          oi.drinkid,
          oi.quantity,
          oi.price,
          ud.name as drink_name,
          d.imageurl as drink_image,
          d.description as drink_description,
          d.baseprice,
          GROUP_CONCAT(CONCAT(p.name, ' (', dp.quantity, ')') ORDER BY p.name SEPARATOR ', ') as product_composition
        FROM OrderItem oi
        LEFT JOIN UserDrink ud ON oi.drinkid = ud.drinkid AND ud.userid = ?
        LEFT JOIN Drink d ON oi.drinkid = d.drinkid
        LEFT JOIN DrinkProduct dp ON d.drinkid = dp.drinkid
        LEFT JOIN Product p ON dp.productid = p.productid
        WHERE oi.orderid = ?
        GROUP BY oi.drinkid, oi.quantity, oi.price, ud.name, d.imageurl, d.description, d.baseprice
        ORDER BY oi.drinkid
      `, [(orderRows as any)[0].userid, orderid])

      const order = (orderRows as any)[0]
      order.items = itemRows
      order.shipping_address = {
        name: order.shipping_name,
        postalcode: order.postalcode,
        prefecture: order.prefecture,
        city: order.city,
        town: order.town,
        building: order.building,
        phone: order.shipping_phone
      }

      // Clean up redundant fields
      delete order.shipping_name
      delete order.postalcode
      delete order.prefecture
      delete order.city
      delete order.town
      delete order.building
      delete order.shipping_phone

      return res.status(200).json(order)
    }

    if (req.method === 'PUT') {
      const { status } = req.body

      if (!status || !['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'paid'].includes(status)) {
        return res.status(400).json({ error: 'Valid status is required' })
      }

      try {
        // Check if order exists
        const [existingRows] = await conn.execute('SELECT orderid FROM `Order` WHERE orderid = ?', [orderid])
        if (!Array.isArray(existingRows) || (existingRows as any).length === 0) {
          return res.status(404).json({ error: 'Order not found' })
        }

        // Update order status
        const [updateResult] = await conn.execute(
          'UPDATE `Order` SET status = ?, updatedat = NOW() WHERE orderid = ?',
          [status, orderid]
        )

        if ((updateResult as any).affectedRows === 0) {
          return res.status(404).json({ error: 'Order not found' })
        }

        return res.status(200).json({
          message: 'Order status updated successfully',
          orderid,
          status
        })
      } catch (updateError) {
        console.error('Error updating order status:', updateError)
        return res.status(500).json({ error: 'Failed to update order status' })
      }
    }

    if (req.method === 'DELETE') {
      await conn.beginTransaction()

      try {
        // Check if order exists
        const [existingRows] = await conn.execute('SELECT orderid FROM `Order` WHERE orderid = ?', [orderid])
        if (!Array.isArray(existingRows) || (existingRows as any).length === 0) {
          await conn.rollback()
          return res.status(404).json({ error: 'Order not found' })
        }

        // Delete order items first (foreign key constraint)
        await conn.execute('DELETE FROM OrderItem WHERE orderid = ?', [orderid])

        // Delete the order
        const [deleteResult] = await conn.execute('DELETE FROM `Order` WHERE orderid = ?', [orderid])

        if ((deleteResult as any).affectedRows === 0) {
          await conn.rollback()
          return res.status(404).json({ error: 'Order not found' })
        }

        await conn.commit()
        return res.status(200).json({ message: 'Order deleted successfully' })
      } catch (transactionError) {
        await conn.rollback()
        console.error('Transaction error deleting order:', transactionError)
        return res.status(500).json({ error: 'Failed to delete order' })
      }
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
    
  } catch (error) {
    console.error('Admin order by ID handler error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}