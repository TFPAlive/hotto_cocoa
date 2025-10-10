import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'
import type { Address } from '../../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
		res.setHeader('Allow', ['POST'])
		return res.status(405).end(`Method ${req.method} Not Allowed`)
	}

    try {
        const body = req.body || {}
        const address = {
            userid: 0, // Placeholder, will be set after validation
            name: String(body.name || '').trim(),
            postalcode: String(body.postalcode || '').trim(),
            prefecture: String(body.prefecture || '').trim(),
            city: String(body.city || '').trim(),
            town: String(body.town || '').trim(),
            building: String(body.building || '').trim(),
            phone: String(body.phone || '').trim(),
            isdefault: Boolean(body.isdefault) || false
        } as Address

        // Client sends `userid` (useAddAddress uses this key)
        const userid = Number(body.userid || body.id)
        if (!userid || !Number.isInteger(userid) || userid <= 0) {
            return res.status(400).json({ error: 'Invalid user ID' })
        }

        const conn = await getConnection()

        // If the new address should be default, clear existing defaults for the user within a transaction
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

            // @ts-ignore - result typing depends on mysql driver
            insertId = (result as any).insertId || null

            await conn.commit()
        } catch (txErr) {
            console.error('Transaction error when adding address:', txErr)
            try {
                await conn.rollback()
            } catch (rbErr) {
                console.error('Rollback error:', rbErr)
            }
            return res.status(500).json({ error: 'Failed to add address' })
        }

        res.status(201).json({ addressid: insertId, ...address })
    } catch (error) {
        console.error('Error adding address:', error)
        res.status(500).json({ error: 'Internal Server Error' })
    }
}
