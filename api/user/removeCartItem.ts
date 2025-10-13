import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    try {
        const body = req.body || {}
        const cartitemid = Number(body.cartitemid)
        const userid = Number(body.userid)

        if (!cartitemid || !userid) {
            return res.status(400).json({ error: 'cartitemid and userid are required' })
        }

        const conn = await getConnection()
        try {
            await conn.query('START TRANSACTION')

            // verify ownership: join CartItem -> Cart -> userid
            const [rows] = await conn.query(
                `SELECT ci.cartitemid, ci.quantity, c.userid FROM CartItem ci JOIN Cart c ON ci.cartid = c.cartid WHERE ci.cartitemid = ? LIMIT 1`,
                [cartitemid]
            ) as any

            if (!rows || rows.length === 0) {
                await conn.query('ROLLBACK')
                return res.status(404).json({ error: 'Cart item not found' })
            }

            if (Number(rows[0].userid) !== userid) {
                await conn.query('ROLLBACK')
                return res.status(403).json({ error: 'Forbidden' })
            }

            const currentQty = Number(rows[0].quantity)
            if (currentQty <= 1) {
                await conn.query('DELETE FROM CartItem WHERE cartitemid = ?', [cartitemid])
            } else {
                await conn.query('UPDATE CartItem SET quantity = quantity - 1 WHERE cartitemid = ?', [cartitemid])
            }

            await conn.query('COMMIT')
            return res.status(200).json({ success: true })
        } catch (dbErr) {
            console.error('DB error:', dbErr)
            try { await conn.query('ROLLBACK') } catch(_) {}
            return res.status(500).json({ error: 'DB error' })
        }
    } catch (err) {
        console.error('Server error:', err)
        return res.status(500).json({ error: 'Server error' })
    }
}
