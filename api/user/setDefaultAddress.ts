import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

      // Clear previous defaults for the user
      await conn.execute('UPDATE Address SET isdefault = 0 WHERE userid = ?', [userid])

      // Set the requested address as default (ensure it belongs to the user)
      const [updateResult] = await conn.execute(
        'UPDATE Address SET isdefault = 1 WHERE addressid = ? AND userid = ?',
        [addressid, userid]
      )

      // @ts-ignore
      const affectedRows = (updateResult as any).affectedRows || 0
      if (affectedRows === 0) {
        // No row updated (address not found or not belonging to user)
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
    console.error('Error in setDefaultAddress handler:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
