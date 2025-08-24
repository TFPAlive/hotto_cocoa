import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcrypt";
import { getConnection } from "../../lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { username, email, password } = req.body;

  const conn = await getConnection();
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await conn.execute(
      "INSERT INTO User (username, email, password_hash) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );
    res.status(201).json({ message: "User registered successfully" });
  } catch (err: any) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Email already registered" });
    }
    throw err;
  }
}
