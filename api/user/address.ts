import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'
import type { Address } from '../../src/types'

// Routes supported:
// GET  -> /api/user/address?userid=123                      (list addresses)
// POST -> /api/user/address?action=add                      (body: address fields + userid)
// POST -> /api/user/address?action=delete                   (body: { addressid, userid })
// DELETE -> /api/user/address?action=delete                 (body or query: { addressid, userid })
// POST -> /api/user/address?action=setDefault               (body: { addressid, userid })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // LIST ADDRESSES
    if (req.method === 'GET') {
      const connection = await getConnection()
      const { userid } = req.query
      if (!userid) return res.status(400).json({ error: 'Missing userid parameter' })

      const [rows] = await connection.execute('SELECT * FROM Address a where a.userid = ?', [userid])
      return res.status(200).json(rows)
    }

    // For modifying actions use POST or DELETE
    if (req.method === 'POST' || req.method === 'DELETE') {
      const q = req.query || {}
      const action = String((q as any).action || (req.method === 'DELETE' ? 'delete' : 'add'))

      // ADD ADDRESS
      if (action === 'add') {
        if (req.method !== 'POST') {
          res.setHeader('Allow', ['POST'])
          return res.status(405).end(`Method ${req.method} Not Allowed`)
        }

        try {
          const body = req.body || {}
          const address = {
            userid: 0,
            name: String(body.name || '').trim(),
            postalcode: String(body.postalcode || '').trim(),
            prefecture: String(body.prefecture || '').trim(),
            city: String(body.city || '').trim(),
            town: String(body.town || '').trim(),
            building: String(body.building || '').trim(),
            phone: String(body.phone || '').trim(),
            isdefault: Boolean(body.isdefault) || false
          } as Address

          const userid = Number(body.userid || body.id)
          if (!userid || !Number.isInteger(userid) || userid <= 0) {
            return res.status(400).json({ error: 'Invalid user ID' })
          }

          const conn = await getConnection()
          let insertId: number | null = null
          try {
            await conn.beginTransaction()

            if (address.isdefault) {
              await conn.execute('UPDATE Address SET isdefault = 0 WHERE userid = ?', [userid])
            }

            const [result] = await conn.execute(
              'INSERT INTO Address (userid, name, postalcode, prefecture, city, town, building, phone, isdefault) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [userid, address.name, address.postalcode, address.prefecture, address.city, address.town, address.building, address.phone, address.isdefault] as any
            )

            // @ts-ignore
            insertId = (result as any).insertId || null

            await conn.commit()
          } catch (txErr) {
            console.error('Transaction error when adding address:', txErr)
            try { await conn.rollback() } catch (rbErr) { console.error('Rollback error:', rbErr) }
            return res.status(500).json({ error: 'Failed to add address' })
          }

          return res.status(201).json({ address })
        } catch (error) {
          console.error('Error adding address:', error)
          return res.status(500).json({ error: 'Internal Server Error' })
        }
      }

      // DELETE ADDRESS
      if (action === 'delete') {
        try {
          const body = req.body || {}
          const addressid = Number(body.addressid || body.id || req.query.addressid)
          const userid = Number(body.userid || req.body.userid || req.query.userid)

          if (!addressid || !Number.isInteger(addressid) || addressid <= 0) {
            return res.status(400).json({ error: 'Invalid address id' })
          }
          if (!userid || !Number.isInteger(userid) || userid <= 0) {
            return res.status(400).json({ error: 'Invalid user id' })
          }

          const conn = await getConnection()
          await conn.execute('DELETE FROM Address WHERE addressid = ? AND userid = ?', [addressid, userid])

          return res.status(200).json({ success: true })
        } catch (err) {
          console.error('Error deleting address:', err)
          return res.status(500).json({ error: 'Internal Server Error' })
        }
      }

      // SET DEFAULT ADDRESS
      if (action === 'setDefault') {
        if (req.method !== 'POST') {
          res.setHeader('Allow', ['POST'])
          return res.status(405).end(`Method ${req.method} Not Allowed`)
        }

        try {
          const body = req.body || {}
          const userid = Number(body.userid || body.userId)
          const addressid = Number(body.addressid || body.addressId)

          if (!userid || !Number.isInteger(userid) || userid <= 0) {
            return res.status(400).json({ error: 'Invalid user ID' })
          }
          if (!addressid || !Number.isInteger(addressid) || addressid <= 0) {
            return res.status(400).json({ error: 'Invalid address ID' })
          }

          const conn = await getConnection()
          try {
            await conn.beginTransaction()

            await conn.execute('UPDATE Address SET isdefault = 0 WHERE userid = ?', [userid])

            const [updateResult] = await conn.execute(
              'UPDATE Address SET isdefault = 1 WHERE addressid = ? AND userid = ?',
              [addressid, userid]
            )

            // @ts-ignore
            const affectedRows = (updateResult as any).affectedRows || 0
            if (affectedRows === 0) {
              await conn.rollback()
              return res.status(404).json({ error: 'Address not found for this user' })
            }

            await conn.commit()
            return res.status(200).json({ success: true })
          } catch (txErr) {
            console.error('Transaction error in setDefaultAddress:', txErr)
            try { await conn.rollback() } catch (rbErr) { console.error('Rollback error:', rbErr) }
            return res.status(500).json({ error: 'Failed to set default address' })
          }
        } catch (err) {
          console.error('Error in setDefault handler:', err)
          return res.status(500).json({ error: 'Internal Server Error' })
        }
      }

      return res.status(400).json({ error: 'Unknown action' })
    }

    res.setHeader('Allow', ['GET','POST','DELETE'])
    return res.status(405).end()
  } catch (err) {
    console.error('Address handler error:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
