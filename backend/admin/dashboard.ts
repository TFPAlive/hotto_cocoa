import type { VercelResponse } from "@vercel/node";
import { verifyToken } from "../../lib/authMiddleware";
import type { AuthRequest } from "../../lib/authMiddleware";

export default async function handler(req: AuthRequest, res: VercelResponse) {
  if (!verifyToken(req, res)) return;

  // only admins can access
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: admin only" });
  }

  // example secure data
  return res.json({ message: "Welcome Admin!", user: req.user });
}