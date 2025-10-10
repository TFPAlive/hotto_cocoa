import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConnection } from '../lib/db_conn';

export default async function addresses(req: VercelRequest, res: VercelResponse) {
    try {
        const connection = await getConnection();
        const { userid } = req.query;
        if (!userid) {
            return res.status(400).json({ error: "Missing userid parameter" });
        }
        const [rows] = await connection.execute("SELECT * FROM Address a where a.userid = ?", [userid])
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
}