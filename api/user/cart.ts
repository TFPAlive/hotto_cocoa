import { VercelRequest,VercelResponse } from "@vercel/node";
import { getConnection } from "../lib/db_conn";

export default async function cart(req: VercelRequest, res: VercelResponse) {
    try {
        const connection = await getConnection();
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: "Missing userId parameter" });
        }
        const [rows] = await connection.execute(
            "SELECT c.id as cartId, p.id as productId, p.name, p.description, p.price, p.imageUrl, c.quantity FROM Cart c JOIN Product p ON c.productId = p.id WHERE c.userId = ?",
            [userId]
        );
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
}