import type { VercelResponse } from "@vercel/node";
import { AuthRequest, verifyToken } from "../lib/authMiddleware";
import { getConnection } from "../lib/db_conn";

export default async function handler(req: AuthRequest, res: VercelResponse) {
  const result = verifyToken(req);

  if (!result.ok) {
    return res.json({ user: { role: "guest" } });
  }

  try {
    const connection = await getConnection();

    // Assuming your JWT payload has `id` or `userId`
    if (!result.user || !result.user.userid) {
      return res.json({ user: { role: "guest" } });
    }

    const [rows] = await connection.execute<any[]>(
      "SELECT userid, username, email, imageurl, role FROM User WHERE userid = ?",
      [result.user.userid] // adjust to match your JWT payload
    );

    if (!rows || rows.length === 0) {
      return res.json({ user: { role: "guest" } });
    }
    // Merge DB user data
    return res.json({ user: rows[0] });
  } catch (err) {
    console.error("Error fetching user in /me:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
