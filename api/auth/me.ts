import type { VercelResponse } from "@vercel/node";
import { AuthRequest, verifyToken } from "../lib/authMiddleware";

export default function handler(req: AuthRequest, res: VercelResponse) {
  if (!verifyToken(req, res)) return;
  return res.json({ user: req.user });
}
