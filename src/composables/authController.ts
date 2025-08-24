import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getConnection } from "../../lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export async function registerUser(req: Request, res: Response) {
  const { username, email, password } = req.body;

  try {
    const conn = await getConnection();

    // check if user exists
    const [rows]: any = await conn.execute("SELECT id FROM User WHERE email = ?", [email]);
    if (rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await conn.execute("INSERT INTO User (username, email, password_hash) VALUES (?, ?, ?)", [
      username.value,
      email.value,
      hashedPassword,
    ]);

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

export async function loginUser(req: Request, res: Response) {
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

    const token = jwt.sign({ userId: user.user_id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}
