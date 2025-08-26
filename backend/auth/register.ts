import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getConnection } from "..//lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret"; // make sure this matches login.ts

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { username, email, password } = req.body;

  const conn = await getConnection();
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Insert new user
    const [result]: any = await conn.execute(
      "INSERT INTO User (username, email, password_hash) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );

    const userId = result.insertId;

    // Build JWT payload
    const token = jwt.sign(
      { userId, email, role: "user" }, // default role "user", adjust if you have roles table
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Return token + role like login.ts
    return res.status(201).json({
      message: "User registered and logged in successfully",
      token,
      role: "user",
    });
  } catch (err: any) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Email already registered" });
    }
    return res.status(500).json({ message: "Registration failed", error: err });
  }
}
