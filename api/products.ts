import type { VercelRequest, VercelResponse } from '@vercel/node'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    })

    const [rows] = await connection.query('SELECT * FROM Product')
    await connection.end()

    res.status(200).json(rows)   // ✅ Vercel will return JSON
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}