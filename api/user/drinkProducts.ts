import { VercelRequest, VercelResponse } from "@vercel/node";
import { getConnection } from "../lib/db_conn";

export default async function drinkProducts(req: VercelRequest, res: VercelResponse) {
    try {
        const connection = await getConnection();
        
        // Join DrinkProduct with Product table to get product details
        const [rows] = await connection.execute(`SELECT 
                dp.productid, dp.quantity,
                p.name, p.price, p.category, p.description
            FROM DrinkProduct dp
            INNER JOIN Product p ON dp.productid = p.productid`);
            
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching drink products:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}