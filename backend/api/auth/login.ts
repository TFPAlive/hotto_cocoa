import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getConnection } from "../../../lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { identifier, password } = req.body;

  function isEmail(str: string) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(str);
  }

  try {
    const conn = await getConnection();
    const field = isEmail(identifier) ? "email" : "username";
    const [rows]: any = await conn.execute(
      `SELECT * FROM User WHERE ${field} = ?`,
      [identifier]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.user_id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.json({ token, role: user.role });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
