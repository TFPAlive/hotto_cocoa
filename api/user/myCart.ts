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
            "SELECT ci.cartitemid, ci.drinkid, d.name, d.description, d.baseprice AS price, ci.quantity " +
            "FROM CartItem ci " +
            "JOIN Cart c ON ci.cartid = c.cartid " +
            "JOIN Drink d ON ci.drinkid = d.drinkid " +
            "WHERE c.userid = ?",
            [userId]
        );
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
}