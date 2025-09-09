import type { VercelResponse } from "@vercel/node";
import { AuthRequest, verifyToken } from "../lib/authMiddleware";

export default function handler(req: AuthRequest, res: VercelResponse) {
  if (!verifyToken(req, "admin")) return;

  return res.json({
    message: "Welcome Admin!",
    user: req.user,
  });
}