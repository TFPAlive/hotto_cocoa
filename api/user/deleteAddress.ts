import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', ['POST','DELETE'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const body = req.body || {}
    const addressid = Number(body.addressid || body.id)
    const userid = Number(body.userid)

    if (!addressid || !Number.isInteger(addressid) || addressid <= 0) {
      return res.status(400).json({ error: 'Invalid address id' })
    }

    if (!userid || !Number.isInteger(userid) || userid <= 0) {
      return res.status(400).json({ error: 'Invalid user id' })
    }

    const conn = await getConnection()
    const [result] = await conn.execute('DELETE FROM Address WHERE addressid = ? AND userid = ?', [addressid, userid])

    // result may be OKPacket; return success
    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Error deleting address:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
