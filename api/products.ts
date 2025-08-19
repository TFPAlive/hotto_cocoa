import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load .env (only in local dev, Vercel/Cloud handles it automatically)
dotenv.config();

export default async function handler(req: any, res: any) {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });

    const [rows] = await connection.query("SELECT * FROM Product");
    await connection.end();

    res.status(200).json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}