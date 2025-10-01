import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../../lib/db_conn'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'GET') {
        try {
            const conn = await getConnection()
            const [rows] = await conn.query('SELECT * FROM carts')
            res.status(200).json(rows)
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch carts' })
        }
    } else {
        res.setHeader('Allow', ['GET'])
        res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}