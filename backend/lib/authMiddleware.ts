import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export interface AuthRequest extends VercelRequest {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

export function verifyToken(
  req: AuthRequest,
  res: VercelResponse,
  requiredRole?: string
): boolean {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/token=([^;]+)/);
  if (!match) {
    res.status(401).json({ message: "Missing or invalid token" });
    return false;
  }

  const token = match[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest["user"];
    req.user = decoded;

    if (requiredRole && (!decoded || decoded.role !== requiredRole)) {
      res.status(403).json({ message: "Forbidden" });
      return false;
    }

    return true;
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
    return false;
  }
}
