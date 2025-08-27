import { getConnection } from "../lib/db_conn";

export default async function products(req, res) {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute("SELECT * FROM Product");

    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}