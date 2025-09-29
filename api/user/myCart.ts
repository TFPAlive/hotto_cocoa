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
            `SELECT ci.cartitemid, ci.drinkid, ci.quantity, ci.price, ud.name, d.imageurl
            FROM CartItem ci
            JOIN Drink d ON ci.drinkid = d.drinkid
            JOIN UserDrink ud ON ci.drinkid = ud.drinkid
            WHERE c.userid = ?`,
            [userId]
        );
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
}