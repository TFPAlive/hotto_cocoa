import { getConnection } from "../lib/db";
import type { VercelResponse } from "@vercel/node";
import type { AuthRequest } from "../lib/authMiddleware";

export default async function products(req: AuthRequest, res: VercelResponse) {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute("SELECT * FROM Product");
    console.log("fetched");
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}