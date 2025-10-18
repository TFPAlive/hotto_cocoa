import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcrypt";
import { getConnection } from "../lib/db_conn";
import { createAuthCookie, clearAuthCookie, AuthRequest, verifyToken } from "../lib/auth";

function isEmail(str: string) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(str); }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Determine action by query param `action` or by method + path
  const action = (req.query && (req.query as any).action) ? String((req.query as any).action) : null;

  // If action not provided, infer from method + known endpoints
  // POST /api/auth?action=login -> login
  // POST /api/auth?action=register -> register
  // POST /api/auth?action=logout -> logout
  // GET /api/auth?action=me -> me

  if (action === 'login' || (!action && req.method === 'POST' && req.url && req.url.includes('login'))) {
    // LOGIN
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method not allowed" });
    }

    const { identifier, password } = req.body;

    try {
      const conn = await getConnection();
      const field = isEmail(identifier) ? "email" : "username";
      const [rows]: any = await conn.execute(`SELECT * FROM User WHERE ${field} = ?`, [identifier]);

      if (rows.length === 0) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const user = rows[0];
      const match = await bcrypt.compare(password, user.passwordhash);
      if (!match) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      return res.json(createAuthCookie(res, { userid: user.userid, email: user.email, role: user.role }));
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  }

  if (action === 'register' || (!action && req.method === 'POST' && req.url && req.url.includes('register'))) {
    // REGISTER
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method not allowed" });
    }

    const { username, email, password } = req.body;

    try {
      const conn = await getConnection();
      const passwordHash = await bcrypt.hash(password, 10);

      await conn.execute( `INSERT INTO User (username, email, passwordhash, role) VALUES (?, ?, ?, 'user')`, [username, email, passwordHash] );

      const [rows]: any = await conn.execute( `SELECT * FROM User WHERE email = ?`, [email] );
      const newUser = rows[0];

      return res.json(createAuthCookie(res, { userid: newUser.userid, email: newUser.email, role: newUser.role }));
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  }

  if (action === 'logout' || (!action && req.method === 'POST' && req.url && req.url.includes('logout'))) {
    // LOGOUT
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method not allowed" });
    }

    clearAuthCookie(res);
    return res.json({ message: "Logged out" });
  }

  if (action === 'me' || (!action && req.method === 'GET' && req.url && req.url.includes('me'))) {
    // ME
    // Note: use verifyToken to parse cookie
    const result = verifyToken(req as AuthRequest);

    if (!result.ok) {
      return res.json({ user: { role: "guest" } });
    }

    try {
      const connection = await getConnection();

      if (!result.user || !result.user.userid) {
        return res.json({ user: { role: "guest" } });
      }

      const [rows] = await connection.execute<any[]>( "SELECT userid, username, email, imageurl, role FROM User WHERE userid = ?", [result.user.userid] );

      if (!rows || rows.length === 0) {
        return res.json({ user: { role: "guest" } });
      }

      return res.json({ user: rows[0] });
    } catch (err) {
      console.error("Error fetching user in /me:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // If none matched
  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(400).json({ error: 'Unknown auth action' })
}
