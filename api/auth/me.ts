import type { VercelResponse } from "@vercel/node";
import { AuthRequest, verifyToken } from "../lib/authMiddleware";

export default function handler(req: AuthRequest, res: VercelResponse) {
 const result = verifyToken(req);
 
  if (!result.ok) {
    return res.json({ user: { role: "guest" } });
  }
  return res.json({ user: result.user });
}
