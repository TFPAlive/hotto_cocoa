import type { VercelResponse } from "@vercel/node";
import { AuthRequest, verifyToken } from "../lib/authMiddleware";

export default function handler(req: AuthRequest, res: VercelResponse) {
  try {
    if (!verifyToken(req, res)) {
      // Not logged in → return guest user
      return res.json({ user: { role: "guest" } });
    }
    return res.json({ user: req.user });
  } catch {
    return res.json({ user: { role: "guest" } });
  }
}
