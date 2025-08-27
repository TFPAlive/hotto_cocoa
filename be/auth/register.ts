import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcrypt";
import { getConnection } from "../lib/db_conn";
import { createAuthCookie } from "../lib/authentication";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { username, email, password } = req.body;

  try {
    const conn = await getConnection();
    const passwordHash = await bcrypt.hash(password, 10);

    await conn.execute(
      `INSERT INTO User (username, email, password_hash, role) VALUES (?, ?, ?, 'user')`,
      [username, email, passwordHash]
    );

    const [rows]: any = await conn.execute(
      `SELECT * FROM User WHERE email = ?`,
      [email]
    );
    const newUser = rows[0];

    return res.json(createAuthCookie(res, {
      userId: newUser.user_id,
      email: newUser.email,
      role: newUser.role
    }));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
