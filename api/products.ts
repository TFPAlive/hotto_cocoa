import { Router } from "express"
import mysql from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()

const router = Router()

router.get("/", async (req, res) => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    })
    const [rows] = await connection.query("SELECT * FROM Product")
    await connection.end()
    res.json(rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router